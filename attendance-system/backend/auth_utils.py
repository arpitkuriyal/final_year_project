from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import JWT_ALGORITHM, JWT_EXPIRE_DAYS, JWT_SECRET
from database import get_db, row_to_dict

security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {
        "userId": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def user_without_password(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "studentId": user.get("student_id"),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "roomNumber": user.get("room_number"),
        "block": user.get("block"),
        "branch": user.get("branch"),
        "batch": user.get("batch"),
        "photoFilename": user.get("photo_filename"),
        "augmentCount": user.get("augment_count") or 0,
        "createdAt": user.get("created_at"),
    }


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    user = row_to_dict(row)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_student(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    return user
