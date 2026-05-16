# Automating Face Recognition Attendance System

This document outlines various ways to **automatically run the face recognition attendance system** (specifically, `ml_liveFaceRecognitionusingann.py`) depending on your deployment environment.

---

## 1. Run on System Boot (Windows)

Automatically run the script when the system starts.

### Steps:

1. Open **Task Scheduler**.
2. Click **Create Basic Task**.
3. Set trigger: `When the computer starts`.
4. Set action: `Start a program`.
5. **Program/script:**

   ```
   python
   ```
6. **Add arguments:**

   ```
   "E:\5G Face Attendance System\edge_face_recognition\ml_liveFaceRecognitionusingann.py"
   ```
7. **Start in (optional):**

   ```
   E:\5G Face Attendance System\edge_face_recognition
   ```

---

## 2. `.bat` File for Manual/Auto Trigger

Create a `.bat` file to run the script by double-clicking or placing it in the startup folder.

### Content of `start_attendance.bat`:

```bat
@echo off
cd /d "E:\5G Face Attendance System\edge_face_recognition"
python ml_liveFaceRecognitionusingann.py
pause
```

---

## 3. Integrate with Backend API (FastAPI)

You can expose this as an API endpoint in your backend for dynamic control:

```python
from fastapi import FastAPI, BackgroundTasks
import subprocess

app = FastAPI()

@app.post("/start-recognition/")
def start_recognition_task(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_recognition_script)
    return {"message": "Recognition started in background"}

def run_recognition_script():
    subprocess.run(["python", "ml_liveFaceRecognitionusingann.py"])
```

---

## 4. Schedule Attendance Windows

### Windows Task Scheduler:

* Trigger the task only during lecture hours (e.g., 9:00 AM – 11:00 AM)
* Use `End task after 1 hour` option

### Auto-exit Option:

In your script, add a timeout condition:

```python
import time
start_time = time.time()
while True:
    if time.time() - start_time > 3600:
        break
```

---

## 5. Dockerize for Production Deployment

Create a `Dockerfile`:

```Dockerfile
FROM python:3.10
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["python", "ml_liveFaceRecognitionusingann.py"]
```

### Build and Run:

```bash
docker build -t face_attendance .
docker run --restart=always face_attendance
```

---

## 6. Auto-Restart on Crash (PowerShell)

Use a loop to keep the script running:

```powershell
:loop
python ml_liveFaceRecognitionusingann.py
timeout /t 5
goto loop
```

---

## Recommendation

For development or local use, Task Scheduler + `.bat` file is easiest.
For production (e.g., 5G lab server), Docker with auto-restart is most robust.

Let me know if you'd like these options bundled in an installer or GUI!
