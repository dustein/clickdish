from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from database import DatabaseManager
from ai_service import AIService
from auth_deps import get_current_user

# ### SEGURANÇA: Imports do Rate Limiter ###
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

# ### SEGURANÇA: Configura o limitador baseando-se no IP do cliente ###
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="ClickDish API")

# ### SEGURANÇA: Registra o limitador no app ###
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuração de CORS (Permite que o Front fale com o Back)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, mudaremos para ["https://seusite.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = DatabaseManager()
ai = AIService()

# Injeta o banco no estado (CRÍTICO para o auth_deps funcionar)
app.state.db = db

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
    # 1. Identifica o usuário
    user_id = user.id if user else None
    
    # 2. Resolve qual device_id usar (Header tem prioridade sobre Query)
    final_device_id = device_id or query_device_id
    
    # --- CORREÇÃO DO ERRO 500 AQUI ---
    # Se o usuário está logado, mas o device_id veio nulo, criamos um ID virtual para ele.
    # Isso evita que o banco de dados quebre por causa da regra de "NOT NULL" no device_id.
    if user_id and not final_device_id:
        final_device_id = f"user_{user_id}"
    # ---------------------------------
    
    # Validação: Precisa de pelo menos um (Login ou Device ID)
    if not user_id and not final_device_id:
        raise HTTPException(status_code=400, detail="É necessário estar logado ou fornecer um Device ID.")

    # 3. Verifica Acesso no Banco
    can_proceed, message = db.check_user_access(device_id=final_device_id, user_id=user_id)
    
    if not can_proceed:
        raise HTTPException(status_code=402, detail=message)

    try:
        # 4. Processamento IA
        image_bytes = await file.read()
        result = await ai.analyze_plate_image(image_bytes)
        
        # 5. Incrementa Uso e Salva Log
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