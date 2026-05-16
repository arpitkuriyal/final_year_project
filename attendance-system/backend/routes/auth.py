import re
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from auth_utils import create_access_token, get_current_user, user_without_password
from config import AUGMENTED_DIR, FACES_DIR
from database import get_db, hash_password, row_to_dict, verify_password
from services.face_augment import augment_student_photo

router = APIRouter(prefix="/auth", tags=["Auth"])


def _safe_filename(student_id: str, name: str) -> str:
    safe_name = re.sub(r"[^\w\s-]", "", name).strip().replace(" ", "_")
    return f"{student_id}_{safe_name}"


@router.post("/signup")
async def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    room_number: str = Form(...),
    student_id: str = Form(...),
    block: str = Form("A"),
    branch: str = Form(""),
    batch: str = Form(""),
    photo: UploadFile = File(...),
):
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Photo must be an image file")

    with get_db() as conn:
        if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        if conn.execute(
            "SELECT id FROM users WHERE student_id = ?", (student_id,)
        ).fetchone():
            raise HTTPException(status_code=400, detail="Student ID already registered")

    base_name = _safe_filename(student_id, name)
    ext = Path(photo.filename or "photo.jpg").suffix or ".jpg"
    photo_filename = f"{base_name}{ext}"
    face_path = FACES_DIR / photo_filename

    content = await photo.read()
    if len(content) < 1000:
        raise HTTPException(status_code=400, detail="Photo file is too small or empty")
    face_path.write_bytes(content)

    try:
        augment_count = augment_student_photo(face_path, AUGMENTED_DIR, base_name, count=20)
    except Exception as exc:
        face_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500, detail=f"Face augmentation failed: {exc}"
        ) from exc

    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO users (
                id, student_id, name, email, password_hash, role,
                room_number, block, branch, batch, photo_filename, augment_count, created_at
            ) VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                student_id,
                name,
                email,
                hash_password(password),
                room_number,
                block,
                branch,
                batch,
                photo_filename,
                augment_count,
                now,
            ),
        )
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    user = row_to_dict(row)
    token = create_access_token(user["id"], user["email"], user["role"])

    return {
        "message": "Signup successful. Face photo saved and augmented for ML training.",
        "token": token,
        "user": user_without_password(user),
        "ml": {
            "photoPath": str(face_path),
            "augmentedDir": str(AUGMENTED_DIR),
            "augmentCount": augment_count,
        },
    }


class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(payload: LoginBody):
    email = payload.email
    password = payload.password
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    user = row_to_dict(row)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["id"], user["email"], user["role"])
    return {
        "message": "Login successful",
        "token": token,
        "user": user_without_password(user),
    }


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user_without_password(user)}
