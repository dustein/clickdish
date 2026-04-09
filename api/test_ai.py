from google import genai
import os
from dotenv import load_dotenv

# Carrega as variáveis do arquivo .env na pasta api
load_dotenv()

CHAVE_API = os.getenv("GEMINI_API_KEY")

if not CHAVE_API:
    print("ERRO: GEMINI_API_KEY não encontrada no arquivo .env")
    exit(1)

client = genai.Client(api_key=CHAVE_API)

print("Conectado ao Gemini! Buscando modelos disponíveis...\n")

try:
    for m in client.models.list():
        # Simplificado para garantir que funciona em diferentes versões da SDK
        print(f"Nome do Modelo: {m.name}")
        if hasattr(m, 'display_name'):
            print(f"Nome de exibição: {m.display_name}")
        if hasattr(m, 'description') and m.description:
            print(f"Descrição: {m.description}")
        print("-" * 40)
except Exception as e:
    print(f"Ocorreu um erro ao listar os modelos: {e}")