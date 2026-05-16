import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException

from auth_utils import get_current_user, require_admin
from database import get_db

router = APIRouter(prefix="/hostel-attendance", tags=["Hostel Attendance"])


def _today() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


def _serialize_record(row: dict) -> dict:
    return {
        "id": row["id"],
        "studentId": row["user_id"],
        "date": row["date"],
        "status": row["status"],
        "source": row.get("source") or "manual",
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


@router.get("")
def get_attendance(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access only")

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM hostel_attendance
            WHERE user_id = ?
            ORDER BY date DESC
            LIMIT 60
            """,
            (user["id"],),
        ).fetchall()
        stats = _student_stats(conn, user["id"])
        has_marked = conn.execute(
            """
            SELECT id FROM hostel_attendance
            WHERE user_id = ? AND date = ?
            """,
            (user["id"], _today()),
        ).fetchone()

    return {
        "records": [_serialize_record(dict(r)) for r in rows],
        "stats": stats,
        "hasMarkedToday": has_marked is not None,
    }


@router.post("")
def mark_attendance(user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Student access only")

    today = _today()
    now = datetime.utcnow().isoformat()

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM hostel_attendance WHERE user_id = ? AND date = ?",
            (user["id"], today),
        ).fetchone()
        if existing:
            raise HTTPException(
                status_code=400, detail="Attendance already marked for today"
            )

        record_id = str(uuid.uuid4())
        conn.execute(
            """
            INSERT INTO hostel_attendance (id, user_id, date, status, source, marked_at)
            VALUES (?, ?, ?, 'present', 'manual', ?)
            """,
            (record_id, user["id"], today, now),
        )
        row = conn.execute(
            "SELECT * FROM hostel_attendance WHERE id = ?", (record_id,)
        ).fetchone()
        stats = _student_stats(conn, user["id"])

    return {
        "message": "Hostel attendance marked successfully",
        "record": _serialize_record(dict(row)),
        "stats": stats,
    }


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
