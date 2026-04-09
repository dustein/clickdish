from dotenv import load_dotenv
load_dotenv()
import os
key = os.getenv('GEMINI_API_KEY', 'NOT FOUND')
print('KEY:', key[:20] if key != 'NOT FOUND' else 'NOT FOUND')
