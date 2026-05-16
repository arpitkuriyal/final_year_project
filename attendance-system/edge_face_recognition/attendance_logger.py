import os
import psycopg2
from datetime import datetime
import pandas as pd

# === CONFIGURATION ===
DB_NAME = "attendance_db"
DB_USER = "postgres"
DB_PASSWORD = "Kaushikjii@7"
DB_HOST = "localhost"
DB_PORT = "5432"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH = os.path.join(BASE_DIR, "..", "form_responses.xlsx")  # <-- For local testing

def log_attendance(name, subject, lecture_slot):
    try:
        df = pd.read_excel(EXCEL_PATH)
        df["Photo (name it as ID_Firstname Surname)"] = df["Photo (name it as ID_Firstname Surname)"].astype(str)

        # Match the name (underscore-safe) to photo filename to get ID and details
        name_lookup = name.replace("_", " ")
        match = df[df["Name"].str.strip().str.lower() == name_lookup.strip().lower()]
        if match.empty:
            print(f"[WARN] ID not found for {name} (Excel match failed)")
            return

        student = match.iloc[0]
        student_id = int(student["Id"])
        full_name = student["Name"]
        branch = student.get("Branch", "Unknown")
        batch = student.get("Batch", "Unknown")

        now = datetime.now()
        date_str = now.date()
        time_str = now.time()

        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 1 FROM attendance_logs
            WHERE id = %s AND date = %s AND subject = %s AND lecture_slot = %s
        """, (student_id, date_str, subject, lecture_slot))

        if cursor.fetchone():
            print(f"[INFO] Attendance already logged for {name} ({subject}, {lecture_slot})")
        else:
            cursor.execute("""
                INSERT INTO attendance_logs (id, date, time, name, branch, batch, subject, lecture_slot)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                student_id, date_str, time_str,
                full_name, branch, batch,
                subject, lecture_slot
            ))
            conn.commit()
            print(f"[DB] Logged attendance for {name} ({subject}, {lecture_slot})")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] Failed to log attendance: {e}")
