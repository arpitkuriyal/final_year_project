import cv2
import os
import pandas as pd
import numpy as np
import time
from datetime import datetime
from attendance_logger import log_attendance  # Use this only
from edge_face_recognition.ml_liveFaceRecognitionusingANN import BASE_DIR
from sync_excel import download_latest_excel
from insightface.app import FaceAnalysis

# === CONFIGURATION ===
EXCEL_PATH = os.path.join(BASE_DIR, "..", "form_responses.xlsx")
KNOWN_FACES_DIR = os.path.join(BASE_DIR, "..", "known faces")
SUBJECT = "AI/ML"
LECTURE_SLOT = "10:00 AM - 11:00 AM"

# === STEP 1: SYNC LATEST EXCEL ===
download_latest_excel()
print("[SYNC] Excel downloaded.")

# === STEP 2: LOAD STUDENT DETAILS ===
df = pd.read_excel(EXCEL_PATH)
df["Photo (name it as ID_Firstname Surname)"] = df["Photo (name it as ID_Firstname Surname)"].astype(str)

# === STEP 3: INITIALIZE FACE ANALYSIS ENGINE ===
face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(640, 640))

known_embeddings = []
known_names = []

# === STEP 4: REGISTER KNOWN FACES ===
for filename in os.listdir(KNOWN_FACES_DIR):
    if filename.lower().endswith((".jpg", ".png")):
        img_path = os.path.join(KNOWN_FACES_DIR, filename)
        img = cv2.imread(img_path)
        faces = face_app.get(img)
        if faces:
            known_embeddings.append(faces[0].embedding)
            name = os.path.splitext(filename)[0]
            known_names.append(name)
            print(f"[SYNC] Registered: {name} | Embedding length: {len(faces[0].embedding)}")
        else:
            print(f"[WARN] No face detected in {filename} — check image quality.")

# === STEP 5: START VIDEO STREAM ===
# Use DroidCam IP if needed
# cap = cv2.VideoCapture("http://<your-ip>:<port>/video")
cap = cv2.VideoCapture(0)

print("[INFO] Starting ML-powered face recognition...")
frame_count = 0

while True:
    ret, frame = cap.read()
    start_time = time.time()
    if not ret:
        print("[ERROR] Frame not received.")
        break

    faces = face_app.get(frame)

    for face in faces:
        emb = face.normed_embedding
        distances = [np.linalg.norm(emb - known_emb) for known_emb in known_embeddings]

        if distances:
            min_dist = min(distances)
            idx = distances.index(min_dist)
            
            x1, y1, x2, y2 = face.bbox.astype(int)

            print(f"[DEBUG] Closest match: {name} with distance: {min_dist:.2f}")

            if min_dist < 0.5:
                student_id, name = known_names[idx].split("_", 1)
                log_attendance(student_id, name, df, subject=SUBJECT, lecture_slot=LECTURE_SLOT)

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, name.replace("_", " "), (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
            else:
                print("[INFO] Face detected but no close match found.")
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, "Unknown", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)

    # === OPTIONAL: Display window
    cv2.imshow("ML Face Recognition", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    # === Display FPS
    fps = 1.0 / (time.time() - start_time)
    cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

    # === Save snapshot every 100 frames
    frame_count += 1
    if frame_count % 100 == 0:
        cv2.imwrite("frame_output.jpg", frame)

cap.release()
cv2.destroyAllWindows()
