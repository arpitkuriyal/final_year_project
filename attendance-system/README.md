# Hostel Attendance System (with ML Face Pipeline)

This repo powers the **FastAPI backend** and **face recognition / augmentation** for the hostel MVP.

The **Next.js UI** lives in the sibling project:

`/Users/arpitkuriyal/Desktop/final_year_project/hostel-attendance-system`

See **[HOSTEL_MVP.md](./HOSTEL_MVP.md)** for setup and demo flow.

## Quick start (backend only)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
