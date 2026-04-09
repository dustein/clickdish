"""
ClickDish — Dev Startup Script (LOCAL ONLY)
===========================================
This script is NEVER deployed to Vercel. It is not imported by main.py.
It exists solely to make local webhook testing easy.

What it does:
  1. Reads NGROK_AUTHTOKEN from api/.env
  2. Opens a public HTTPS tunnel via pyngrok -> local uvicorn port
  3. Prints the tunnel URL (paste this into Mercado Pago sandbox dashboard)
  4. Starts uvicorn with --reload for hot-reloading
  5. On Ctrl+C, gracefully kills both uvicorn and the ngrok tunnel

Usage (from project root):
  python api/dev_start.py

Required env var (in api/.env):
  NGROK_AUTHTOKEN=your_token_from_ngrok.com

Optional env var (in api/.env):
  NGROK_PORT=8000   (default: 8000)
"""

import os
import sys
import signal
import subprocess
from pathlib import Path

# ── Load .env from the api/ directory ──────────────────────────────────────────
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=env_file)
else:
    print("[dev_start] WARNING: api/.env not found. Using system environment only.")

# ── Guard: require pyngrok ─────────────────────────────────────────────────────
try:
    from pyngrok import ngrok, conf
except ImportError:
    print(
        "\n[dev_start] ✗ pyngrok is not installed.\n"
        "  Run:  pip install -r api/requirements-dev.txt\n"
    )
    sys.exit(1)

# ── Read config from environment ───────────────────────────────────────────────
NGROK_AUTHTOKEN = os.getenv("NGROK_AUTHTOKEN", "")
NGROK_PORT      = int(os.getenv("NGROK_PORT", "8000"))

if not NGROK_AUTHTOKEN or NGROK_AUTHTOKEN == "your_ngrok_token_here":
    print(
        "\n[dev_start] ✗ NGROK_AUTHTOKEN is not set.\n"
        "  1. Sign up for free at https://ngrok.com\n"
        "  2. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken\n"
        "  3. Add it to api/.env:\n"
        "       NGROK_AUTHTOKEN=your_token_here\n"
    )
    sys.exit(1)

# ── Start ngrok tunnel ─────────────────────────────────────────────────────────
conf.get_default().auth_token = NGROK_AUTHTOKEN

print(f"\n[dev_start] 🚀 Starting ngrok tunnel -> localhost:{NGROK_PORT} ...")
tunnel = ngrok.connect(NGROK_PORT, "http")
public_url = tunnel.public_url

# ngrok always gives an http url; upgrade to https
if public_url.startswith("http://"):
    public_url = "https://" + public_url[len("http://"):]

webhook_url = f"{public_url}/api/webhooks"

print("\n" + "═" * 60)
print("  ✅ Ngrok tunnel is live!")
print(f"  📡 Public URL   : {public_url}")
print(f"  🔔 Webhook URL  : {webhook_url}")
print("─" * 60)
print("  👉 Paste the Webhook URL above into the")
print("     Mercado Pago sandbox dashboard.")
print("     Dashboard: https://www.mercadopago.com.br/developers/panel/app")
print("═" * 60 + "\n")

# ── Start uvicorn as a subprocess ──────────────────────────────────────────────
# We run from the api/ directory so that main.py imports resolve correctly.
api_dir = Path(__file__).parent
cmd = [
    sys.executable, "-m", "uvicorn",
    "main:app",
    "--host", "0.0.0.0",
    "--port", str(NGROK_PORT),
    "--reload",
]

print(f"[dev_start] 🔧 Starting uvicorn on port {NGROK_PORT} (hot-reload enabled)...\n")
uvicorn_proc = subprocess.Popen(cmd, cwd=str(api_dir))

# ── Graceful shutdown on Ctrl+C ────────────────────────────────────────────────
def _shutdown(sig, frame):
    print("\n[dev_start] 🛑 Shutting down uvicorn and ngrok tunnel...")
    uvicorn_proc.terminate()
    try:
        uvicorn_proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        uvicorn_proc.kill()
    ngrok.disconnect(tunnel.public_url)
    ngrok.kill()
    print("[dev_start] ✅ Shutdown complete. Bye!")
    sys.exit(0)

signal.signal(signal.SIGINT, _shutdown)
signal.signal(signal.SIGTERM, _shutdown)

# ── Wait for uvicorn to finish ─────────────────────────────────────────────────
uvicorn_proc.wait()
