import cv2
import numpy as np
from mtcnn import MTCNN
import insightface
from insightface.app import FaceAnalysis
from sklearn.metrics.pairwise import cosine_similarity
import os

# === Initialize Detector and Model ===
detector = MTCNN()
model = FaceAnalysis(name='buffalo_l')  # or 'antelopev2' for faster, smaller model
model.prepare(ctx_id=0)  # 0 for CPU

# === Known Embeddings Dict ===
known_embeddings = {}  # key: name, value: face embedding vector

def register_known_faces(known_faces_dir):
    for filename in os.listdir(known_faces_dir):
        if filename.endswith(".jpg") or filename.endswith(".png"):
            path = os.path.join(known_faces_dir, filename)
            img = cv2.imread(path)

            faces = model.get(img)
            if not faces:
                print(f"[WARN] No face detected in {filename}")
                continue

            embedding = faces[0].embedding
            name = os.path.splitext(filename)[0]
            known_embeddings[name] = embedding
            print(f"[SYNC] Registered: {name}")

def recognize_face(frame):
    faces = model.get(frame)
    if not faces:
        return None, frame

    for face in faces:
        embedding = face.embedding
        name = match_face(embedding)
        box = face.bbox.astype(int)
        cv2.rectangle(frame, (box[0], box[1]), (box[2], box[3]), (0, 255, 0), 2)
        cv2.putText(frame, name, (box[0], box[1] - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        return name, frame

    return None, frame

def match_face(embedding):
    if not known_embeddings:
        return "Unknown"

    scores = {name: cosine_similarity([embedding], [known])[0][0]
              for name, known in known_embeddings.items()}
    best_match = max(scores, key=scores.get)
    if scores[best_match] > 0.5:  # adjust threshold as needed
        return best_match
    return "Unknown"
