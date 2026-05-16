from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from auth_utils import get_current_user, require_admin
from database import get_db
from services.hostel_face_attendance import (
    TIME_LIMIT_HOURS,
    can_mark_attendance,
    last_marked_within_24h,
)

router = APIRouter(prefix="/hostel-attendance", tags=["Hostel Attendance"])


def _today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _serialize_record(row: dict) -> dict:
    return {
        "id": row["id"],
        "studentId": row["user_id"],
        "date": row["date"],
        "status": row["status"],
        "source": row.get("source") or "face",
        "markedAt": row["marked_at"],
    }


def _student_stats(conn, user_id: str, days: int = 30) -> dict:
    since = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    rows = conn.execute(
        """
        SELECT * FROM hostel_attendance
        WHERE user_id = ? AND date >= ?
        ORDER BY date DESC
        """,
        (user_id, since),
    ).fetchall()
    present = sum(1 for r in rows if r["status"] == "present")
    total = days
    return {
        "total": total,
        "present": present,
        "absent": total - present,
        "percentage": round((present / total) * 100) if total else 0,
    }


def _next_mark_info(user_id: str) -> dict | None:
    """If blocked by 24h rule, return when they can mark again."""
    allowed, reason = can_mark_attendance(user_id)
    if allowed:
        return None
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT marked_at FROM hostel_attendance
            WHERE user_id = ? AND status = 'present'
            ORDER BY marked_at DESC LIMIT 1
            """,
            (user_id,),
        ).fetchone()
    if not row:
        return None
    last = datetime.fromisoformat(row["marked_at"].replace("Z", ""))
    next_at = last + timedelta(hours=TIME_LIMIT_HOURS)
    return {
        "blocked": True,
        "reason": reason,
        "nextMarkAt": next_at.isoformat(),
    }


@router.get("")
def get_attendance(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access only")

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM hostel_attendance
            WHERE user_id = ?
            ORDER BY marked_at DESC
            LIMIT 60
            """,
            (user["id"],),
        ).fetchall()
        stats = _student_stats(conn, user["id"])

    marked_in_24h = last_marked_within_24h(user["id"])
    last_face = None
    if rows:
        last_face = dict(rows[0]).get("source") == "face"

    return {
        "records": [_serialize_record(dict(r)) for r in rows],
        "stats": stats,
        "hasMarkedToday": marked_in_24h,
        "hasMarkedIn24h": marked_in_24h,
        "faceOnly": True,
        "nextMark": _next_mark_info(user["id"]),
        "lastSource": "face" if last_face else None,
    }


@router.post("")
def mark_attendance_manual_blocked(user: dict = Depends(get_current_user)):
    """Manual web marking disabled — use face scanner at hostel gate."""
    raise HTTPException(
        status_code=403,
        detail="Attendance is only marked via face recognition at the hostel gate.",
    )


@router.get("/admin/stats")
def admin_stats(admin: dict = Depends(require_admin)):
    today = _today()
    with get_db() as conn:
        total_students = conn.execute(
            "SELECT COUNT(*) as c FROM users WHERE role = 'student'"
        ).fetchone()["c"]
        present_today = conn.execute(
            """
            SELECT COUNT(*) as c FROM hostel_attendance
            WHERE date = ? AND status = 'present'
            """,
            (today,),
        ).fetchone()["c"]

        grievance_rows = conn.execute(
            "SELECT status, COUNT(*) as c FROM grievances GROUP BY status"
        ).fetchall()
        g_counts = {r["status"]: r["c"] for r in grievance_rows}

        trend = []
        for i in range(6, -1, -1):
            d = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
            present = conn.execute(
                """
                SELECT COUNT(*) as c FROM hostel_attendance
                WHERE date = ? AND status = 'present'
                """,
                (d,),
            ).fetchone()["c"]
            trend.append(
                {
                    "date": d,
                    "present": present,
                    "absent": max(0, total_students - present),
                }
            )

    return {
        "totalStudents": total_students,
        "presentToday": present_today,
        "absentToday": max(0, total_students - present_today),
        "total": sum(g_counts.values()),
        "pending": g_counts.get("pending", 0),
        "inProgress": g_counts.get("in_progress", 0),
        "resolved": g_counts.get("resolved", 0),
        "attendanceTrend": trend,
    }


@router.get("/admin/all")
def admin_all_attendance(admin: dict = Depends(require_admin)):
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT ha.*, u.name, u.room_number, u.student_id
            FROM hostel_attendance ha
            JOIN users u ON u.id = ha.user_id
            ORDER BY ha.marked_at DESC
            LIMIT 200
            """
        ).fetchall()

    return {
        "records": [
            {
                **_serialize_record(dict(r)),
                "studentName": r["name"],
                "roomNumber": r["room_number"],
                "studentRollId": r["student_id"],
            }
            for r in rows
        ]
    }
