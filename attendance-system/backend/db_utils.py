import psycopg2

def get_connection():
    return psycopg2.connect(
        dbname="attendance_db",
        user="arpitkuriyal",
        password="",
        host="localhost",
        port=5432
    )