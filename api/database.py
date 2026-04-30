import os
import logging
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

INITIAL_FREE_LIMIT = 2
PREMIUM_MONTHLY_DAILY_LIMIT = 3  # Max analyses per day for monthly subscribers
PREMIUM_ANNUAL_DAILY_LIMIT = 4   # Max analyses per day for annual subscribers

logger = logging.getLogger("clickdish.database")


class DatabaseManager:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(url, key)

    # =========================================================================
    # Access Control
    # =========================================================================

    def check_user_access(self, device_id: str = None, user_id: str = None):
        """
        Verifica acesso com prioridade:
        1. Se tem user_id (Logado) -> Verifica user_profiles.
        2. Se não tem user_id (Anônimo) -> Verifica anonymous_usage.
        """

        # --- FLUXO 1: USUÁRIO LOGADO ---
        if user_id:
            res = self.supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()

            # Se usuário nunca usou, cria o registro inicial
            if not res.data:
                self.supabase.table("user_profiles").insert({
                    "user_id": user_id,
                    "cards_used": 0,
                    "is_premium": False,
                    "plan_type": "free"
                }).execute()
                return True, f"Bem-vindo! {INITIAL_FREE_LIMIT} análises disponíveis."

            user_data = res.data[0]

            # Se for Premium, verifica limite diário
            if user_data.get("is_premium"):
                plan = user_data.get("plan_type", "monthly")
                daily_limit = PREMIUM_ANNUAL_DAILY_LIMIT if plan == "annual" else PREMIUM_MONTHLY_DAILY_LIMIT
                today_count = self.get_daily_analysis_count(user_id)

                if today_count < daily_limit:
                    remaining = daily_limit - today_count
                    return True, f"Premium {plan.capitalize()}: {remaining} análises restantes hoje."

                return False, f"Limite diário de {daily_limit} análises atingido. Tente novamente amanhã!"

            # Se for Free, verifica saldo
            if user_data["cards_used"] < INITIAL_FREE_LIMIT:
                remaining = INITIAL_FREE_LIMIT - user_data["cards_used"]
                return True, f"Usuário Free: Restam {remaining} análises."

            return False, "Limite da conta esgotado. Faça upgrade para Premium."

        # --- FLUXO 2: USUÁRIO ANÔNIMO (DEVICE ID) ---
        if not device_id:
            return False, "É necessário estar logado ou fornecer um Device ID."

        res = self.supabase.table("anonymous_usage").select("*").eq("device_id", device_id).execute()

        if not res.data:
            self.supabase.table("anonymous_usage").insert({
                "device_id": device_id,
                "cards_used": 0
            }).execute()
            return True, f"Visitante: {INITIAL_FREE_LIMIT} análises gratuitas."

        anon_data = res.data[0]
        cards_used = anon_data.get("cards_used", 0)

        if cards_used < INITIAL_FREE_LIMIT:
            return True, f"Visitante: Restam {INITIAL_FREE_LIMIT - cards_used} análises."

        return False, "Limite do dispositivo atingido. Crie uma conta ou assine."

    # =========================================================================
    # Daily Analysis Count (for premium daily limits)
    # =========================================================================

    def get_daily_analysis_count(self, user_id: str) -> int:
        """
        Conta quantas análises o usuário realizou hoje (horário de Brasília — America/Sao_Paulo).
        O limite diário reseta à meia-noite no fuso horário brasileiro.
        Usa a tabela analysis_logs com o índice idx_analysis_logs_user_created.
        """
        from datetime import datetime, timezone
        from zoneinfo import ZoneInfo
        brt = ZoneInfo("America/Sao_Paulo")
        today_str = datetime.now(brt).strftime("%Y-%m-%d")  # "YYYY-MM-DD" in BRT
        # Convert BRT midnight to UTC for the DB query (timestamps stored in UTC)
        midnight_brt = datetime.strptime(today_str, "%Y-%m-%d").replace(tzinfo=brt)
        midnight_utc = midnight_brt.astimezone(timezone.utc).isoformat()

        try:
            res = self.supabase.table("analysis_logs") \
                .select("id", count="exact") \
                .eq("user_id", user_id) \
                .gte("created_at", midnight_utc) \
                .execute()
            return res.count if res.count is not None else 0
        except Exception as e:
            logger.error(f"[DB] Erro ao contar análises diárias para user_id={user_id}: {e}")
            return 0

    # =========================================================================
    # Usage Tracking
    # =========================================================================

    def increment_usage(self, device_id: str = None, user_id: str = None):
        """Incrementa o contador correto (User ou Device)"""
        if user_id:
            res = self.supabase.table("user_profiles").select("cards_used").eq("user_id", user_id).execute()
            if res.data:
                current = res.data[0]["cards_used"]
                self.supabase.table("user_profiles").update({"cards_used": current + 1}).eq("user_id", user_id).execute()
        elif device_id:
            res = self.supabase.table("anonymous_usage").select("cards_used").eq("device_id", device_id).execute()
            if res.data:
                new_count = res.data[0]["cards_used"] + 1
                self.supabase.table("anonymous_usage").update({"cards_used": new_count}).eq("device_id", device_id).execute()

    def save_analysis(self, device_id: str = None, result_json: dict = None, user_id: str = None):
        """Salva o log de análise com referência ao usuário ou device"""
        data = {
            "raw_result": result_json,
            "success": True
        }
        if user_id:
            data["user_id"] = user_id
        if device_id:
            data["device_id"] = device_id

        return self.supabase.table("analysis_logs").insert(data).execute()

    # =========================================================================
    # Premium Management (triggered by Mercado Pago webhooks)
    # =========================================================================

    def _resolve_user_id_by_email(self, email: str) -> str | None:
        """
        Localiza o UUID do usuário Supabase Auth a partir do e-mail.
        Usa a API de administrador (service role) para varrer a lista de usuários.
        Retorna o user UUID como string, ou None se não encontrado.
        """
        try:
            response = self.supabase.auth.admin.list_users()
            users = response if isinstance(response, list) else getattr(response, "users", [])
            for user in users:
                user_email = getattr(user, "email", None) or (user.get("email") if isinstance(user, dict) else None)
                user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
                if user_email and user_email.lower() == email.lower():
                    return str(user_id)
        except Exception as e:
            logger.error(f"[DB] Erro ao buscar usuário por email '{email}': {e}")
        return None

    def grant_premium_by_email(self, email: str, plan_type: str = "monthly") -> dict:
        """
        Ativa o acesso Premium para o usuário identificado pelo e-mail.
        Chamado quando o webhook do Mercado Pago confirma um pagamento aprovado.
        """
        from datetime import datetime, timezone
        from dateutil.relativedelta import relativedelta

        user_id = self._resolve_user_id_by_email(email)

        if not user_id:
            logger.warning(f"[DB] grant_premium: usuário '{email}' não encontrado no Supabase Auth.")
            return {"success": False, "reason": "user_not_found", "email": email}

        now = datetime.now(timezone.utc)
        if plan_type == "annual":
            expires_at = now + relativedelta(years=1)
        else:
            expires_at = now + relativedelta(months=1)

        try:
            res = self.supabase.table("user_profiles").select("user_id, is_premium").eq("user_id", user_id).execute()

            if res.data:
                if res.data[0].get("is_premium"):
                    logger.info(f"[DB] Usuário '{email}' (id={user_id}) já é Premium — sem alterações.")
                    return {"success": True, "reason": "already_premium", "user_id": user_id}

                self.supabase.table("user_profiles").update({
                    "is_premium": True,
                    "plan_type": plan_type,
                    "premium_since": now.isoformat(),
                    "premium_expires_at": expires_at.isoformat(),
                }).eq("user_id", user_id).execute()
                logger.info(f"[DB] ✅ Premium ativado para '{email}' (id={user_id}).")
                return {"success": True, "reason": "premium_granted", "user_id": user_id}
            else:
                # Cria o registro caso o usuário nunca tenha usado o app
                self.supabase.table("user_profiles").insert({
                    "user_id": user_id,
                    "cards_used": 0,
                    "is_premium": True,
                    "plan_type": plan_type,
                    "premium_since": now.isoformat(),
                    "premium_expires_at": expires_at.isoformat(),
                }).execute()
                logger.info(f"[DB] ✅ Registro criado e Premium ativado para '{email}' (id={user_id}).")
                return {"success": True, "reason": "record_created_and_premium_granted", "user_id": user_id}

        except Exception as e:
            logger.error(f"[DB] Erro ao ativar Premium para '{email}': {e}")
            return {"success": False, "reason": "db_error", "error": str(e)}

    def revoke_premium_by_email(self, email: str) -> dict:
        """
        Revoga o acesso Premium do usuário identificado pelo e-mail.
        Chamado quando o webhook do Mercado Pago indica reembolso.
        """
        user_id = self._resolve_user_id_by_email(email)

        if not user_id:
            logger.warning(f"[DB] revoke_premium: usuário '{email}' não encontrado no Supabase Auth.")
            return {"success": False, "reason": "user_not_found", "email": email}

        try:
            res = self.supabase.table("user_profiles").select("user_id, is_premium").eq("user_id", user_id).execute()

            if res.data:
                self.supabase.table("user_profiles").update({
                    "is_premium": False,
                    "plan_type": "free",
                    "premium_expires_at": None,
                }).eq("user_id", user_id).execute()
                logger.info(f"[DB] 🔄 Premium revogado para '{email}' (id={user_id}).")
                return {"success": True, "reason": "premium_revoked", "user_id": user_id}
            else:
                logger.warning(f"[DB] revoke_premium: nenhum registro user_profiles para '{email}' (id={user_id}).")
                return {"success": False, "reason": "no_usage_record", "user_id": user_id}

        except Exception as e:
            logger.error(f"[DB] Erro ao revogar Premium para '{email}': {e}")
            return {"success": False, "reason": "db_error", "error": str(e)}

    # =========================================================================
    # Payment Events (webhook idempotency + audit trail)
    # =========================================================================

    def is_payment_processed(self, mp_payment_id: int) -> bool:
        """Verifica se um pagamento já foi processado (idempotência persistente)."""
        res = self.supabase.table("payment_events").select("id").eq("mp_payment_id", mp_payment_id).execute()
        return bool(res.data)

    def record_payment_event(
        self,
        mp_payment_id: int,
        status: str,
        payer_email: str,
        user_id: str = None,
        status_detail: str = None,
        payment_method: str = None,
        amount: float = None,
        plan_type: str = None,
        action_taken: str = None,
    ) -> dict:
        """Registra um evento de pagamento no banco para auditoria e idempotência."""
        data = {
            "mp_payment_id": mp_payment_id,
            "status": status,
            "payer_email": payer_email,
            "status_detail": status_detail,
            "payment_method": payment_method,
            "amount": amount,
            "plan_type": plan_type,
            "action_taken": action_taken,
        }
        if user_id:
            data["user_id"] = user_id

        try:
            self.supabase.table("payment_events").insert(data).execute()
            return {"success": True}
        except Exception as e:
            # UNIQUE constraint on mp_payment_id will raise on duplicates
            logger.warning(f"[DB] Falha ao registrar payment_event (mp_id={mp_payment_id}): {e}")
            return {"success": False, "error": str(e)}