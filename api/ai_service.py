import google.generativeai as genai
import os
import json

class AIService:
    def __init__(self):
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # Usamos o 1.5-flash por ser mais rápido e econômico para SaaS
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def analyze_plate_image(self, image_bytes: bytes):
        """
        Envia a imagem para o Gemini e solicita um retorno em JSON.
        """
        prompt = """
        Analise a imagem deste prato de comida e retorne um JSON estritamente no seguinte formato:
        {
          "items": [{"name": "nome do alimento", "calories_est": 100, "health_score": 8}],
          "total_vitality": 85,
          "recommendation": "uma dica curta de saúde"
        }
        Retorne APENAS o JSON, sem explicações extras.
        """
        
        # O Gemini aceita uma lista contendo o prompt e os dados da imagem
        response = self.model.generate_content([
            prompt,
            {"mime_type": "image/jpeg", "data": image_bytes}
        ])
        
        # Limpa possíveis formatações de markdown que a IA possa enviar
        clean_json = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_json)