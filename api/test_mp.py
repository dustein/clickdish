import asyncio
import os
import uuid
from dotenv import load_dotenv
load_dotenv()

from payment_service import PaymentService

def test_pix():
    try:
        svc = PaymentService()
        payment_data = {
            "transaction_amount": 9.90,
            "description": "ClickDish Premium",
            "payment_method_id": "pix",
            "payer": {
                "email": "test_user_123@example.com",
                "first_name": "Test",
                "last_name": "User",
                "identification": {
                    "type": "CPF",
                    "number": "19119119100"
                }
            }
        }
        
        request_options = svc._get_request_options(str(uuid.uuid4()))
        result = svc.sdk.payment().create(payment_data, request_options)
        
        print("Result:", result)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pix()
