import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

INITIAL_FREE_LIMIT = 4 

class DatabaseManager:
    def __init__(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        self.supabase: Client = create_client(url, key)

    def check_user_access(self, device_id: str, user_id: str = None):
        """
        Verifica acesso com prioridade:
        1. Se tem user_id (Logado) -> Verifica conta do usuário.
        2. Se não tem user_id (Anônimo) -> Verifica device_id.
        """
        
        # --- FLUXO 1: USUÁRIO LOGADO ---
        if user_id:
            # Busca registro do usuário
            res = self.supabase.table("usage_control").select("*").eq("user_id", user_id).execute()
            
            # Se usuário nunca usou, cria o registro inicial
            if not res.data:
                self.supabase.table("usage_control").insert({
                    "user_id": user_id, 
                    "cards_used": 0,
                    "is_premium": False 
                }).execute()
                return True, f"Bem-vindo! {INITIAL_FREE_LIMIT} análises disponíveis."
            
            user_data = res.data[0]
            
            # Se for Premium, libera tudo
            if user_data.get("is_premium"):
                return True, "Acesso Premium Ilimitado."
            
            # Se for Free, verifica saldo
            if user_data["cards_used"] < INITIAL_FREE_LIMIT:
                remaining = INITIAL_FREE_LIMIT - user_data["cards_used"]
                return True, f"Usuário Free: Restam {remaining} análises."
            
            return False, "Limite da conta esgotado. Faça upgrade para Premium."

        # --- FLUXO 2: USUÁRIO ANÔNIMO (DEVICE ID) ---
        # Busca registro do device (garantindo que user_id é nulo para não confundir)
        res = self.supabase.table("usage_control").select("*").eq("device_id", device_id).is_("user_id", "null").execute()
        
        if not res.data:
            self.supabase.table("usage_control").insert({
                "device_id": device_id, 
                "cards_used": 0,
                "is_premium": False
            }).execute()
            return True, f"Visitante: {INITIAL_FREE_LIMIT} análises gratuitas."

        anon_data = res.data[0]
        
        cards_used = anon_data.get("cards_used", 0)
        if cards_used < INITIAL_FREE_LIMIT:
            return True, f"Visitante: Restam {INITIAL_FREE_LIMIT - cards_used} análises."

        return False, "Limite do dispositivo atingido. Crie uma conta ou assine."

    def increment_usage(self, device_id: str, user_id: str = None):
        """Incrementa o contador correto (User ou Device)"""
        if user_id:
            res = self.supabase.table("usage_control").select("cards_used").eq("user_id", user_id).execute()
            if res.data:
                current = res.data[0]["cards_used"]
                self.supabase.table("usage_control").update({"cards_used": current + 1}).eq("user_id", user_id).execute()
        elif device_id:
            # Incrementa apenas se for registro anônimo (user_id is null)
            res = self.supabase.table("usage_control").select("cards_used").eq("device_id", device_id).is_("user_id", "null").execute()
            if res.data:
                current = res.data[0]["cards_used"]
                self.supabase.table("usage_control").update({"cards_used": current + 1}).eq("device_id", device_id).is_("user_id", "null").execute()

    def save_analysis(self, device_id: str, result_json: dict, user_id: str = None):
        """Salva o log com referência ao usuário se existir"""
        data = {
            "device_id": device_id, # Mantém device_id para histórico mesmo logado
            "raw_result": result_json,
            "success": True
        }
        if user_id:
            data["user_id"] = user_id
        
        return self.supabase.table("analysis_logs").insert(data).execute()