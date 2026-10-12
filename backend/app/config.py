import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Load .env from backend/ or project root
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

DB_PATH = BASE_DIR / "mosaic.db"

# Society Defaults
TRUSTED_VPA = "sunrise.society@hdfcbank"
TRUSTED_PAYEE_NAME = "Sunrise Housing Society RWA"
SOCIETY_NAME = "Sunrise Housing Society"
SOCIETY_ID = "soc_sunrise_01"

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))

# Resend Email Notification Gateway
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Mosaic Notifications <onboarding@resend.dev>")
DEFAULT_NOTIFICATION_EMAIL = os.getenv("DEFAULT_NOTIFICATION_EMAIL", "delivered@resend.dev")


