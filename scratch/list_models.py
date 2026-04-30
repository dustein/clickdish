import os
from google import genai
from dotenv import load_dotenv

# Load .env from the root of the project
load_dotenv(".env")

def list_gemini_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found in environment.")
        return

    client = genai.Client(api_key=api_key)
    print(f"Listing available models for API Key (prefix: {api_key[:5]}...)...")
    try:
        # Using a simple list to avoid any filter issues
        models = client.models.list()
        for model in models:
            print(f"ID: {model.name}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_gemini_models()
