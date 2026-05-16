import psycopg2
from datetime import datetime

def log_attendance(student_id, name, subject="AI", lecture_slot="A1"):
    # Match details from Excel
    name_lookup = name.replace("_", " ").strip().lower()
    matched = df[df["Name"].str.strip().str.lower() == name_lookup]

    if matched.empty:
        print(f"[WARN] ID not found for {name} in Excel")
        branch = "Unknown"
        batch = "Unknown"
    else:
        branch = matched.iloc[0]["Branch"]
        batch = matched.iloc[0]["Batch"]

    # Connect to PostgreSQL
    try:
        conn = psycopg2.connect(
            dbname="attendance_db",
            user="admin",
            password="Kaushikjii@7",
            host="localhost",
            port="5432"
        )
        cursor = conn.cursor()

        now = datetime.now()
        query = """
            INSERT INTO attendance_logs (id, date, time, name, branch, batch, subject, lecture_slot)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            student_id,
            now.date(),
            now.time(),
            name.replace("_", " "),
            branch,
            batch,
            subject,
            lecture_slot
        ))
        conn.commit()
        cursor.close()
        conn.close()
        print(f"[LOGGED] {name} marked present at {now.strftime('%H:%M:%S')}")
    except Exception as e:
        print(f"[ERROR] DB logging failed: {e}")
