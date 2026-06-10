# Hostel Attendance System

Final year project for hostel attendance and grievance management.

The project contains:

- `attendance-system/backend` - FastAPI backend, SQLite database, auth, students, grievances, attendance, and ML helper APIs.
- `hostel-attendance-system` - main Next.js frontend dashboard.
- `attendance-system/student's faces` - original student face photos kept in Git.
- `attendance-system/edge_face_recognition` - face-recognition training and recognition scripts.

Generated data is not committed. The app can recreate it from the original
student photos or when a new student signs up with a face image.

## What Is Not Pushed

These files are generated locally and ignored:

- `attendance-system/augmented_faces/`
- `attendance-system/ann_data/`
- `attendance-system/backend/data/hostel.db`
- `attendance-system/models/*.joblib`
- `attendance-system/edge_face_recognition/models/*.joblib`
- virtual environments, `node_modules`, build folders, local exports, and caches

This keeps GitHub push and clone faster.

## Requirements

Install these on a new computer:

- Git
- Python 3.10 or newer
- Node.js LTS
- pnpm for the Next.js frontend

Install pnpm if needed:

```bash
npm install -g pnpm
```

## Clone

```bash
git clone <your-github-repo-url>
cd final_year_project
```

## Run Backend

```bash
cd attendance-system/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

On Windows PowerShell, activate the environment with:

```bash
.\.venv\Scripts\Activate.ps1
```

Backend URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

## Run Frontend

Open a second terminal:

```bash
cd hostel-attendance-system
cp .env.local.example .env.local
pnpm install
pnpm dev
```

On Windows PowerShell, use:

```bash
Copy-Item .env.local.example .env.local
pnpm install
pnpm dev
```

Frontend URL:

```text
http://localhost:3000
```

## Database And Face Data

On first backend startup, the app creates:

```text
attendance-system/backend/data/hostel.db
```

If original images exist in:

```text
attendance-system/student's faces/
```

the backend seeds demo students, creates augmented images, and starts model
training in the background.

When a new student signs up with a face photo, the backend:

1. Saves the original photo in `attendance-system/student's faces/`
2. Generates augmented images in `attendance-system/augmented_faces/`
3. Saves the student in the SQLite database
4. Starts face model retraining in the background

Only commit original student photos if you want those students to exist after a
fresh clone. Do not commit generated augmented images, database files, or model
files.

## Login

Default admin:

```text
Email: admin@hostel.com
Password: admin123
```

Demo student accounts use:

```text
Password: student123
Email format: <firstname><student_id>@student.com
Example: arpit58776@student.com
```

## Push To Main

Check changes:

```bash
git status
```

Commit the cleanup:

```bash
git add .
git commit -m "Clean repo and add project README"
```

Push to GitHub `main`:

```bash
git branch -M main
git push -u origin main
```

After that, normal pushes are:

```bash
git push origin main
```

## Before Every Push

Run this check from the project root:

```bash
git ls-files | grep -E 'augmented_faces|ann_data|hostel.db|attendance.db|\.joblib|\.xlsx|\.docx'
```

It should print nothing. If it prints files, remove them from Git before pushing.

## Note About Old Git History

The current project is cleaned, but old commits may still contain generated
files. If clone is still slow after pushing this cleanup, the Git history needs
to be rewritten and force-pushed.
