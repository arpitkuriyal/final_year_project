"""
Hostel gate face attendance — writes to SQLite (same DB as the web backend).

Run after signup + retrain:
  cd attendance-system/edge_face_recognition
  python hostel_live_recognition.py

Requires: insightface, opencv, joblib, sklearn (use project venv with those installed).
"""

import os
import sys
import cv2
import numpy as np
import joblib
import datetime
from pathlib import Path

# Backend services (SQLite attendance)
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from services.hostel_face_attendance import mark_face_attendance  # noqa: E402

try:
    from insightface.app import FaceAnalysis
except ImportError:
    print("[ERROR] Install insightface: pip install insightface onnxruntime")
    sys.exit(1)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "ann_model.joblib"
ENCODER_PATH = BASE_DIR / "models" / "label_encoder.joblib"

CONFIDENCE_THRESHOLD = 0.72
CAMERA_INDEX = 0
SKIP_FRAMES = 4

if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
    print("[ERROR] Model not found. Run first:")
    print("  python generate_embeddings.py")
    print("  python train_Ann_model.py")
    sys.exit(1)

model = joblib.load(MODEL_PATH)
le = joblib.load(ENCODER_PATH)

face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0, det_size=(640, 640))

cap = cv2.VideoCapture(CAMERA_INDEX)
if not cap.isOpened():
    print("[ERROR] Cannot open webcam. Try CAMERA_INDEX=1 in script.")
    sys.exit(1)

cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("[INFO] Hostel face scanner running. Press Q to quit.")
print("[INFO] One attendance per student per 24 hours.")

frame_counter = 0
recent_marks = {}  # student_id -> datetime (avoid spam in same session)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_counter += 1
    display = frame.copy()
    faces = face_app.get(frame) if frame_counter % SKIP_FRAMES == 0 else []

    for face in faces:
        x1, y1, x2, y2 = face.bbox.astype(int)
        label = "Unknown"
        color = (0, 0, 255)

        try:
            embedding = face.embedding.reshape(1, -1)
            pred = model.predict(embedding)[0]
            proba = model.predict_proba(embedding)[0]
            confidence = float(np.max(proba))

            if confidence >= CONFIDENCE_THRESHOLD:
                student_roll_id = str(le.inverse_transform([pred])[0])
                label = f"{student_roll_id} ({confidence:.0%})"

                last = recent_marks.get(student_roll_id)
                now = datetime.datetime.now()
                if last and (now - last).total_seconds() < 30:
                    label += " [wait]"
                    color = (0, 165, 255)
                else:
                    result = mark_face_attendance(student_roll_id)
                    if result["success"]:
                        label = f"{result['name']} OK"
                        color = (0, 255, 0)
                        recent_marks[student_roll_id] = now
                        print(f"[OK] {result['message']}")
                    else:
                        label = result.get("name", student_roll_id) + " " + result["message"][:40]
                        color = (0, 165, 255)
                        print(f"[--] {result['message']}")
            else:
                label = f"Low conf ({confidence:.0%})"
        except Exception as exc:
            label = "Error"
            print(f"[ERROR] {exc}")

        cv2.rectangle(display, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            display, label, (x1, max(y1 - 8, 20)),
            cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2,
        )

    cv2.imshow("Hostel Face Attendance", display)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
