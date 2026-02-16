import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Configuração Centralizada (Fácil de alterar depois)
INITIAL_FREE_LIMIT = 4 

class DatabaseManager:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(url, key)

    def check_user_access(self, device_id: str):
        """
        Verifica se o usuário pode realizar uma análise baseado no saldo de cards.
        """
        # 1. Busca o dispositivo
        res = self.supabase.table("usage_control").select("*").eq("device_id", device_id).execute()
        
        if not res.data:
            # Usuário novo: Registra com 0 cards usados
            self.supabase.table("usage_control").insert({
                "device_id": device_id, 
                "cards_used": 0  # Agora usamos um contador
            }).execute()
            return True, f"Acesso liberado: Você tem {INITIAL_FREE_LIMIT} análises gratuitas."

        user_status = res.data[0]
        cards_used = user_status.get("cards_used", 0)

        # 2. Verifica se ainda está dentro do limite gratuito
        if cards_used < INITIAL_FREE_LIMIT:
            restantes = INITIAL_FREE_LIMIT - cards_used
            return True, f"Acesso liberado: Restam {restantes} análises gratuitas."

        # 3. Se acabou o free, verifica assinatura ativa
        sub_res = self.supabase.table("subscriptions")\
            .select("status")\
            .eq("device_id", device_id)\
            .eq("status", "active")\
            .execute()

        if sub_res.data:
            return True, "Acesso liberado: Assinante ativo."

        # 4. Bloqueio
        return False, "Limite de testes atingido: Assine para continuar gerando cards."

    def increment_usage(self, device_id: str):
        """Incrementa o contador de cards usados pelo dispositivo"""
        # Primeiro buscamos o valor atual para somar 1
        res = self.supabase.table("usage_control").select("cards_used").eq("device_id", device_id).execute()
        
        if res.data:
            current_count = res.data[0]["cards_used"]
            self.supabase.table("usage_control")\
                .update({"cards_used": current_count + 1})\
                .eq("device_id", device_id)\
                .execute()