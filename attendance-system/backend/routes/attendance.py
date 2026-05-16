from fastapi import APIRouter, HTTPException
from db_utils import get_connection

router = APIRouter()

@router.get("/")
def get_all_attendance():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM attendance_logs ORDER BY time DESC LIMIT 100")
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        conn.close()
        return {"attendance": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")

@router.get("/{student_id}")
def get_attendance_by_id(student_id: str):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM attendance_logs WHERE id = %s ORDER BY time DESC", (student_id,))
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        result = [dict(zip(columns, row)) for row in rows]
        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="No attendance found for this student.")
        return {"attendance": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching data: {e}")