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

1. Open http://localhost:3000 → **Student Login** or **Warden Login** (separate pages)
2. **Sign up** as a student with a clear face photo (wait ~1–2 min for auto-retrain)
3. **Run the face scanner** (attendance is NOT marked from the website):

```bash
cd attendance-system/edge_face_recognition
source ../backend/.venv/bin/activate
pip install insightface onnxruntime opencv-python joblib scikit-learn
python generate_embeddings.py   # if not done after signup
python train_Ann_model.py
python hostel_live_recognition.py
```

4. Student → **Attendance** shows face-scan status (read-only)
5. **Grievances** from student; warden manages from Warden portal

**Rules:** One attendance per **24 hours** per student. Manual web marking is disabled.

## Face not recognized?

1. Use the **same Student ID** at signup as you expect the model to learn (`58901` → files like `58901_Name_aug1.jpg`)
2. Retrain after signup: warden → **Face Scanner** → Retrain, or run `generate_embeddings.py` + `train_Ann_model.py`
3. Use the **new** script `hostel_live_recognition.py` (writes to SQLite), not `ml_liveFaceRecognitionusingANN.py` (old PostgreSQL flow)
4. Good lighting, face the camera; confidence threshold is 72%

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
