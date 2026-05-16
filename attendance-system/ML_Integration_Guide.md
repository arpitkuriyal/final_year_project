# Face Recognition Attendance System — Full Workflow Documentation

This document outlines the **complete workflow** for building and deploying a face recognition-based smart attendance system, from **image ingestion** via Google Forms to **live attendance logging** using an ANN-based model and PostgreSQL.

---

## 📁 1. Image Collection via Google Forms

* **Google Form Fields:**

  * Timestamp, Email Address, ID, Name, Branch, Photo (uploaded), Batch

* **Image Saving Format:**

  * Automatically downloaded images are renamed as:

    ```
    ID_Firstname Surname.jpg
    ```
  * Saved into a structured directory: `images/{id}_{name}.jpg`

---

## 🧠 2. Preprocessing, Augmentation & Embeddings

### Step 1: Load Images

* Images are fetched from the `images/` directory using filename as ID.

### Step 2: Augmentation (optional but recommended)

* Uses basic OpenCV augmentation:

  * Flip, Rotate, Brightness, Blur
* Augmented images saved under `augmented/ID/`.

### Step 3: Generate Embeddings

* **Library used:** InsightFace
* Each image passed through `FaceAnalysis`:

  ```python
  app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
  app.prepare(ctx_id=0, det_size=(640, 640))
  ```
* Extracted embedding shape: `(1, 512)`
* Embeddings saved as `.npy` files:

  ```
  ann_data/{ID}.npy
  ```

---

## 🏋️ 3. ANN Model Training

* **Model Type:** MLPClassifier (ANN) from Scikit-learn
* **Input:** `.npy` embeddings
* **Labels:** Student ID

### Training Script Overview

* Loads all `.npy` from `ann_data/`
* Uses `LabelEncoder()` to encode student IDs
* Trains `MLPClassifier(hidden_layer_sizes=(256, 128))`
* Saves:

  * Trained model: `ann_model.joblib`
  * Encoded labels: `label_encoder.joblib`

---

## 🧪 4. Testing: ml\_liveFaceRecognitionusingann.py

### Step-by-step Flow

1. Load ANN model + label encoder
2. Launch webcam using OpenCV
3. For every frame:

   * Detect faces using InsightFace
   * Generate embedding for each face
   * Predict class (ID) via ANN
   * Lookup name, branch, batch using `sync_excel.py`
   * Check if already marked within last 1 hour
   * If not marked:

     * Log into PostgreSQL `attendance_logs` table

### PostgreSQL Table Schema: `attendance_logs`

```sql
id TEXT,
date DATE,
time TIME,
name TEXT,
branch TEXT,
batch TEXT,
subject TEXT,
lecture_slot TEXT
```

### Duplicate Prevention

* A dictionary `marked_times` holds last marked time for each (id, subject, slot)
* New entry is allowed only if:

  ```python
  now - last_marked >= 60 minutes
  ```

---

## 🧾 5. Automation Setup

### Option A: Batch File

```bat
@echo off
cd /d E:\5G Face Attendance System\edge_face_recognition
python ml_liveFaceRecognitionusingann.py
```

### Option B: Task Scheduler

* Run the above `.bat` file on login or specific time

### Option C: GUI Tool (Optional)

* A simple Python GUI (e.g., using Tkinter or PyQt) can control:

  * Training
  * Running attendance
  * Embedding refresh

---

## 🗂️ Directory Structure

```
5G Face Attendance System/
├── edge_face_recognition/
│   ├── images/
│   ├── augmented/
│   ├── ann_data/
│   ├── models/
│   │   ├── ann_model.joblib
│   │   └── label_encoder.joblib
│   ├── sync_excel.py
│   ├── train_ann_model.py
│   ├── generate_embeddings.py
│   ├── ml_liveFaceRecognitionusingann.py
│   └── utils/
│       └── augmentation.py
```

---

## ✅ Summary

| Stage         | Description                                                |
| ------------- | ---------------------------------------------------------- |
| Image Intake  | Via Google Form, downloaded and renamed                    |
| Preprocessing | Augmented and embedded using InsightFace                   |
| Training      | ANN model trained on `.npy` embeddings                     |
| Prediction    | Real-time recognition using webcam                         |
| Logging       | Attendance saved to PostgreSQL with duplication prevention |
| Automation    | Batch file + Scheduler or GUI optional                     |

---

Let me know if you want a PDF version, GitHub README format, or integration into your repo.
