import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "mosaic.db"

# Society Defaults
TRUSTED_VPA = "sunrise.society@hdfcbank"
TRUSTED_PAYEE_NAME = "Sunrise Housing Society RWA"
SOCIETY_NAME = "Sunrise Housing Society"
SOCIETY_ID = "soc_sunrise_01"

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
