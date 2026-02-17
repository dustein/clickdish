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
        can_proceed, message = db.check_user_access(device_id)
        return {
            "device_id": device_id,
            "allowed": can_proceed,
            "message": message
        }
    except Exception as e:
        # Erro genérico para não expor detalhes do banco no log do cliente
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/{device_id}")
async def analyze_plate(device_id: str):
    # 1. Primeiro verifica se tem saldo
    can_proceed, message = db.check_user_access(device_id)
    
    if not can_proceed:
        raise HTTPException(status_code=402, detail=message)

    # 2. [Aqui entrará a lógica da IA do Gemini depois]
    
    # 3. Se a análise deu certo, decrementa um crédito
    try:
        db.increment_usage(device_id)
        return {
            "status": "success",
            "message": "Análise realizada!",
            "new_balance": "O contador foi atualizado no banco."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao atualizar consumo.")