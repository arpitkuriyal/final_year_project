import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "hostel.db"
FACES_DIR = PROJECT_ROOT / "student's faces"
AUGMENTED_DIR = PROJECT_ROOT / "augmented_faces"
FACES_DIR.mkdir(exist_ok=True)
AUGMENTED_DIR.mkdir(exist_ok=True)

JWT_SECRET = os.getenv("JWT_SECRET", "hostel-management-secret-key-2024")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

DEFAULT_ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@hostel.com")
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
