import csv
from datetime import datetime, timedelta, timezone
from io import StringIO
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from auth_utils import get_current_user, require_admin
from database import get_db
from services.hostel_face_attendance import (
    TIME_LIMIT_HOURS,
    can_mark_attendance,
    last_marked_within_limit,
)

router = APIRouter(prefix="/hostel-attendance", tags=["Hostel Attendance"])

LOCAL_TZ = ZoneInfo("Asia/Kolkata")


def _today() -> str:
    return datetime.now(LOCAL_TZ).strftime("%Y-%m-%d")


def _parse_marked_at(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", ""))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(LOCAL_TZ)


def _session_name(marked_at: datetime) -> str:
    return "morning" if marked_at.hour < 12 else "night"


def _date_range(days: int) -> list[str]:
    today = datetime.now(LOCAL_TZ).date()
    start = today - timedelta(days=days - 1)
    return [(start + timedelta(days=i)).isoformat() for i in range(days)]


def _serialize_record(row: dict) -> dict:
    marked_at = row["marked_at"]
    if marked_at and not marked_at.endswith("Z"):
        marked_at = f"{marked_at}Z"

    return {
        "id": row["id"],
        "studentId": row["user_id"],
        "date": row["date"],
        "status": row["status"],
        "source": row.get("source") or "face",
        "markedAt": marked_at,
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


def _today_session_summary(conn) -> dict:
    today = _today()
    student_rows = conn.execute(
        """
        SELECT id, student_id, name, room_number
        FROM users
        WHERE role = 'student'
        ORDER BY student_id ASC
        """
    ).fetchall()
    attendance_rows = conn.execute(
        """
        SELECT user_id, marked_at
        FROM hostel_attendance
        WHERE status = 'present'
        ORDER BY marked_at ASC
        """
    ).fetchall()

    by_student = {
        row["id"]: {
            "userId": row["id"],
            "studentId": row["student_id"],
            "name": row["name"],
            "roomNumber": row["room_number"],
            "morning": False,
            "night": False,
            "morningMarkedAt": None,
            "nightMarkedAt": None,
        }
        for row in student_rows
    }

    for row in attendance_rows:
        marked_at = _parse_marked_at(row["marked_at"])
        if marked_at.strftime("%Y-%m-%d") != today:
            continue

        student = by_student.get(row["user_id"])
        if not student:
            continue

        session = _session_name(marked_at)
        student[session] = True
        student[f"{session}MarkedAt"] = marked_at.isoformat()

    students = []
    for student in by_student.values():
        missing = []
        if not student["morning"]:
            missing.append("morning")
        if not student["night"]:
            missing.append("night")
        students.append(
            {
                **student,
                "both": student["morning"] and student["night"],
                "missing": missing,
            }
        )

    morning = sum(1 for s in students if s["morning"])
    night = sum(1 for s in students if s["night"])
    both = sum(1 for s in students if s["both"])
    any_mark = sum(1 for s in students if s["morning"] or s["night"])

    return {
        "date": today,
        "morning": morning,
        "night": night,
        "both": both,
        "any": any_mark,
        "missingAny": max(0, len(students) - any_mark),
        "students": students,
    }


def _attendance_matrix(conn, days: int = 30) -> tuple[list[str], list[dict]]:
    dates = _date_range(days)
    date_set = set(dates)
    student_rows = conn.execute(
        """
        SELECT id, student_id, name, room_number
        FROM users
        WHERE role = 'student'
        ORDER BY student_id ASC
        """
    ).fetchall()
    attendance_rows = conn.execute(
        """
        SELECT user_id, marked_at
        FROM hostel_attendance
        WHERE status = 'present'
        ORDER BY marked_at ASC
        """
    ).fetchall()

    students = []
    by_student = {}
    for row in student_rows:
        student = {
            "userId": row["id"],
            "studentId": row["student_id"],
            "name": row["name"],
            "roomNumber": row["room_number"],
            "days": {
                date: {
                    "morning": False,
                    "night": False,
                    "morningMarkedAt": None,
                    "nightMarkedAt": None,
                }
                for date in dates
            },
        }
        students.append(student)
        by_student[row["id"]] = student

    for row in attendance_rows:
        student = by_student.get(row["user_id"])
        if not student:
            continue

        marked_at = _parse_marked_at(row["marked_at"])
        marked_date = marked_at.date().isoformat()
        if marked_date not in date_set:
            continue

        session = _session_name(marked_at)
        day = student["days"][marked_date]
        day[session] = True
        day[f"{session}MarkedAt"] = marked_at.strftime("%I:%M %p")

    return dates, students


def _session_status(day: dict) -> str:
    if day["morning"] and day["night"]:
        return "Both"
    if day["morning"]:
        return "Morning only"
    if day["night"]:
        return "Night only"
    return "Absent"


def _build_attendance_export_csv(conn, days: int = 30) -> str:
    dates, students = _attendance_matrix(conn, days)
    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["Hostel Attendance Export"])
    writer.writerow(["Period", f"{dates[0]} to {dates[-1]}"])
    writer.writerow(["Sessions", "Morning = before 12 PM", "Night = 12 PM onward"])
    writer.writerow([])

    writer.writerow(["Monthly Summary"])
    writer.writerow([
        "Student ID",
        "Name",
        "Room",
        "Morning Marks",
        "Night Marks",
        "Both Days",
        "Partial Days",
        "Absent Days",
        "Completed Sessions",
        "Total Sessions",
        "Completion %",
    ])
    for student in students:
        morning = sum(1 for d in dates if student["days"][d]["morning"])
        night = sum(1 for d in dates if student["days"][d]["night"])
        both = sum(
            1
            for d in dates
            if student["days"][d]["morning"] and student["days"][d]["night"]
        )
        partial = sum(
            1
            for d in dates
            if student["days"][d]["morning"] != student["days"][d]["night"]
        )
        absent = sum(
            1
            for d in dates
            if not student["days"][d]["morning"] and not student["days"][d]["night"]
        )
        completed = morning + night
        total_sessions = len(dates) * 2
        writer.writerow([
            student["studentId"],
            student["name"],
            student["roomNumber"],
            morning,
            night,
            both,
            partial,
            absent,
            completed,
            total_sessions,
            round((completed / total_sessions) * 100) if total_sessions else 0,
        ])

    writer.writerow([])
    writer.writerow(["Weekly Summary"])
    writer.writerow([
        "Week",
        "Date Range",
        "Student ID",
        "Name",
        "Morning Marks",
        "Night Marks",
        "Both Days",
        "Missed Sessions",
        "Completion %",
    ])
    for week_index, start in enumerate(range(0, len(dates), 7), start=1):
        week_dates = dates[start:start + 7]
        date_range = f"{week_dates[0]} to {week_dates[-1]}"
        for student in students:
            morning = sum(1 for d in week_dates if student["days"][d]["morning"])
            night = sum(1 for d in week_dates if student["days"][d]["night"])
            both = sum(
                1
                for d in week_dates
                if student["days"][d]["morning"] and student["days"][d]["night"]
            )
            completed = morning + night
            total_sessions = len(week_dates) * 2
            writer.writerow([
                f"Week {week_index}",
                date_range,
                student["studentId"],
                student["name"],
                morning,
                night,
                both,
                total_sessions - completed,
                round((completed / total_sessions) * 100) if total_sessions else 0,
            ])

    writer.writerow([])
    writer.writerow(["Daily Session Detail"])
    writer.writerow([
        "Date",
        "Student ID",
        "Name",
        "Room",
        "Morning",
        "Morning Time",
        "Night",
        "Night Time",
        "Status",
    ])
    for date in dates:
        for student in students:
            day = student["days"][date]
            writer.writerow([
                date,
                student["studentId"],
                student["name"],
                student["roomNumber"],
                "Present" if day["morning"] else "Missing",
                day["morningMarkedAt"] or "-",
                "Present" if day["night"] else "Missing",
                day["nightMarkedAt"] or "-",
                _session_status(day),
            ])

    return output.getvalue()


def _next_mark_info(user_id: str) -> dict | None:
    """If blocked by rolling attendance rule, return when they can mark again."""
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

    marked_in_limit = last_marked_within_limit(user["id"])
    last_face = None
    if rows:
        last_face = dict(rows[0]).get("source") == "face"

    return {
        "records": [_serialize_record(dict(r)) for r in rows],
        "stats": stats,
        "hasMarkedToday": marked_in_limit,
        "hasMarkedIn24h": marked_in_limit,
        "hasMarkedInLimit": marked_in_limit,
        "attendanceWindowHours": TIME_LIMIT_HOURS,
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
    with get_db() as conn:
        total_students = conn.execute(
            "SELECT COUNT(*) as c FROM users WHERE role = 'student'"
        ).fetchone()["c"]
        session_summary = _today_session_summary(conn)
        present_today = session_summary["any"]

        grievance_rows = conn.execute(
            "SELECT status, COUNT(*) as c FROM grievances GROUP BY status"
        ).fetchall()
        g_counts = {r["status"]: r["c"] for r in grievance_rows}

        attendance_rows = conn.execute(
            """
            SELECT user_id, marked_at
            FROM hostel_attendance
            WHERE status = 'present'
            """
        ).fetchall()
        trend = []
        trend_dates = [
            (datetime.now(LOCAL_TZ) - timedelta(days=i)).strftime("%Y-%m-%d")
            for i in range(6, -1, -1)
        ]
        for i in range(6, -1, -1):
            d = trend_dates[6 - i]
            present_ids = {
                row["user_id"]
                for row in attendance_rows
                if _parse_marked_at(row["marked_at"]).strftime("%Y-%m-%d") == d
            }
            present = len(present_ids)
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
        "attendanceSessions": session_summary,
        "total": sum(g_counts.values()),
        "pending": g_counts.get("pending", 0),
        "inProgress": g_counts.get("in_progress", 0),
        "resolved": g_counts.get("resolved", 0),
        "inappropriate": g_counts.get("inappropriate", 0),
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


@router.get("/admin/export")
def admin_export_attendance(admin: dict = Depends(require_admin)):
    with get_db() as conn:
        csv_text = _build_attendance_export_csv(conn, days=30)

    filename = f"hostel-attendance-{_today()}-last-30-days.csv"
    return StreamingResponse(
        iter([csv_text]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )
