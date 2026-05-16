from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import auth, grievances, hostel_attendance, students

app = FastAPI(
    title="Hostel Attendance & Grievance API",
    description="MVP backend for hostel face attendance and grievance management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "hostel-attendance-api",
        "docs": "/docs",
    }


app.include_router(auth.router)
app.include_router(students.router)
app.include_router(grievances.router)
app.include_router(hostel_attendance.router)
