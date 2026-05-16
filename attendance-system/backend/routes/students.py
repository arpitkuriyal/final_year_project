import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import pandas as pd

router = APIRouter(prefix="/students", tags=["Students"])

# === PATH SETUP ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_PATH = os.path.join(
    BASE_DIR,
    "..",
    "..",
    "form_responses.xlsx"
)

# === STUDENT MODEL ===
class Student(BaseModel):
    id: str
    name: str
    branch: str
    batch: str


# === ADD STUDENT ROUTE ===
@router.post("/")
def add_student(student: Student):

    # Check Excel exists
    if not os.path.exists(EXCEL_PATH):
        raise HTTPException(
            status_code=500,
            detail=f"Excel file not found at: {EXCEL_PATH}"
        )

    # Load Excel
    df = pd.read_excel(EXCEL_PATH)

    print("Received:", student.dict())

    # Prevent duplicate IDs
    if student.id in df["Id"].astype(str).values:
        raise HTTPException(
            status_code=400,
            detail="Student ID already exists"
        )

    # Create new row
    new_row = {
        "Timestamp": pd.Timestamp.now(),
        "Email Address": "",
        "Id": student.id,
        "Name": student.name,
        "Branch": student.branch,
        "Photo (name it as ID_Firstname Surname)": "",
        "Batch": student.batch
    }

    # Append new student
    df = pd.concat(
        [df, pd.DataFrame([new_row])],
        ignore_index=True
    )

    # Save back to Excel
    df.to_excel(EXCEL_PATH, index=False)

    return {
        "message": "Student added successfully",
        "student": student.dict()
    }