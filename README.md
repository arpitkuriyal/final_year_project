# Hostel Attendance System

Final year project for hostel attendance, grievance management, and hostel-gate
face attendance.

The project contains:

- `attendance-system/backend` - FastAPI backend, SQLite database, auth, students,
  grievances, attendance, and ML scanner APIs.
- `hostel-attendance-system` - main Next.js frontend dashboard.
- `attendance-system/student's faces` - original student face photos kept in Git.
- `attendance-system/edge_face_recognition` - embedding, ANN training, and camera
  recognition scripts.

Generated data is not committed. A fresh clone recreates it from the original
student photos or from new student signup photos.

## Install On A New Device

Install these first:

- Git: https://git-scm.com/downloads
- Python 3.10 or newer: https://www.python.org/downloads/
- Node.js LTS: https://nodejs.org/

After installing Node.js, install pnpm:

```bash
npm install -g pnpm
```

On macOS with Python from python.org, run this once if Python shows SSL
certificate errors:

```bash
open "/Applications/Python 3.11/Install Certificates.command"
```

Change `3.11` to your installed Python version if needed.

## Clone

```bash
git clone <your-github-repo-url>
cd final_year_project
```

## Backend Setup

Open the first terminal:

```bash
cd attendance-system/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On Windows PowerShell:

```powershell
cd attendance-system/backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

On first startup, the backend creates `attendance-system/backend/data/hostel.db`,
seeds the students from `attendance-system/student's faces/`, creates
`attendance-system/augmented_faces/`, and starts ANN retraining in the
background.

## Train The Face Model

Before opening the admin camera scanner, make sure the ANN model files exist.
Use the same backend virtual environment.

Open a new terminal:

```bash
cd attendance-system/backend
source .venv/bin/activate
cd ../edge_face_recognition
python generate_embeddings.py
python train_Ann_model.py
```

On Windows PowerShell:

```powershell
cd attendance-system/backend
.\.venv\Scripts\Activate.ps1
cd ..\edge_face_recognition
python generate_embeddings.py
python train_Ann_model.py
```

Successful training creates:

```text
attendance-system/ann_data/
attendance-system/edge_face_recognition/models/ann_model.joblib
attendance-system/edge_face_recognition/models/label_encoder.joblib
```

If `generate_embeddings.py` says `augmented_faces` is missing, start the backend
once first or sign up at least two students with face photos.

## Frontend Setup

Open another terminal:

```bash
cd hostel-attendance-system
cp .env.local.example .env.local
pnpm install
pnpm dev
```

On Windows PowerShell:

```powershell
cd hostel-attendance-system
Copy-Item .env.local.example .env.local
pnpm install
pnpm dev
```

Frontend URL:

```text
http://localhost:3000
```

## Open The Admin Camera

1. Keep the backend running on `http://localhost:8000`.
2. Keep the frontend running on `http://localhost:3000`.
3. Log in as admin.
4. Go to the warden dashboard.
5. Click **Start** in **Face Attendance Scanner**.

Default admin:

```text
Email: admin@hostel.com
Password: admin123
```

The scanner uses camera index `0` by default. If the camera cannot open, give
camera permission to Terminal/PowerShell or set `SCANNER_CAMERA_INDEX=1` in
`hostel-attendance-system/.env.local` and restart `pnpm dev`.

Scanner logs are written to:

```text
attendance-system/edge_face_recognition/scanner.log
```

## Student Login

Demo student accounts use:

```text
Password: student123
Email format: <firstname><student_id>@student.com
Example: arpit58776@student.com
```

When a new student signs up with a face photo, the backend saves the original
photo, creates augmented images, adds the student to SQLite, and retrains the
face model in the background.

## What Is Not Pushed

These files are generated locally and ignored:

- `attendance-system/augmented_faces/`
- `attendance-system/ann_data/`
- `attendance-system/backend/data/hostel.db`
- `attendance-system/edge_face_recognition/models/*.joblib`
- `attendance-system/edge_face_recognition/scanner.log`
- virtual environments, `node_modules`, build folders, local exports, and caches

Only commit original student photos if you want those students to exist after a
fresh clone. Do not commit generated augmented images, database files, or model
files.

## Before Every Push

Run this check from the project root:

```bash
git ls-files | grep -E 'augmented_faces|ann_data|hostel.db|attendance.db|\.joblib|scanner.log|\.xlsx|\.docx'
```

It should print nothing. If it prints files, remove them from Git before pushing.
