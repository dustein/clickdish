"""
ClickDish — Serviço de Pagamentos via Mercado Pago.
Encapsula a lógica de criação de pagamentos (PIX e Cartão).
"""
import os
import uuid
import mercadopago
from mercadopago.config import RequestOptions
from dotenv import load_dotenv

load_dotenv()


class PaymentService:
    """Gerencia a criação de pagamentos via SDK do Mercado Pago."""

    def __init__(self):
        access_token = os.getenv("MP_ACCESS_TOKEN")
        if not access_token:
            raise ValueError("MP_ACCESS_TOKEN não definido nas variáveis de ambiente.")
        self.sdk = mercadopago.SDK(access_token)

    def _get_request_options(self, idempotency_key: str | None = None) -> RequestOptions:
        """Gera RequestOptions com header de idempotência obrigatório."""
        request_options = RequestOptions()
        request_options.custom_headers = {
            "x-idempotency-key": idempotency_key or str(uuid.uuid4())
        }
        return request_options

    def create_pix_payment(
        self,
        transaction_amount: float,
        payer_email: str,
        description: str = "ClickDish Premium",
        idempotency_key: str | None = None,
    ) -> dict:
        """
        Cria um pagamento via PIX.

        Retorna:
            dict com payment_id, status, qr_code, qr_code_base64
        """
        payment_data = {
            "transaction_amount": transaction_amount,
            "description": description,
            "payment_method_id": "pix",
            "payer": {
                "email": payer_email,
            },
        }

        request_options = self._get_request_options(idempotency_key)
        result = self.sdk.payment().create(payment_data, request_options)

        response = result.get("response") or {}
        status_code = result.get("status")

        if status_code not in (200, 201):
            error_message = response.get("message", "Erro desconhecido ao criar pagamento PIX.")
            cause = response.get("cause", [])
            return {
                "success": False,
                "error": error_message,
                "cause": cause,
                "status_code": status_code,
            }

        # Extrai dados do QR Code do PIX
        poi = response.get("point_of_interaction", {})
        transaction_data = poi.get("transaction_data", {})

        return {
            "success": True,
            "payment_id": response.get("id"),
            "status": response.get("status"),
            "status_detail": response.get("status_detail"),
            "qr_code": transaction_data.get("qr_code"),
            "qr_code_base64": transaction_data.get("qr_code_base64"),
            "ticket_url": transaction_data.get("ticket_url"),
        }

    def create_card_payment(
        self,
        transaction_amount: float,
        token: str,
        installments: int,
        payment_method_id: str,
        payer_email: str,
        description: str = "ClickDish Premium",
        idempotency_key: str | None = None,
    ) -> dict:
        """
        Cria um pagamento via Cartão de Crédito.

        Args:
            token: Token gerado pelo frontend via MercadoPago.js / Payment Brick
            installments: Número de parcelas
            payment_method_id: Ex: "visa", "master", "amex"

        Retorna:
            dict com payment_id, status, status_detail
        """
        if not token:
            return {
                "success": False,
                "error": "Token do cartão é obrigatório.",
                "status_code": 400,
            }

        payment_data = {
            "transaction_amount": transaction_amount,
            "token": token,
            "description": description,
            "installments": installments,
            "payment_method_id": payment_method_id,
            "payer": {
                "email": payer_email,
            },
        }

        request_options = self._get_request_options(idempotency_key)
        result = self.sdk.payment().create(payment_data, request_options)

        response = result.get("response") or {}
        status_code = result.get("status")

        if status_code not in (200, 201):
            error_message = response.get("message", "Erro desconhecido ao processar cartão.")
            cause = response.get("cause", [])
            return {
                "success": False,
                "error": error_message,
                "cause": cause,
                "status_code": status_code,
            }

        return {
            "success": True,
            "payment_id": response.get("id"),
            "status": response.get("status"),
            "status_detail": response.get("status_detail"),
        }

    def get_payment(self, payment_id: int) -> dict:
        """Consulta o status de um pagamento existente."""
        result = self.sdk.payment().get(payment_id)
        response = result.get("response") or {}
        status_code = result.get("status")

        if status_code != 200:
            return {"success": False, "error": "Pagamento não encontrado.", "status_code": status_code}

        return {
            "success": True,
            "payment_id": response.get("id"),
            "status": response.get("status"),
            "status_detail": response.get("status_detail"),
            "payment_method_id": response.get("payment_method_id"),
            "transaction_amount": response.get("transaction_amount"),
            "payer_email": response.get("payer", {}).get("email"),
        }
