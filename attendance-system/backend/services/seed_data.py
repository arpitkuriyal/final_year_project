"""Seed students from student's faces/ folder and train the ANN model."""

import logging
import re
import threading
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from config import AUGMENTED_DIR, FACES_DIR
from database import hash_password
from services.face_augment import augment_student_photo
from services.ml_pipeline import retrain_face_model

logger = logging.getLogger(__name__)

DEMO_PASSWORD = "student123"
MIN_STUDENT_ID = 58000


def _parse_face_filename(path: Path) -> dict | None:
    """Parse 58901_Arpit_Kaushik.jpg -> student_id, name, base_name."""
    if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
        return None
    stem = path.stem
    parts = stem.split("_", 1)
    if len(parts) != 2 or not parts[0].isdigit():
        return None
    student_id = parts[0]
    if int(student_id) < MIN_STUDENT_ID:
        return None
    name = parts[1].replace("_", " ").strip().title()
    email_slug = re.sub(r"[^a-z0-9]", "", name.split()[0].lower()) or "student"
    return {
        "student_id": student_id,
        "name": name,
        "email": f"{email_slug}{student_id}@student.com",
        "base_name": stem,
        "photo_filename": path.name,
        "face_path": path,
    }


def _discover_faces() -> list[dict]:
    if not FACES_DIR.is_dir():
        logger.warning("Faces directory not found: %s", FACES_DIR)
        return []
    faces = []
    for path in sorted(FACES_DIR.iterdir()):
        parsed = _parse_face_filename(path)
        if parsed:
            faces.append(parsed)
    return faces


def _ensure_augmented(face: dict) -> int:
    aug_marker = AUGMENTED_DIR / f"{face['base_name']}_aug1.jpg"
    if aug_marker.exists():
        existing = list(AUGMENTED_DIR.glob(f"{face['base_name']}_aug*.jpg"))
        return len(existing) + 1
    return augment_student_photo(
        face["face_path"], AUGMENTED_DIR, face["base_name"], count=20
    )


def _insert_student(conn, face: dict, password_hash: str, room_number: str) -> dict:
    user_id = str(uuid.uuid4())
    augment_count = _ensure_augmented(face)
    now = datetime.utcnow().isoformat()
    conn.execute(
        """
        INSERT INTO users (
            id, student_id, name, email, password_hash, role,
            room_number, block, branch, batch, photo_filename, augment_count, created_at
        ) VALUES (?, ?, ?, ?, ?, 'student', ?, 'A', 'CSE', '2022', ?, ?, ?)
        """,
        (
            user_id,
            face["student_id"],
            face["name"],
            face["email"],
            password_hash,
            room_number,
            face["photo_filename"],
            augment_count,
            now,
        ),
    )
    return {
        "id": user_id,
        "student_id": face["student_id"],
        "name": face["name"],
        "email": face["email"],
        "room_number": room_number,
    }


def _seed_sample_grievances(conn, student_rows: list[dict], now: datetime) -> None:
    if conn.execute("SELECT COUNT(*) AS c FROM grievances").fetchone()["c"] > 0:
        return
    if len(student_rows) < 3:
        return

    samples = [
        (student_rows[0], "maintenance", "Water leakage near bathroom.", "pending", None),
        (student_rows[1], "food", "Mess dinner quality declined.", "in_progress", "Contractor notified."),
        (student_rows[2], "security", "Gate RFID reader issue after 10 PM.", "resolved", "Fixed by technician."),
    ]
    for user, category, description, status, admin_reply in samples:
        conn.execute(
            """
            INSERT INTO grievances (
                id, user_id, student_name, room_number, category, description,
                status, admin_reply, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                user["id"],
                user["name"],
                user["room_number"],
                category,
                description,
                status,
                admin_reply,
                (now - timedelta(days=5)).isoformat(),
                now.isoformat(),
            ),
        )


def seed_demo_data(conn) -> None:
    """Register every face in student's faces/ (ID >= 58000) and train ML."""
    faces = _discover_faces()
    if not faces:
        logger.warning("No face images found in %s", FACES_DIR)
        return

    password_hash = hash_password(DEMO_PASSWORD)
    now = datetime.utcnow()
    new_students: list[dict] = []
    room_base = 100

    for i, face in enumerate(faces):
        existing = conn.execute(
            "SELECT id FROM users WHERE student_id = ?", (face["student_id"],)
        ).fetchone()
        if existing:
            continue

        room_number = str(room_base + i + 1)
        student = _insert_student(conn, face, password_hash, room_number)
        new_students.append(student)
        logger.info("Seeded student %s — %s", face["student_id"], face["name"])

    all_students = conn.execute(
        """
        SELECT id, student_id, name, email, room_number
        FROM users WHERE role = 'student' ORDER BY student_id
        """
    ).fetchall()
    student_rows = [dict(s) for s in all_students]

    if conn.execute("SELECT COUNT(*) AS c FROM hostel_attendance").fetchone()["c"] == 0:
        today = now.strftime("%Y-%m-%d")
        for row in student_rows[: min(3, len(student_rows))]:
            conn.execute(
                """
                INSERT INTO hostel_attendance (id, user_id, date, status, source, marked_at)
                VALUES (?, ?, ?, 'present', 'face', ?)
                """,
                (str(uuid.uuid4()), row["id"], today, now.isoformat()),
            )

    _seed_sample_grievances(conn, student_rows, now)

    if new_students:
        logger.info(
            "Added %d students from face folder; starting ANN retrain in background",
            len(new_students),
        )
        threading.Thread(target=retrain_face_model, daemon=True).start()
    elif student_rows:
        logger.info(
            "All %d face-folder students already in DB (password: %s)",
            len(student_rows),
            DEMO_PASSWORD,
        )
