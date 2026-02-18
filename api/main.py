from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from database import DatabaseManager
from ai_service import AIService

load_dotenv()

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



@app.get("/test-increment/{device_id}")
async def test_increment(device_id: str):
    """
    Rota temporária para testar se o contador de cards está subindo no Supabase.
    """
    try:
        # 1. Incrementa o uso no banco
        db.increment_usage(device_id)
        
        # 2. Busca o novo valor para confirmar
        res = db.supabase.table("usage_control").select("cards_used").eq("device_id", device_id).execute()
        novo_valor = res.data[0]["cards_used"] if res.data else "Erro"
        
        return {
            "status": "success",
            "device_id": device_id,
            "novo_contador": novo_valor,
            "proximo_passo": "Verifique se o valor mudou no painel do Supabase"
        }
    except Exception as e:
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



ai = AIService()

@app.post("/analyze-dish/{device_id}")
async def analyze_dish(device_id: str, file: UploadFile = File(...)):
    # 1. Verifica se o usuário tem saldo no banco
    can_proceed, message = db.check_user_access(device_id)
    if not can_proceed:
        raise HTTPException(status_code=402, detail=message)

    try:
        # 2. Lê os bytes da imagem enviada
        image_bytes = await file.read()

        # 3. Chama a IA
        result = await ai.analyze_plate_image(image_bytes)

        # 4. Se a IA respondeu com sucesso, incrementa o uso no banco
        db.increment_usage(device_id)

        return {
            "status": "success",
            "analysis": result,
            "credits_update": "Contador incrementado com sucesso."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")