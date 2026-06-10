# Hostel Attendance System

This project has two main parts:

- `attendance-system/backend` - FastAPI backend, SQLite database, auth, students, grievances, attendance, and ML helper APIs.
- `hostel-attendance-system` - Next.js frontend dashboard for students and wardens/admins.

The backend must be running before the frontend can log in or load dashboard data.

## What You Need On A Fresh Computer

If the computer only has VS Code, install these first:

1. Git: https://git-scm.com/downloads
2. Node.js LTS: https://nodejs.org/
3. Python 3.10 or newer: https://www.python.org/downloads/
4. VS Code Python extension is recommended.

Docker is not required for normal development.

## Clone The Project

```bash
git clone YOUR_GITHUB_REPO_URL
cd final_year_project
```

Replace `YOUR_GITHUB_REPO_URL` with your GitHub repository link.

## Run The Backend

Open a terminal in VS Code and run:

```bash
cd attendance-system/backend
python -m venv .venv
```

Activate the virtual environment.

On Windows PowerShell:

```bash
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

Keep this terminal open. The backend will run at:

```text
http://localhost:8000
```

API docs are available at:

```text
http://localhost:8000/docs
```

The SQLite database is created automatically at `attendance-system/backend/data/hostel.db`.

## Keeping The Existing Database And Student Photos

This prototype keeps the current student database, attendance records, grievances, face photos, and trained ML data in the GitHub repository so another computer gets the same data after cloning.

Important: even for a prototype, this includes student photos and database records. Keep the GitHub repository private if the data belongs to real students.

Files/folders that contain the current data:

```text
attendance-system/backend/data/hostel.db
attendance-system/student's faces/
attendance-system/augmented_faces/
attendance-system/ann_data/
attendance-system/models/
attendance-system/edge_face_recognition/models/
```

The most important files are:

- `attendance-system/backend/data/hostel.db` - users, passwords, attendance, and grievances.
- `attendance-system/student's faces/` - original student face photos.
- `attendance-system/augmented_faces/` and `attendance-system/ann_data/` - generated ML training data.
- `attendance-system/models/` and `attendance-system/edge_face_recognition/models/` - trained face recognition model files.

### Add The Data To GitHub

From the project root:

```bash
git add README.md .gitignore attendance-system/.gitignore
git add attendance-system/backend/data/hostel.db
git add "attendance-system/student's faces"
git add attendance-system/augmented_faces
git add attendance-system/ann_data
git add attendance-system/models
git add attendance-system/edge_face_recognition/models
git commit -m "Add setup guide and prototype data"
git push origin main
```

If Git still says a file is ignored, use force add for that file/folder:

```bash
git add -f attendance-system/backend/data/hostel.db
git add -f "attendance-system/student's faces"
git add -f attendance-system/augmented_faces
git add -f attendance-system/ann_data
git add -f attendance-system/models
git add -f attendance-system/edge_face_recognition/models
```

After cloning on another computer, these files will already be present. Then run the backend and frontend normally.

### If You Only Copy The Database

The login, attendance, grievances, and student list will work, but student photos and face recognition may fail because the database stores photo filenames while the actual image files live in `attendance-system/student's faces/`.

## Run The Frontend

Open a second terminal in VS Code.

```bash
cd hostel-attendance-system
```

Create the frontend environment file:

On Windows PowerShell:

```bash
Copy-Item .env.local.example .env.local
```

On macOS/Linux:

```bash
cp .env.local.example .env.local
```

Install frontend dependencies:

```bash
corepack enable
pnpm install
```

If `pnpm` is not available, install it once:

```bash
npm install -g pnpm
pnpm install
```

Start the frontend:

```bash
pnpm dev
```

Open the app in the browser:

```text
http://localhost:3000
```

## Login Details

Default warden/admin login:

```text
Email: admin@hostel.com
Password: admin123
```

Student accounts can be created from the signup page. The signup form uploads a face photo and registers the student in the backend database.

If the sample face images are present in `attendance-system/student's faces`, the backend also seeds demo student accounts on first startup. Demo student password:

```text
student123
```

Example demo student email format:

```text
arpit58901@student.com
```

## Daily Development Commands

Backend:

```bash
cd attendance-system/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Windows backend activation:

```bash
.\.venv\Scripts\Activate.ps1
```

Frontend:

```bash
cd hostel-attendance-system
pnpm dev
```

## Before Pushing To GitHub

Do not push generated files or local secrets.

The `.gitignore` is set up to ignore new generated files like:

- `node_modules`
- `.next`
- `.env.local`
- Python virtual environments
- backend SQLite database files
- generated augmented face images

If any generated file is already tracked by Git, `.gitignore` will not remove it automatically. Check before pushing:

```bash
git status
```

Useful git commands:

```bash
git status
git add .
git commit -m "Add project setup README"
git push origin main
```

If your GitHub branch is called `master`, use:

```bash
git push origin master
```

## Common Problems

### Frontend says internal server error or login fails

Make sure the backend terminal is running on port `8000`.

Check:

```text
http://localhost:8000
```

### Port 3000 or 8000 is already in use

Stop the old terminal process with `Ctrl + C`.

For frontend on another port:

```bash
pnpm dev -- -p 3001
```

For backend on another port, also update `hostel-attendance-system/.env.local`:

```bash
uvicorn main:app --reload --port 8001
```

```text
BACKEND_URL=http://localhost:8001
```

### PowerShell blocks virtual environment activation

Run PowerShell as normal user and execute:

```bash
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then activate again:

```bash
.\.venv\Scripts\Activate.ps1
```

### Python dependency install fails

First upgrade pip:

```bash
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

If a college computer blocks package downloads, connect to a network that allows Python and npm package installation.

### Face scanner/camera feature fails

The normal dashboard, login, signup, grievances, students, and manual attendance APIs run with the backend setup above. The live camera scanner uses extra ML/camera scripts in `attendance-system/edge_face_recognition` and may need additional system setup for webcam access and face-recognition libraries.

## Project Flow

1. Start FastAPI backend.
2. Backend creates SQLite tables and default admin.
3. Start Next.js frontend.
4. Login as warden/admin or create a student account.
5. Frontend calls its Next.js API routes.
6. Next.js API routes forward requests to the FastAPI backend using `BACKEND_URL`.
