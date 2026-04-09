from google import genai
from google.genai import types
import os
import json
import re
import asyncio

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.pro_model = "gemini-2.5-pro"
        self.flash_model = "gemini-2.5-flash"


    async def analyze_plate_image(self, image_bytes: bytes):
        """
        Envia a imagem para o Gemini e solicita um retorno em JSON.
        """
        prompt = """
        Analise a imagem deste prato de comida e retorne um JSON estritamente no seguinte formato:
        {
          "items": [{"name": "nome do alimento", "calories_est": 100, "health_score": 8, "box_2d": [0, 0, 100, 100]}],
          "total_vitality": 85,
          "recommendation": "uma dica curta de saúde",
          "comentary": "um comentário divertido sobre o prato",
          "meal_name": "nome do prato"
        }
        Retorne APENAS o JSON, sem explicações extras.
        """

        try:
            print(f"Tentando analisar com o modelo Pro ({self.pro_model})...")
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=self.pro_model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        prompt,
                    ],
                ),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            print(f"Tempo limite excedido ({self.pro_model}). Usando o Fallback ({self.flash_model})...")
            response = await self.client.aio.models.generate_content(
                model=self.flash_model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt,
                ],
            )


        text = response.text.strip()
        # Remove blocos de código markdown se existirem
        match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
        if match:
            text = match.group(1).strip()

        return json.loads(text)