from google import genai
from google.genai import types
import os
import json
import re
import asyncio

class AIService:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.pro_model = "gemini-2.5-flash"
        self.flash_model = "gemini-3.1-flash"

    async def analyze_plate_image(self, image_bytes: bytes):
        """
        Envia a imagem para o Gemini e solicita um retorno em JSON.
        """
        prompt = """
        System Role: You are an expert nutritionist and computer vision specialist for food analysis.
        Task: Analyze the provided image of a meal and individually detect and identify every food item present.

        For each detected item, you MUST extract the following parameters:

        Name: Short, precise food name.
        Calories: Estimated caloric value (integer only).
        Health Score: Rate from 1-10 (10 being the healthiest).
        Bounding Box: [ymin, xmin, ymax, xmax] normalized to a 0-1000 scale (e.g., center = [400, 400, 600, 600]).

        Output format: You must respond STRICTLY with a valid JSON object matching the exact schema below. Do not include markdown formatting like ```json, just the raw string.
        {
            "items": [
                {
                    "name": "White Rice",
                    "calories_est": 130,
                    "health_score": 6,
                    "box_2d": [200, 150, 450, 400]
        }
],
"total_vitality": 85,
"recommendation": "A short, practical health tip based on this meal.",
"comentary": "A fun or motivating comment about the meal choice.",
"meal_name": "A creative name for this meal"
}

CRITICAL CONSTRAINTS:

JSON ONLY. Any conversational text will break the system.

ZERO hallucinations. Do not invent items not visible in the image.

If uncertain about an ingredient, default to the broadest accurate generic category.

box_2d coordinates MUST strictly fall within the 0 to 1000 boundary.
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