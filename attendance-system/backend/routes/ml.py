"""ML helpers — retraining runs automatically on student signup (see auth.py)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth_utils import require_admin
from services.hostel_face_attendance import mark_face_attendance

router = APIRouter(prefix="/ml", tags=["ML"])


class FaceMarkBody(BaseModel):
    studentId: str


@router.post("/face-mark")
def face_mark(body: FaceMarkBody, admin: dict = Depends(require_admin)):
    """Optional test endpoint for face attendance (warden only)."""
    return mark_face_attendance(body.studentId)
