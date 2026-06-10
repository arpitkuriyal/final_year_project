import os
import sys
from collections import Counter

import numpy as np
import joblib
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# === PATHS ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "..", "ann_data")

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "ann_model.joblib"
)

ENCODER_PATH = os.path.join(
    BASE_DIR,
    "models",
    "label_encoder.joblib"
)

os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

if not os.path.isdir(DATA_DIR):
    print(f"[ERROR] Embeddings folder not found: {DATA_DIR}")
    print("Run this first: python generate_embeddings.py")
    sys.exit(1)

# === Load all embeddings and labels ===
X = []
y = []

for file in os.listdir(DATA_DIR):
    if file.endswith(".npy"):
        student_id = file.split("_")[0]  # e.g., 58901
        embeddings = np.load(os.path.join(DATA_DIR, file))  # shape: (N, 512)
        for emb in embeddings:
            X.append(emb)
            y.append(student_id)

X = np.array(X)
y = np.array(y)

print(f"[INFO] Total embeddings: {len(X)}, unique students: {len(set(y))}")

if len(X) == 0:
    print("[ERROR] No embeddings found. Run: python generate_embeddings.py")
    sys.exit(1)

if len(set(y)) < 2:
    print("[ERROR] At least two students are required to train the ANN classifier.")
    print("Sign up or seed another student with a face photo, then regenerate embeddings.")
    sys.exit(1)

# === Encode labels ===
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# === Train/test split ===
class_counts = Counter(y_encoded)
can_stratify = min(class_counts.values()) >= 2 and len(X) >= 10
if can_stratify:
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded,
    )
else:
    X_train, X_test, y_train, y_test = X, X, y_encoded, y_encoded
    print("[WARN] Small dataset; reporting training-set accuracy.")

# === Train ANN ===
clf = MLPClassifier(hidden_layer_sizes=(256, 128), max_iter=500, random_state=42)
clf.fit(X_train, y_train)

# === Evaluate ===
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"[OK] Model accuracy: {acc:.2f}")

# === Save model and encoder ===
joblib.dump(clf, MODEL_PATH)
joblib.dump(label_encoder, ENCODER_PATH)
print(f"[OK] Model saved to {MODEL_PATH}")
print(f"[OK] Label encoder saved to {ENCODER_PATH}")
