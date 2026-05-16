import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Generator

import bcrypt

from config import DB_PATH, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None
    return dict(row)


def init_db() -> None:
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                student_id TEXT UNIQUE,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('student', 'admin')),
                room_number TEXT,
                block TEXT,
                branch TEXT,
                batch TEXT,
                photo_filename TEXT,
                augment_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS hostel_attendance (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('present', 'absent')),
                source TEXT DEFAULT 'manual',
                marked_at TEXT NOT NULL,
                UNIQUE(user_id, date),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS grievances (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                room_number TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                admin_reply TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            """
        )

        admin = conn.execute(
            "SELECT id FROM users WHERE email = ?", (DEFAULT_ADMIN_EMAIL,)
        ).fetchone()
        if not admin:
            import uuid

            now = datetime.utcnow().isoformat()
            conn.execute(
                """
                INSERT INTO users (id, student_id, name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    None,
                    "Warden",
                    DEFAULT_ADMIN_EMAIL,
                    hash_password(DEFAULT_ADMIN_PASSWORD),
                    "admin",
                    now,
                ),
            )


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
