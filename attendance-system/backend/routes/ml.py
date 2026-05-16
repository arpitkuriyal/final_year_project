import threading

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import require_admin
from services.hostel_face_attendance import mark_face_attendance
from services.ml_pipeline import retrain_face_model

router = APIRouter(prefix="/ml", tags=["ML"])


@router.post("/retrain")
def retrain(admin: dict = Depends(require_admin)):
    result = retrain_face_model()
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error", "Retrain failed"))
    return result


@router.post("/retrain-async")
def retrain_async(admin: dict = Depends(require_admin)):
    threading.Thread(target=retrain_face_model, daemon=True).start()
    return {"message": "Retraining started in background"}


class FaceMarkBody(BaseModel):
    studentId: str


@router.post("/face-mark")
def face_mark(body: FaceMarkBody, admin: dict = Depends(require_admin)):
    """Manual test endpoint for face attendance (warden only)."""
    return mark_face_attendance(body.studentId)
