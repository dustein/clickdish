"""
ClickDish — Handler de Webhooks do Mercado Pago.
Processa notificações de pagamento com validação de assinatura
e idempotência persistente via tabela payment_events.
"""
import os
import hmac
import hashlib
import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from dotenv import load_dotenv

if TYPE_CHECKING:
    from database import DatabaseManager

load_dotenv()

logger = logging.getLogger("clickdish.webhooks")
logging.basicConfig(level=logging.INFO)


def verify_webhook_signature(
    data_id: str,
    x_request_id: str,
    x_signature: str,
) -> bool:
    """
    Valida a assinatura x-signature enviada pelo Mercado Pago.

    Formato do x-signature: "ts=<timestamp>,v1=<hash>"
    O hash esperado é HMAC-SHA256 sobre o template:
        "id:{data_id};request-id:{x_request_id};ts:{ts};"

    Retorna True se a assinatura é válida.
    """
    webhook_secret = os.getenv("MP_WEBHOOK_SECRET", "")
    if not webhook_secret:
        logger.warning("MP_WEBHOOK_SECRET não configurado — pulando validação de assinatura.")
        # Em ambiente de desenvolvimento, permite prosseguir sem secret
        return True

    try:
        # Parse do header: "ts=1234567890,v1=abc123..."
        parts = {}
        for segment in x_signature.split(","):
            key_value = segment.strip().split("=", 1)
            if len(key_value) == 2:
                parts[key_value[0]] = key_value[1]

        ts = parts.get("ts", "")
        received_hash = parts.get("v1", "")

        if not ts or not received_hash:
            logger.error("x-signature malformado: campos ts ou v1 ausentes.")
            return False

        # Monta o template conforme documentação do MP
        manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"

        # Calcula HMAC-SHA256
        expected_hash = hmac.new(
            webhook_secret.encode("utf-8"),
            manifest.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(received_hash, expected_hash)

    except Exception as e:
        logger.error(f"Erro ao verificar assinatura do webhook: {e}")
        return False


def process_payment_notification(payment_data: dict, db: "DatabaseManager" = None) -> dict:
    """
    Processa uma notificação de pagamento do Mercado Pago e atualiza o banco.

    Idempotência: Usa a tabela payment_events (UNIQUE mp_payment_id) em vez de um set() em memória.

    Args:
        payment_data: Dados do pagamento obtidos via GET /v1/payments/{id}
        db: Instância do DatabaseManager para persistir alterações de Premium.

    Retorna:
        dict com o resultado do processamento.
    """
    payment_id = payment_data.get("payment_id") or payment_data.get("id")
    status = payment_data.get("status")
    status_detail = payment_data.get("status_detail")
    payment_method = payment_data.get("payment_method_id")
    amount = payment_data.get("transaction_amount")
    payer_email = payment_data.get("payer_email") or payment_data.get("payer", {}).get("email", "N/A")

    # Idempotência persistente: verifica no banco
    if db and db.is_payment_processed(payment_id):
        logger.info(f"[WEBHOOK] Pagamento #{payment_id} já processado — ignorando duplicata.")
        return {
            "processed": False,
            "reason": "duplicate",
            "payment_id": payment_id,
        }

    timestamp = datetime.now(timezone.utc).isoformat()

    logger.info(f"[WEBHOOK] === Notificação de Pagamento ===")
    logger.info(f"[WEBHOOK] Payment ID: {payment_id}")
    logger.info(f"[WEBHOOK] Status: {status} ({status_detail})")
    logger.info(f"[WEBHOOK] Método: {payment_method}")
    logger.info(f"[WEBHOOK] Valor: R$ {amount}")
    logger.info(f"[WEBHOOK] Payer: {payer_email}")
    logger.info(f"[WEBHOOK] Timestamp: {timestamp}")

    action_taken = "unknown_status"
    user_id = None

    # Lógica de negócios baseada no status
    if status == "approved":
        logger.info(f"[WEBHOOK] ✅ Pagamento APROVADO — ativar Premium para {payer_email}")
        action_taken = "premium_activated"
        if db:
            db_result = db.grant_premium_by_email(payer_email)
            user_id = db_result.get("user_id")
            if db_result.get("success"):
                logger.info(f"[WEBHOOK] 🏆 Premium ativado no banco: {db_result}")
            else:
                logger.error(f"[WEBHOOK] ⚠️ Falha ao ativar Premium no banco: {db_result}")
        else:
            logger.warning("[WEBHOOK] db não fornecido — Premium NÃO foi persistido no banco.")

    elif status == "pending":
        logger.info(f"[WEBHOOK] ⏳ Pagamento PENDENTE — aguardando confirmação")
        action_taken = "awaiting_confirmation"

    elif status in ("rejected", "cancelled"):
        logger.info(f"[WEBHOOK] ❌ Pagamento REJEITADO/CANCELADO — motivo: {status_detail}")
        action_taken = "payment_failed"

    elif status == "refunded":
        logger.info(f"[WEBHOOK] 🔄 Pagamento REEMBOLSADO — revogar Premium para {payer_email}")
        action_taken = "premium_revoked"
        if db:
            db_result = db.revoke_premium_by_email(payer_email)
            user_id = db_result.get("user_id")
            if db_result.get("success"):
                logger.info(f"[WEBHOOK] 🔄 Premium revogado no banco: {db_result}")
            else:
                logger.error(f"[WEBHOOK] ⚠️ Falha ao revogar Premium no banco: {db_result}")
        else:
            logger.warning("[WEBHOOK] db não fornecido — Premium NÃO foi revogado no banco.")

    else:
        logger.info(f"[WEBHOOK] ℹ️ Status não mapeado: {status}")

    # Registra o evento de pagamento no banco (idempotência + auditoria)
    if db:
        db.record_payment_event(
            mp_payment_id=payment_id,
            status=status,
            payer_email=payer_email,
            user_id=user_id,
            status_detail=status_detail,
            payment_method=payment_method,
            amount=amount,
            action_taken=action_taken,
        )

    logger.info(f"[WEBHOOK] === Fim da Notificação ===\n")

    return {
        "processed": True,
        "payment_id": payment_id,
        "status": status,
        "action": action_taken,
    }
