"""Mark hostel attendance from face recognition (SQLite). One mark per 24 hours."""

import uuid
from datetime import datetime, timedelta

from database import get_db, row_to_dict

TIME_LIMIT_HOURS = 24


def _parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", ""))


def can_mark_attendance(user_id: str) -> tuple[bool, str | None]:
    """Return (allowed, reason_if_blocked)."""
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT marked_at FROM hostel_attendance
            WHERE user_id = ? AND status = 'present'
            ORDER BY marked_at DESC
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()

    if not row:
        return True, None

    last = _parse_iso(row["marked_at"])
    elapsed = datetime.utcnow() - last
    if elapsed < timedelta(hours=TIME_LIMIT_HOURS):
        remaining = timedelta(hours=TIME_LIMIT_HOURS) - elapsed
        hours = int(remaining.total_seconds() // 3600)
        mins = int((remaining.total_seconds() % 3600) // 60)
        return False, f"Already marked. Try again in {hours}h {mins}m."

    return True, None


def mark_face_attendance(student_roll_id: str) -> dict:
    """
    student_roll_id: numeric/string ID from signup (e.g. 58901), matches label encoder.
    """
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE student_id = ? AND role = 'student'",
            (str(student_roll_id),),
        ).fetchone()

    if not row:
        return {
            "success": False,
            "message": f"No registered student with ID {student_roll_id}",
        }

    user = row_to_dict(row)
    allowed, reason = can_mark_attendance(user["id"])
    if not allowed:
        return {
            "success": False,
            "message": reason,
            "studentId": student_roll_id,
            "name": user["name"],
        }

    now = datetime.utcnow()
    record_id = str(uuid.uuid4())
    today = now.strftime("%Y-%m-%d")
    marked_at = now.isoformat()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO hostel_attendance (id, user_id, date, status, source, marked_at)
            VALUES (?, ?, ?, 'present', 'face', ?)
            """,
            (record_id, user["id"], today, marked_at),
        )

    return {
        "success": True,
        "message": f"Attendance marked for {user['name']}",
        "studentId": student_roll_id,
        "name": user["name"],
        "roomNumber": user.get("room_number"),
        "markedAt": marked_at,
    }


def last_marked_within_24h(user_id: str) -> bool:
    allowed, _ = can_mark_attendance(user_id)
    return not allowed
