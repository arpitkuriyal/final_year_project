import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth_utils import get_current_user, require_admin, user_without_password
from database import get_db, row_to_dict

router = APIRouter(prefix="/grievances", tags=["Grievances"])

CATEGORIES = ["mess", "water", "electricity", "wifi", "cleaning", "room_issue"]
STATUSES = ["pending", "in_progress", "resolved", "inappropriate"]


class GrievanceCreate(BaseModel):
    category: str
    description: str = Field(min_length=10)


class GrievanceUpdate(BaseModel):
    status: str | None = None
    admin_reply: str | None = None


def _serialize_grievance(row: dict) -> dict:
    return {
        "id": row["id"],
        "studentId": row["user_id"],
        "studentName": row["student_name"],
        "roomNumber": row["room_number"],
        "category": row["category"],
        "description": row["description"],
        "status": row["status"],
        "adminReply": row.get("admin_reply"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _grievance_stats(conn) -> dict:
    rows = conn.execute(
        "SELECT status, COUNT(*) as c FROM grievances GROUP BY status"
    ).fetchall()
    counts = {r["status"]: r["c"] for r in rows}
    total = sum(counts.values())
    return {
        "total": total,
        "pending": counts.get("pending", 0),
        "inProgress": counts.get("in_progress", 0),
        "resolved": counts.get("resolved", 0),
        "inappropriate": counts.get("inappropriate", 0),
    }


@router.get("")
def list_grievances(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        if user["role"] == "admin":
            rows = conn.execute(
                "SELECT * FROM grievances ORDER BY created_at DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM grievances WHERE user_id = ? ORDER BY created_at DESC",
                (user["id"],),
            ).fetchall()
        stats = _grievance_stats(conn)

    grievances = [_serialize_grievance(dict(r)) for r in rows]
    return {"grievances": grievances, "stats": stats}


@router.post("")
def create_grievance(body: GrievanceCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can submit grievances")
    if body.category not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")

    gid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO grievances (
                id, user_id, student_name, room_number, category,
                description, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            """,
            (
                gid,
                user["id"],
                user["name"],
                user.get("room_number") or "N/A",
                body.category,
                body.description,
                now,
                now,
            ),
        )
        row = conn.execute("SELECT * FROM grievances WHERE id = ?", (gid,)).fetchone()

    return {
        "message": "Grievance submitted successfully",
        "grievance": _serialize_grievance(dict(row)),
    }


@router.patch("/{grievance_id}")
def update_grievance(
    grievance_id: str,
    body: GrievanceUpdate,
    admin: dict = Depends(require_admin),
):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM grievances WHERE id = ?", (grievance_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Grievance not found")

        updates = []
        params = []
        if body.status:
            if body.status not in STATUSES:
                raise HTTPException(status_code=400, detail="Invalid status")
            updates.append("status = ?")
            params.append(body.status)
        if body.admin_reply is not None:
            updates.append("admin_reply = ?")
            params.append(body.admin_reply)

        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")

        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        params.append(grievance_id)

        conn.execute(
            f"UPDATE grievances SET {', '.join(updates)} WHERE id = ?",
            params,
        )
        updated = conn.execute(
            "SELECT * FROM grievances WHERE id = ?", (grievance_id,)
        ).fetchone()

    return {
        "message": "Grievance updated",
        "grievance": _serialize_grievance(dict(updated)),
    }
