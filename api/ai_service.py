from google import genai
from google.genai import types
import os
import json
import re
import asyncio

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.pro_model = "gemini-1.5-pro"
        self.flash_model = "gemini-2.0-flash"


    async def analyze_plate_image(self, image_bytes: bytes):
        """
        Envia a imagem para o Gemini e solicita um retorno em JSON.
        """
        prompt = """
        Você é um especialista em nutrição e análise visual de alimentos.
        Analise a imagem deste prato de comida e identifique cada item individualmente.
        
        Para cada item identificado, você DEVE fornecer:
        1. Nome do alimento (curto e preciso).
        2. Estimativa de calorias (apenas o número).
        3. Score de saúde (1 a 10, onde 10 é muito saudável).
        4. Coordenadas de detecção [ymin, xmin, ymax, xmax] em formato NORMALIZADO (0 a 1000).
           - Exemplo: se o item está no centro, o box seria algo como [400, 400, 600, 600].
           - Use 0-1000 para mapear a imagem inteira.

        Retorne um JSON estritamente no seguinte formato:
        {
          "items": [
            {
              "name": "Arroz Branco",
              "calories_est": 130,
              "health_score": 6,
              "box_2d": [200, 150, 450, 400]
            }
          ],
          "total_vitality": 85,
          "recommendation": "Uma dica curta e prática de saúde baseada neste prato.",
          "comentary": "Um comentário divertido ou motivador sobre a escolha do prato.",
          "meal_name": "Nome criativo para esta refeição"
        }

        REGRAS CRÍTICAS:
        - Retorne APENAS o JSON.
        - Não invente itens que não estão na imagem (evite alucinações).
        - Se não tiver certeza de um item, use o nome mais genérico possível.
        - As coordenadas box_2d DEVEM estar entre 0 e 1000.
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
                timeout=15.0 # Aumentado para 15s para evitar timeouts no Vercel
            )
        except (asyncio.TimeoutError, Exception) as e:
            print(f"Erro ou Timeout ({self.pro_model}): {e}. Usando o Fallback ({self.flash_model})...")
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