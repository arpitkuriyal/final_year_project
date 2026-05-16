from fastapi import APIRouter, Depends

from auth_utils import require_admin, user_without_password
from database import get_db

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("")
def list_students(admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM users WHERE role = 'student' ORDER BY created_at DESC"
        ).fetchall()

    return {
        "students": [user_without_password(dict(r)) for r in rows],
    }
