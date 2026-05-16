# Hostel Attendance & Grievance MVP

Two projects work together:

| Project | Path | Role |
|---------|------|------|
| **Backend + ML** | `attendance-system/` | FastAPI API, SQLite DB, face photo storage & augmentation |
| **Frontend** | `hostel-attendance-system/` | Next.js dashboard (signup, attendance, grievances) |

## Features (MVP)

- **Student signup** with Student ID, room/block/branch/batch, password, and **face photo**
- On signup, photo is saved to `student's faces/` and **20 augmented images** are generated in `augmented_faces/` for your ML pipeline
- **Daily hostel attendance** (manual mark from student dashboard)
- **Grievances** (student submit, admin update status & reply)
- **Admin dashboard** stats (attendance trend, grievance counts)
- Default admin: `admin@hostel.com` / `admin123`

## Quick start

### 1. Backend (terminal 1)

```bash
cd /Users/arpitkuriyal/Desktop/final_year_project/attendance-system/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (terminal 2)

```bash
cd /Users/arpitkuriyal/Desktop/final_year_project/hostel-attendance-system
cp .env.local.example .env.local
pnpm install   # or npm install
pnpm dev
```

Open http://localhost:3000

### 3. Try the flow

1. **Sign up** as a student with a clear face photo
2. Check `attendance-system/augmented_faces/` for new `STUDENTID_Name_aug*.jpg` files
3. **Mark attendance** from Student → Attendance
4. **Submit a grievance** from Student → Grievances
5. **Login as admin** and manage grievances + view dashboard

## Connect face recognition (existing ML)

After students register, run your existing training pipeline:

```bash
cd attendance-system/edge_face_recognition
python train_Ann_model.py
python ml_liveFaceRecognitionusingANN.py
```

Recognized faces can log attendance with `source: face` (extend backend later).

## API overview

| Endpoint | Description |
|----------|-------------|
| `POST /auth/signup` | Multipart: profile + photo → augment |
| `POST /auth/login` | JSON email/password |
| `GET /auth/me` | Current user (Bearer token) |
| `GET/POST /hostel-attendance` | Student attendance |
| `GET /hostel-attendance/admin/stats` | Admin dashboard |
| `GET/POST /grievances` | List / create |
| `PATCH /grievances/{id}` | Admin update |
| `GET /students` | Admin student list |

Database file: `backend/data/hostel.db`
