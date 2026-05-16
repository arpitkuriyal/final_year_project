"""Demo students, attendance, and grievances for local development."""

import logging
import uuid
from datetime import datetime, timedelta

from database import hash_password

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "student123"


def _seed_students() -> list[dict]:
    return [
        {
            "student_id": "58901",
            "name": "Arpit Kuriyal",
            "email": "arpit@student.com",
            "room_number": "101",
            "block": "A",
            "branch": "CSE",
            "batch": "2022",
        },
        {
            "student_id": "58902",
            "name": "Priya Sharma",
            "email": "priya@student.com",
            "room_number": "102",
            "block": "A",
            "branch": "ECE",
            "batch": "2022",
        },
        {
            "student_id": "58903",
            "name": "Rahul Mehta",
            "email": "rahul@student.com",
            "room_number": "205",
            "block": "B",
            "branch": "ME",
            "batch": "2023",
        },
        {
            "student_id": "58904",
            "name": "Sneha Patel",
            "email": "sneha@student.com",
            "room_number": "210",
            "block": "B",
            "branch": "CSE",
            "batch": "2023",
        },
    ]


def seed_demo_data(conn) -> None:
    """Insert demo rows when no students exist yet."""
    count = conn.execute(
        "SELECT COUNT(*) AS c FROM users WHERE role = 'student'"
    ).fetchone()["c"]
    if count > 0:
        return

    logger.info("Seeding demo students, attendance, and grievances")
    now = datetime.utcnow()
    password_hash = hash_password(DEMO_PASSWORD)
    student_rows: list[dict] = []

    for s in _seed_students():
        user_id = str(uuid.uuid4())
        created_at = (now - timedelta(days=30)).isoformat()
        conn.execute(
            """
            INSERT INTO users (
                id, student_id, name, email, password_hash, role,
                room_number, block, branch, batch, photo_filename, augment_count, created_at
            ) VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, NULL, 0, ?)
            """,
            (
                user_id,
                s["student_id"],
                s["name"],
                s["email"],
                password_hash,
                s["room_number"],
                s["block"],
                s["branch"],
                s["batch"],
                created_at,
            ),
        )
        student_rows.append({**s, "id": user_id})

    today = now.strftime("%Y-%m-%d")
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")

    # Present today: first two students
    for user in student_rows[:2]:
        conn.execute(
            """
            INSERT INTO hostel_attendance (id, user_id, date, status, source, marked_at)
            VALUES (?, ?, ?, 'present', 'face', ?)
            """,
            (
                str(uuid.uuid4()),
                user["id"],
                today,
                now.isoformat(),
            ),
        )

    # Yesterday attendance for student 3
    conn.execute(
        """
        INSERT INTO hostel_attendance (id, user_id, date, status, source, marked_at)
        VALUES (?, ?, ?, 'present', 'face', ?)
        """,
        (
            str(uuid.uuid4()),
            student_rows[2]["id"],
            yesterday,
            (now - timedelta(days=1)).isoformat(),
        ),
    )

    grievances = [
        (
            student_rows[2],
            "maintenance",
            "Water leakage near room 205 bathroom.",
            "pending",
            None,
        ),
        (
            student_rows[3],
            "food",
            "Mess dinner quality has declined this week.",
            "in_progress",
            "Warden notified mess contractor.",
        ),
        (
            student_rows[0],
            "security",
            "Main gate RFID reader not working after 10 PM.",
            "resolved",
            "Technician fixed the reader on 14 May.",
        ),
    ]

    for user, category, description, status, admin_reply in grievances:
        gid = str(uuid.uuid4())
        created = (now - timedelta(days=5)).isoformat()
        conn.execute(
            """
            INSERT INTO grievances (
                id, user_id, student_name, room_number, category, description,
                status, admin_reply, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                gid,
                user["id"],
                user["name"],
                user["room_number"],
                category,
                description,
                status,
                admin_reply,
                created,
                now.isoformat(),
            ),
        )

    logger.info(
        "Demo seed complete — students use password '%s' (e.g. arpit@student.com)",
        DEMO_PASSWORD,
    )
