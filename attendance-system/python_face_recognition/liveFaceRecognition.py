import cv2
import face_recognition
import numpy as np
import os
from datetime import datetime
from attendance_logger import log_attendance
from syncKnownFaces import sync_known_faces


# Sync before starting
sync_known_faces()

# === Load known faces ===
known_face_encodings = []
known_face_names = []

#  5G LAB: Update path if running in Docker or shared server environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

known_dir = os.path.join(BASE_DIR, "..", "known faces")
for file in os.listdir(known_dir):
    if file.lower().endswith((".jpg", ".jpeg", ".png")):
        img_path = os.path.join(known_dir, file)
        img = face_recognition.load_image_file(img_path)
        encodings = face_recognition.face_encodings(img)
        if encodings:
            known_face_encodings.append(encodings[0])
            filename = file.rsplit('.', 1)[0]
            id_and_name = filename.split('_', 1)
            if len(id_and_name) == 2:
                student_id, name = id_and_name
                known_face_names.append((student_id, name))
            else:
                print(f"[WARN] Filename not formatted correctly: {filename}")


# === Webcam or IP Camera Stream ===
# 5G LAB: Replace 0 with your IP camera stream URL, e.g., "http://<ip>:<port>/video"
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    small = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb)
    face_encodings = face_recognition.face_encodings(rgb, face_locations)

    for encoding, location in zip(face_encodings, face_locations):
        matches = face_recognition.compare_faces(known_face_encodings, encoding)
        name = "Unknown"

        face_distances = face_recognition.face_distance(known_face_encodings, encoding)
        best_match_index = np.argmin(face_distances)
        if matches[best_match_index]:
            student_id, name = known_face_names[best_match_index]

            # Replace these with dynamic input or config if needed in 5G deployment
            SUBJECT = "AI/ML"
            LECTURE_SLOT = "10:00 AM - 11:00 AM"

        if name != "Unknown":
            log_attendance(name, SUBJECT, LECTURE_SLOT)

        # Draw face box and label
        top, right, bottom, left = [v * 4 for v in location]
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.putText(frame, name, (left, top - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        print(f"{name} recognized at {datetime.now().strftime('%H:%M:%S')}")

    cv2.imshow("Live Feed", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
