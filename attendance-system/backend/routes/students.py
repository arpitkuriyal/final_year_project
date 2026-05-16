import uuid
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from auth_utils import require_admin, user_without_password
from config import FACES_DIR
from database import get_db, row_to_dict

router = APIRouter(prefix="/students", tags=["Students"])


def _attendance_stats(conn, user_id: str, days: int = 30) -> dict:
    since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    rows = conn.execute(
        """
        SELECT status FROM hostel_attendance
        WHERE user_id = ? AND date >= ?
        """,
        (user_id, since),
    ).fetchall()
    present = sum(1 for r in rows if r["status"] == "present")
    total = days
    return {
        "present": present,
        "absent": total - present,
        "total": total,
        "percentage": round((present / total) * 100) if total else 0,
    }


def _grievance_counts(conn, user_id: str) -> dict:
    rows = conn.execute(
        """
        SELECT status, COUNT(*) AS c FROM grievances
        WHERE user_id = ?
        GROUP BY status
        """,
        (user_id,),
    ).fetchall()
    counts = {r["status"]: r["c"] for r in rows}
    pending = counts.get("pending", 0)
    in_progress = counts.get("in_progress", 0)
    resolved = counts.get("resolved", 0)
    return {
        "totalGrievances": pending + in_progress + resolved,
        "pendingGrievances": pending,
        "inProgressGrievances": in_progress,
        "resolvedGrievances": resolved,
    }


def _student_summary(conn, row: dict) -> dict:
    base = user_without_password(row)
    stats = _attendance_stats(conn, row["id"])
    grievances = _grievance_counts(conn, row["id"])
    return {
        **base,
        **stats,
        **grievances,
        "attendancePercentage": stats["percentage"],
    }


@router.get("")
def list_students(admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM users WHERE role = 'student' ORDER BY student_id ASC"
        ).fetchall()
        students = [_student_summary(conn, dict(r)) for r in rows]
    return {"students": students}


@router.get("/{user_id}")
def get_student(user_id: str, admin: dict = Depends(require_admin)):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE id = ? AND role = 'student'", (user_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Student not found")

        attendance_rows = conn.execute(
            """
            SELECT id, date, status, source, marked_at
            FROM hostel_attendance
            WHERE user_id = ?
            ORDER BY marked_at DESC
            LIMIT 30
            """,
            (user_id,),
        ).fetchall()

        grievance_rows = conn.execute(
            """
            SELECT id, category, description, status, admin_reply, created_at, updated_at
            FROM grievances
            WHERE user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,),
        ).fetchall()

        student = _student_summary(conn, dict(row))

    return {
        "student": student,
        "stats": {
            "present": student["present"],
            "absent": student["absent"],
            "total": student["total"],
            "percentage": student["percentage"],
        },
        "attendance": [
            {
                "id": r["id"],
                "date": r["date"],
                "status": r["status"],
                "source": r["source"],
                "markedAt": r["marked_at"],
            }
            for r in attendance_rows
        ],
        "grievances": [
            {
                "id": r["id"],
                "category": r["category"],
                "description": r["description"],
                "status": r["status"],
                "adminReply": r["admin_reply"],
                "createdAt": r["created_at"],
                "updatedAt": r["updated_at"],
            }
            for r in grievance_rows
        ],
    }


@router.get("/{user_id}/photo")
def get_student_photo(user_id: str, admin: dict = Depends(require_admin)):
    with get_db() as conn:
        row = conn.execute(
            "SELECT photo_filename FROM users WHERE id = ? AND role = 'student'",
            (user_id,),
        ).fetchone()

    if not row or not row["photo_filename"]:
        raise HTTPException(status_code=404, detail="Photo not found")

    path = FACES_DIR / row["photo_filename"]
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Photo file missing on disk")

    return FileResponse(path)


@router.delete("/{user_id}")
def delete_student(user_id: str, admin: dict = Depends(require_admin)):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM users WHERE id = ? AND role = 'student'", (user_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Student not found")

        conn.execute("DELETE FROM hostel_attendance WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM grievances WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))

    return {"message": "Student deleted successfully"}
