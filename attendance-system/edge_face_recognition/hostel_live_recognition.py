"""
Hostel gate face attendance — writes to SQLite (same DB as the web backend).

Run after signup + retrain:
  cd attendance-system/edge_face_recognition
  python hostel_live_recognition.py
"""

import datetime
import os
import sys
from pathlib import Path

import cv2
import joblib
import numpy as np

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from services.hostel_face_attendance import (  # noqa: E402
    TIME_LIMIT_HOURS,
    get_student_face_status,
    mark_face_attendance,
)

try:
    from insightface.app import FaceAnalysis
except ImportError:
    print("[ERROR] Install: pip install insightface onnxruntime opencv-python joblib scikit-learn")
    sys.exit(1)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "ann_model.joblib"
ENCODER_PATH = BASE_DIR / "models" / "label_encoder.joblib"

CONFIDENCE_THRESHOLD = 0.72
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
SKIP_FRAMES = 4
MARK_COOLDOWN_SEC = 30
WINDOW_NAME = "Hostel Face Attendance"

# BGR colors
C_UNKNOWN = (80, 80, 255)
C_READY = (0, 200, 255)
C_MARKED = (0, 180, 255)
C_SUCCESS = (0, 220, 0)
C_LOW = (0, 140, 255)


def _load_models():
    if not MODEL_PATH.exists() or not ENCODER_PATH.exists():
        print("[ERROR] Model not found. Run:")
        print("  python generate_embeddings.py")
        print("  python train_Ann_model.py")
        sys.exit(1)
    return joblib.load(MODEL_PATH), joblib.load(ENCODER_PATH)


def _draw_panel(frame, lines, accent):
    h, w = frame.shape[:2]
    line_h = 28
    pad = 12
    panel_h = pad * 2 + line_h * len(lines)
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, h - panel_h), (w, h), (24, 24, 24), -1)
    cv2.addWeighted(overlay, 0.82, frame, 0.18, 0, frame)
    cv2.line(frame, (0, h - panel_h), (w, h - panel_h), accent, 2)
    y = h - panel_h + pad + 20
    for i, (text, color) in enumerate(lines):
        weight = cv2.FONT_HERSHEY_DUPLEX if i == 0 else cv2.FONT_HERSHEY_SIMPLEX
        scale = 0.72 if i == 0 else 0.58
        cv2.putText(frame, text, (pad, y + i * line_h), weight, scale, color, 2, cv2.LINE_AA)


def _draw_face_box(frame, x1, y1, x2, y2, color, name, status):
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    label = f"{name}  |  {status}"
    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
    ty = max(y1 - 10, th + 8)
    cv2.rectangle(frame, (x1, ty - th - 8), (x1 + tw + 12, ty + 4), color, -1)
    cv2.putText(
        frame, label, (x1 + 6, ty),
        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA,
    )


def _recognize(face, model, le):
    embedding = face.embedding.reshape(1, -1)
    pred = model.predict(embedding)[0]
    proba = model.predict_proba(embedding)[0]
    confidence = float(np.max(proba))
    if confidence < CONFIDENCE_THRESHOLD:
        return None, confidence
    student_id = str(le.inverse_transform([pred])[0])
    return student_id, confidence


def main():
    model, le = _load_models()
    face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0, det_size=(640, 640))

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open camera index {CAMERA_INDEX}. Try CAMERA_INDEX=1.")
        sys.exit(1)

    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print("[INFO] Hostel face scanner running. Press Q to quit.")
    print(f"[INFO] One attendance mark per student per {TIME_LIMIT_HOURS} hours.")

    frame_counter = 0
    recent_marks = {}
    hud_lines = [("Point your face at the camera", (200, 200, 200))]
    hud_accent = C_READY
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_counter += 1
        display = frame.copy()
        faces = face_app.get(frame) if frame_counter % SKIP_FRAMES == 0 else []

        for face in faces:
            x1, y1, x2, y2 = face.bbox.astype(int)
            name = "Unknown"
            status = "Scanning..."
            color = C_UNKNOWN

            try:
                student_id, confidence = _recognize(face, model, le)
                if not student_id:
                    name = "Unknown"
                    status = f"Low confidence ({confidence:.0%})"
                    color = C_LOW
                else:
                    info = get_student_face_status(student_id)
                    name = info.get("name") or f"ID {student_id}"
                    now = datetime.datetime.now()

                    if not info["found"]:
                        status = info["statusLabel"]
                        color = C_UNKNOWN
                    elif info["status"] == "marked":
                        status = "Already marked"
                        color = C_MARKED
                        hud_lines = [
                            (name, (255, 255, 255)),
                            (status, C_MARKED),
                            (
                                info.get("detail", f"Try again after {TIME_LIMIT_HOURS} hours"),
                                (180, 180, 180),
                            ),
                        ]
                        hud_accent = C_MARKED
                    else:
                        last_mark = recent_marks.get(student_id)
                        if last_mark and (now - last_mark).total_seconds() < MARK_COOLDOWN_SEC:
                            status = "Marked (session)"
                            color = C_SUCCESS
                        else:
                            status = "Marking attendance..."
                            color = C_READY
                            result = mark_face_attendance(student_id)
                            if result["success"]:
                                name = result["name"]
                                status = "Attendance marked"
                                color = C_SUCCESS
                                recent_marks[student_id] = now
                                print(f"[OK] {result['message']}")
                                hud_lines = [
                                    (name, (255, 255, 255)),
                                    ("Attendance marked successfully", C_SUCCESS),
                                    (f"Student ID: {student_id}", (180, 180, 180)),
                                ]
                                hud_accent = C_SUCCESS
                            else:
                                name = result.get("name", name)
                                status = "Already marked"
                                color = C_MARKED
                                print(f"[--] {result['message']}")
                                hud_lines = [
                                    (name, (255, 255, 255)),
                                    (status, C_MARKED),
                                    (result["message"][:60], (180, 180, 180)),
                                ]
                                hud_accent = C_MARKED

            except Exception as exc:
                name = "Error"
                status = str(exc)[:40]
                color = C_UNKNOWN
                print(f"[ERROR] {exc}")

            _draw_face_box(display, x1, y1, x2, y2, color, name, status)

        if not faces and frame_counter % 30 == 0:
            hud_lines = [("Point your face at the camera", (200, 200, 200))]
            hud_accent = C_READY

        _draw_panel(display, hud_lines, hud_accent)
        cv2.putText(
            display, "Q = Quit",
            (display.shape[1] - 100, 28),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (160, 160, 160), 1, cv2.LINE_AA,
        )
        cv2.imshow(WINDOW_NAME, display)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
