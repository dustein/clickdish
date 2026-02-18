from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

# Define o esquema de segurança (Bearer Token)
security = HTTPBearer(auto_error=False)

def get_current_user(request: Request, token: HTTPAuthorizationCredentials = Security(security)):
    """
    Verifica o token JWT no header 'Authorization'.
    Retorna o objeto User do Supabase se válido, ou None se anônimo.
    """
    if not token:
        return None
    
    try:
        # Acessa o cliente Supabase injetado no estado da aplicação (main.py)
        supabase_client: Client = request.app.state.db.supabase
        
        # Valida o token chamando o Supabase Auth
        response = supabase_client.auth.get_user(token.credentials)
        
        if response and response.user:
            return response.user
            
    except Exception as e:
        print(f"Erro na validação do token: {e}")
        return None
    
    return None