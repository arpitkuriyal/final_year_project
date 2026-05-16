import cv2
from insightface.app import FaceAnalysis
import os

# === CONFIG ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SAVE_DIR = os.path.join(BASE_DIR, "..", "known faces")
NAME = "58901_Arpit_Kaushik"
CAMERA_SOURCE = "http://192.168.29.147"  

# === INITIALIZE ===
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("[ERROR] Camera could not be opened.")
    exit()
print("[INFO] Show your face in front of the camera... Press 's' to save.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    faces = app.get(frame)
    for face in faces:
        x1, y1, x2, y2 = face.bbox.astype(int)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    cv2.namedWindow("Register Face", cv2.WINDOW_NORMAL)
    cv2.imshow("Face Registration", frame)

    key = cv2.waitKey(1)
    if key == ord('s') and faces:
        face_img = frame[y1:y2, x1:x2]
        save_path = os.path.join(SAVE_DIR, f"{NAME}.jpg")
        cv2.imwrite(save_path, face_img)
        print(f"[SUCCESS] Face saved to: {save_path}")
        break
    elif key == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
