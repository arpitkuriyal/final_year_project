import os
import sys
import numpy as np
import cv2
from collections import defaultdict

os.environ.setdefault("NO_ALBUMENTATIONS_UPDATE", "1")

try:
    from insightface.app import FaceAnalysis
except ImportError:
    print("[ERROR] Missing ML dependencies. Install them with:")
    print("  pip install -r ../backend/requirements.txt")
    sys.exit(1)

# === PATHS ===

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_DIR = os.path.join(BASE_DIR, "..", "augmented_faces")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "ann_data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

if not os.path.isdir(INPUT_DIR):
    print(f"[ERROR] Augmented faces folder not found: {INPUT_DIR}")
    print("Start the backend once to seed demo students and create augmented faces,")
    print("or sign up at least two students with face photos before training.")
    sys.exit(1)

# === Initialize FaceAnalysis ===
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
app.prepare(ctx_id=0, det_size=(640, 640))

# === Group images by student ID ===
student_images = defaultdict(list)

for file in os.listdir(INPUT_DIR):
    if file.lower().endswith((".jpg", ".jpeg", ".png")):
        try:
            student_id = file.split("_")[0]  # Extract ID like 58901
            student_images[student_id].append(file)
        except Exception as e:
            print(f"[X] Error parsing filename {file}: {e}")

if not student_images:
    print(f"[ERROR] No face images found in: {INPUT_DIR}")
    print("Add/sign up student photos first, then rerun this script.")
    sys.exit(1)

# === Generate embeddings for each student ===
for student_id, files in student_images.items():
    embeddings = []

    print(f"[INFO] Processing student ID: {student_id} ({len(files)} images)")

    for file in files:
        img_path = os.path.join(INPUT_DIR, file)
        img = cv2.imread(img_path)
        if img is None:
            print(f"[WARN] Couldn't read: {img_path}")
            continue

        faces = app.get(img)
        if not faces:
            print(f"[WARN] No face in: {file}")
            continue

        embeddings.append(faces[0].embedding)

    if embeddings:
        embeddings_array = np.array(embeddings)
        np.save(os.path.join(OUTPUT_DIR, f"{student_id}_embeddings.npy"), embeddings_array)
        print(f"[OK] Saved: {student_id}_embeddings.npy ({embeddings_array.shape})")
    else:
        print(f"[ERROR] No embeddings found for {student_id}")

print("\n[OK] Embedding generation completed.")
