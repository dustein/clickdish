from fastapi import FastAPI, HTTPException
from database import DatabaseManager

# Inicializa o app e o gerenciador do banco
app = FastAPI(title="ClickDish API")
db = DatabaseManager()

@app.get("/health")
async def health_check():
    """Rota simples para verificar se o servidor está rodando."""
    return {"status": "ok", "message": "Backend operacional"}

@app.get("/check-access/{device_id}")
async def check_access(device_id: str):
    """
    Rota de teste para validar a lógica de acesso.
    Simula o que acontecerá antes de processar uma imagem.
    """
    try:
        can_proceed, message = db.check_access(device_id)
        return {
            "device_id": device_id,
            "allowed": can_proceed,
            "message": message
        }
    except Exception as e:
        # Erro genérico para não expor detalhes do banco no log do cliente
        raise HTTPException(status_code=500, detail="Erro interno ao processar acesso.")

@app.post("/simulate-usage/{device_id}")
async def simulate_usage(device_id: str):
    """
    Rota para testar o incremento de cards usados.
    Útil para você validar se o contador no Supabase está subindo.
    """
    try:
        db.increment_usage(device_id)
        return {"status": "success", "message": "Contador incrementado com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao atualizar contador.")