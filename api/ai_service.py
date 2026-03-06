import os
import json
import asyncio
import io
import time
from google import genai
from google.genai import types
from PIL import Image
from dotenv import load_dotenv

# Carrega as variáveis do .env (GEMINI_API_KEY)
load_dotenv()

class AIService:
    def __init__(self):
        # Inicializa o cliente da nova SDK
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        # Principal: O modelo com a maior cota diária (1.500 usos/dia)
        self.primary_model = 'gemini-flash-latest' 
        
        # Reserva: Limitado a 20 usos/dia, entra só se o principal falhar
        self.fallback_model = 'gemini-2.5-flash'

    def _compress_image(self, image_bytes: bytes, max_size=(800, 800), quality=80):
        try:
            img = Image.open(io.BytesIO(image_bytes))
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            return output.getvalue()
        except Exception as e:
            print(f"Erro na compressão: {e}")
            return image_bytes

    async def analyze_plate_image(self, image_bytes: bytes):
        optimized_image = self._compress_image(image_bytes)

        # --- NOVO PROMPT COM VISUAL GROUNDING (box_2d) E MEAL_NAME ---
        prompt = """
        Analise a imagem deste prato de comida. Identifique os principais alimentos e retorne um JSON estritamente no seguinte formato:
        {
          "meal_name": "Um título curto e criativo para a refeição (ex: Almoço Revigorante, Combustível Matinal, Comida da Força, Popeye, Hulk)",
          "items": [
            {
              "name": "nome do alimento", 
              "calories_est": 100, 
              "health_score": 8,
              "box_2d": [ymin, xmin, ymax, xmax]
            }
          ],
          "total_vitality": 85,
          "recommendation": "dica curta de saúde",
          "comentary": "comentário divertido"
        }

        IMPORTANTE SOBRE AS COORDENADAS (box_2d):
        Para cada alimento, você DEVE retornar a caixa delimitadora (bounding box) de onde ele se encontra na imagem.
        Use uma escala relativa de 0 a 1000, onde [0, 0] é o canto superior esquerdo da imagem e [1000, 1000] é o canto inferior direito.
        O formato deve ser um array de 4 números inteiros: [ymin, xmin, ymax, xmax].
        ATENÇÃO: Retorne coordenadas APENAS para alimentos que estão CLARAMENTE VISÍVEIS na imagem. Mire no centro exato da porção do alimento.

        Retorne APENAS o JSON válido, sem nenhum texto adicional ou marcação markdown (não use ```json).
        """

        try:
            # Tenta com o modelo principal (Flash Clássico)
            return await self._call_gemini(self.primary_model, prompt, optimized_image)
        
        except Exception as e:
            error_msg = str(e).upper()
            print(f"Aviso: Falha no {self.primary_model} ({error_msg}). Tentando fallback...")
            
            try:
                # Tenta o fallback (2.5 Flash)
                return await self._call_gemini(self.fallback_model, prompt, optimized_image)
            except Exception as fatal_e:
                print(f"Erro fatal na IA: {fatal_e}")
                # Fallback final em JSON atualizado com as novas chaves
                return {
                    "meal_name": "Falha na Matrix Nutricional",
                    "items": [{"name": "Sistema Indisponível", "calories_est": 0, "health_score": 0, "box_2d": [400, 400, 600, 600]}],
                    "total_vitality": 0,
                    "recommendation": "Por favor, aguarde um minuto e tente novamente.",
                    "comentary": "Nossos robôs nutricionistas estão sobrecarregados e não conseguiram apontar a comida."
                }

    async def _call_gemini(self, model_name: str, prompt: str, image_data: bytes):
        # --- CRONÔMETRO INICIADO ---
        start_time = time.time()
        
        try:
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=model_name,
                    contents=[
                        prompt,
                        types.Part.from_bytes(data=image_data, mime_type="image/jpeg")
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.4 
                    )
                ),
                timeout=40.0 
            )
        except asyncio.TimeoutError:
            print(f"[{model_name}] TIMEOUT! O Google demorou mais de 40s e foi abortado.")
            raise Exception("Timeout na API do Google")
            
        # --- CRONÔMETRO PARADO ---
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        print(f"Resposta gerada pelo modelo {model_name} em {elapsed_time:.2f} segundos ! ! !")
        
        # Limpeza caso o Gemini teimoso decida enviar ```json no texto
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        return json.loads(raw_text.strip())

