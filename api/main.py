from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header, Request, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import logging

from database import DatabaseManager
from ai_service import AIService
from auth_deps import get_current_user
from payment_service import PaymentService
from webhook_handler import verify_webhook_signature, process_payment_notification

# ### SEGURANÇA: Imports do Rate Limiter ###
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

logger = logging.getLogger("clickdish.api")

# ### SEGURANÇA: Configura o limitador baseando-se no IP do cliente ###
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="ClickDish API")

# ### SEGURANÇA: Registra o limitador no app ###
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuração de CORS (Permite que o Front fale com o Back)
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"], # Em produção, mudaremos para ["https://seusite.com"]
    allow_origins=["https://clickdish.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = DatabaseManager()
ai = AIService()

# Inicializa o serviço de pagamentos (falha silenciosamente se MP_ACCESS_TOKEN não estiver definido)
try:
    payment_svc = PaymentService()
except ValueError as e:
    logger.warning(f"PaymentService não inicializado: {e}")
    payment_svc = None

# Injeta o banco no estado (CRÍTICO para o auth_deps funcionar)
app.state.db = db


# ========================================================================
# Modelos de Validação — Pagamentos
# ========================================================================

class PayerModel(BaseModel):
    email: str = Field(..., min_length=5, max_length=256, description="E-mail do comprador")

class PaymentRequest(BaseModel):
    transaction_amount: float = Field(..., gt=0, description="Valor da transação em reais")
    payment_method_id: str = Field(..., min_length=1, description="Método: 'pix', 'visa', 'master', etc.")
    payer: PayerModel
    description: str = Field(default="ClickDish Premium", max_length=256)
    # Campos específicos para Cartão (opcionais, obrigatórios se não for PIX)
    token: Optional[str] = Field(default=None, description="Token do cartão gerado pelo frontend")
    installments: Optional[int] = Field(default=1, ge=1, le=12, description="Parcelas")
    # Idempotência
    idempotency_key: Optional[str] = Field(default=None, description="Chave UUID para evitar duplicatas")

@app.get("/health")
async def health_check():    
    return {"status": "ok", "message": "Backend operacional"}

@app.post("/analyze-dish")
# ### SEGURANÇA: Define o limite (Ex: 5 requisições por minuto por IP) ###
@limiter.limit("3/minute")
async def analyze_dish(
    request: Request, # <--- OBRIGATÓRIO para o limiter funcionar
    file: UploadFile = File(...),
    # Aceita via Header (App/Prod) ou Query (Swagger/Teste)
    device_id: str | None = Header(default=None, alias="X-Device-ID"),
    query_device_id: str | None = Query(default=None, alias="device_id"),
    user = Depends(get_current_user) 
):
    """
    Analisa o prato.
    Prioridade: Usuário Logado > Device ID.
    Segurança: Máximo 5 tentativas/minuto por IP.
    """
    # Resolve qual device_id usar (Header tem prioridade sobre Query)
    final_device_id = device_id or query_device_id
    user_id = user.id if user else None
    
    # Validação: Precisa de pelo menos um (Login ou Device ID)
    if not user_id and not final_device_id:
        raise HTTPException(status_code=400, detail="É necessário estar logado ou fornecer um Device ID.")

    # 1. Verifica Acesso no Banco
    can_proceed, message = db.check_user_access(device_id=final_device_id, user_id=user_id)
    
    if not can_proceed:
        raise HTTPException(status_code=402, detail=message)

    try:
        # 2. Processamento IA
        image_bytes = await file.read()
        result = await ai.analyze_plate_image(image_bytes)
        
        # 3. Incrementa Uso e Salva Log
        db.increment_usage(device_id=final_device_id, user_id=user_id)
        db.save_analysis(device_id=final_device_id, result_json=result, user_id=user_id)

        return {
            "status": "success",
            "analysis": result,
            "user_context": "Registrado" if user_id else "Visitante",
            "credits_update": "Contabilizado."
        }
    except Exception as e:
        print(f"Erro no endpoint: {e}")
        if "429" in str(e): # Erro de cota do Gemini (Google)
            raise HTTPException(status_code=429, detail="O sistema está sobrecarregado. Tente em 1 min.")
        raise HTTPException(status_code=500, detail="Erro interno no servidor.")


# ========================================================================
# ENDPOINT: Processar Pagamento (PIX ou Cartão)
# ========================================================================

@app.post("/api/process_payment")
@limiter.limit("10/minute")
async def process_payment(request: Request, payload: PaymentRequest):
    """
    Processa um pagamento via Mercado Pago.
    Diferencia automaticamente entre PIX e Cartão baseado no payment_method_id.
    """
    if payment_svc is None:
        raise HTTPException(
            status_code=503,
            detail="Serviço de pagamentos indisponível. Verifique MP_ACCESS_TOKEN."
        )

    try:
        if payload.payment_method_id in ("pix", "bank_transfer"):
            # === FLUXO PIX ===
            result = payment_svc.create_pix_payment(
                transaction_amount=payload.transaction_amount,
                payer_email=payload.payer.email,
                description=payload.description,
                idempotency_key=payload.idempotency_key,
            )
        else:
            # === FLUXO CARTÃO ===
            if not payload.token:
                raise HTTPException(
                    status_code=400,
                    detail="Token do cartão é obrigatório para pagamentos com cartão."
                )

            result = payment_svc.create_card_payment(
                transaction_amount=payload.transaction_amount,
                token=payload.token,
                installments=payload.installments or 1,
                payment_method_id=payload.payment_method_id,
                payer_email=payload.payer.email,
                description=payload.description,
                idempotency_key=payload.idempotency_key,
            )

        if not result.get("success"):
            error_status = result.get("status_code", 400)
            logger.error(f"[MP ERROR] Falha no pagamento MP: {result}")
            raise HTTPException(
                status_code=error_status,
                detail={
                    "message": result.get("error", "Erro ao processar pagamento."),
                    "cause": result.get("cause", []),
                }
            )

        return {
            "status": "ok",
            "payment": result,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado no processamento de pagamento: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar pagamento.")


# ========================================================================
# ENDPOINT: Webhook de Notificações do Mercado Pago
# ========================================================================

@app.post("/api/webhooks")
async def handle_webhook(request: Request):
    """
    Recebe notificações de pagamento do Mercado Pago.
    Valida a assinatura x-signature, consulta o status completo
    do pagamento e processa a atualização.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Corpo da requisição inválido.")

    # Extrai headers de segurança
    x_signature = request.headers.get("x-signature", "")
    x_request_id = request.headers.get("x-request-id", "")

    # Tipo da notificação
    action = body.get("action", "")
    data = body.get("data", {})
    data_id = str(data.get("id", ""))
    notification_type = body.get("type", "")

    logger.info(f"[WEBHOOK] Recebido: type={notification_type}, action={action}, data_id={data_id}")

    # Só processa notificações de pagamento
    if notification_type != "payment":
        logger.info(f"[WEBHOOK] Tipo '{notification_type}' ignorado — apenas 'payment' é processado.")
        return JSONResponse(status_code=200, content={"status": "ignored"})

    # Valida assinatura
    if x_signature:
        is_valid = verify_webhook_signature(
            data_id=data_id,
            x_request_id=x_request_id,
            x_signature=x_signature,
        )
        if not is_valid:
            logger.warning(f"[WEBHOOK] Assinatura inválida para payment #{data_id}")
            raise HTTPException(status_code=403, detail="Assinatura inválida.")

    # Consulta o pagamento completo na API do Mercado Pago
    if payment_svc is None:
        logger.error("[WEBHOOK] PaymentService indisponível — não é possível consultar pagamento.")
        return JSONResponse(status_code=200, content={"status": "service_unavailable"})

    payment_info = payment_svc.get_payment(int(data_id))

    if not payment_info.get("success"):
        logger.error(f"[WEBHOOK] Falha ao consultar pagamento #{data_id}: {payment_info}")
        return JSONResponse(status_code=200, content={"status": "payment_not_found"})

    # Processa a notificação (simula atualização no banco)
    result = process_payment_notification(payment_info, db=db)
    logger.info(f"[WEBHOOK] Processamento concluído: {result}")

    # IMPORTANTE: Sempre retornar 200 para o Mercado Pago não reenviar
    return JSONResponse(status_code=200, content={"status": "ok", "result": result})


# ========================================================================
# ENDPOINT: Admin — Lista todos os usuários (apenas steindu@gmail.com)
# ========================================================================

ADMIN_EMAIL = "steindu@gmail.com"

@app.get("/api/admin/users")
async def admin_list_users(request: Request):
    """
    Retorna a lista de todos os usuários registrados.
    Acesso RESTRITO ao email administrador definido em ADMIN_EMAIL.
    Requer Bearer token válido no header Authorization.
    """
    # --- 1. Extrai e valida o token do chamador ---
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token de autenticação não fornecido.")

    token = auth_header.split("Bearer ", 1)[1].strip()

    try:
        caller = db.supabase.auth.get_user(token)
        caller_email = (
            getattr(caller.user, "email", None)
            or (caller.user.get("email") if isinstance(caller.user, dict) else None)
        )
    except Exception as e:
        logger.warning(f"[ADMIN] Falha ao verificar token: {e}")
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

    if caller_email != ADMIN_EMAIL:
        logger.warning(f"[ADMIN] Acesso negado para '{caller_email}'.")
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")

    # --- 2. Busca todos os usuários via Admin API ---
    try:
        response = db.supabase.auth.admin.list_users()
        auth_users = response if isinstance(response, list) else getattr(response, "users", [])
    except Exception as e:
        logger.error(f"[ADMIN] Erro ao listar usuários: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar usuários do Supabase Auth.")

    # --- 3. Busca dados de user_profiles e logs de hoje ---
    try:
        usage_res = db.supabase.table("user_profiles").select("user_id, cards_used, is_premium, plan_type, premium_since, updated_at, created_at").execute()
        usage_map = {row["user_id"]: row for row in (usage_res.data or [])}
    except Exception as e:
        logger.warning(f"[ADMIN] Erro ao buscar user_profiles: {e}")
        usage_map = {}

    from datetime import datetime, timezone
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        logs_res = db.supabase.table("analysis_logs").select("user_id").gte("created_at", today_str).execute()
        logs_today_list = logs_res.data or []
        from collections import Counter
        today_analyses_count = Counter(log["user_id"] for log in logs_today_list if log.get("user_id"))
    except Exception as e:
        logger.warning(f"[ADMIN] Erro ao buscar analysis_logs de hoje: {e}")
        today_analyses_count = {}

    # --- 4. Junta os dados e monta a resposta ---
    users_list = []
    for u in auth_users:
        uid = str(getattr(u, "id", "") or (u.get("id") if isinstance(u, dict) else ""))
        email = str(getattr(u, "email", "") or (u.get("email") if isinstance(u, dict) else "") or "")
        
        meta = getattr(u, "user_metadata", {}) or (u.get("user_metadata") if isinstance(u, dict) else {}) or {}
        name = meta.get("full_name") or meta.get("name") or email.split("@")[0]

        created_at = str(
            getattr(u, "created_at", "") or (u.get("created_at") if isinstance(u, dict) else "") or ""
        )
        last_sign_in = str(
            getattr(u, "last_sign_in_at", "") or (u.get("last_sign_in_at") if isinstance(u, dict) else "") or ""
        )

        usage = usage_map.get(uid, {})
        is_premium = usage.get("is_premium", False)
        plan_type = usage.get("plan_type") or ("monthly" if is_premium else "free")
        cards_used = usage.get("cards_used", 0)
        
        subscription_date = usage.get("premium_since") or usage.get("updated_at") or usage.get("created_at") or ""
        analyses_today = today_analyses_count.get(uid, 0)

        users_list.append({
            "id": uid,
            "name": name,
            "email": email,
            "registered_at": created_at,
            "last_sign_in": last_sign_in,
            "total_analyses": cards_used,
            "analyses_today": analyses_today,
            "is_premium": is_premium,
            "plan_type": plan_type,
            "subscription_date": subscription_date,
        })

    # Sort: most recently registered first
    users_list.sort(key=lambda x: x["registered_at"], reverse=True)

    logger.info(f"[ADMIN] {len(users_list)} usuários retornados para '{caller_email}'.")
    return {"users": users_list, "total": len(users_list)}