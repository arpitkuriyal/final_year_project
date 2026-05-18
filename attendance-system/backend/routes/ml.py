"""ML helpers — retraining runs automatically on student signup (see auth.py)."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth_utils import require_admin
from services.attendance_scanner import (
    get_scanner_status,
    start_scanner,
    stop_scanner,
)
from services.hostel_face_attendance import mark_face_attendance

router = APIRouter(prefix="/ml", tags=["ML"])


class FaceMarkBody(BaseModel):
    studentId: str


class ScannerStartBody(BaseModel):
    cameraIndex: int = 0
    durationMinutes: int = 30


@router.post("/face-mark")
def face_mark(body: FaceMarkBody, admin: dict = Depends(require_admin)):
    """Optional test endpoint for face attendance (warden only)."""
    return mark_face_attendance(body.studentId)


@router.get("/attendance-scanner")
def attendance_scanner_status(admin: dict = Depends(require_admin)):
    return get_scanner_status()


@router.post("/attendance-scanner/start")
def attendance_scanner_start(body: ScannerStartBody, admin: dict = Depends(require_admin)):
    return start_scanner(
        camera_index=body.cameraIndex,
        duration_minutes=body.durationMinutes,
    )


@router.post("/attendance-scanner/stop")
def attendance_scanner_stop(admin: dict = Depends(require_admin)):
    return stop_scanner()
