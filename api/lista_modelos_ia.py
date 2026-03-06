import os
import asyncio
from google import genai
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env
load_dotenv()

async def check_available_models():
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("Erro: A variável GEMINI_API_KEY não foi encontrada no ambiente ou no .env.")
        return

    # Inicializa o cliente com a chave explicitamente
    client = genai.Client(api_key=api_key)
    
    print("--- Verificando Modelos Disponíveis ---")
    try:
        # A biblioteca google-genai retorna um iterador simples no list()
        # Vamos listar de forma síncrona para simplificar o diagnóstico
        for model in client.models.list():
            if 'generateContent' in model.supported_actions:
                # O model.name geralmente vem como 'models/gemini-...'
                print(f"ID para usar no código: {model.name}")
    except Exception as e:
        print(f"Erro ao listar modelos: {e}")

if __name__ == "__main__":
    asyncio.run(check_available_models())