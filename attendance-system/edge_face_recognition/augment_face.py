import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
import random

# === CONFIG ===

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_DIR = os.path.join(BASE_DIR, "..", "student's faces")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "augmented_faces")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# === AUGMENTATION FUNCTIONS ===
def random_rotate(img):
    angle = random.choice([-20, -10, 0, 10, 20])
    return img.rotate(angle)

def change_brightness(img):
    factor = random.uniform(0.5, 1.5)
    enhancer = ImageEnhance.Brightness(img)
    return enhancer.enhance(factor)

def add_noise(img):
    arr = np.array(img)
    noise = np.random.normal(0, 25, arr.shape).astype(np.uint8)
    noisy = cv2.add(arr, noise)
    return Image.fromarray(noisy)

def apply_blur(img):
    return img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))

def horizontal_flip(img):
    return img.transpose(Image.FLIP_LEFT_RIGHT)

augmentations = [random_rotate, change_brightness, add_noise, apply_blur, horizontal_flip]

# === PROCESS EACH STUDENT IMAGE ===
for filename in os.listdir(INPUT_DIR):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        try:
            student_path = os.path.join(INPUT_DIR, filename)
            base_name = os.path.splitext(filename)[0]  # e.g. "58901_Arpit_Kaushik"
            original = Image.open(student_path).convert("RGB")

            # Save the original image in output dir
            original.save(os.path.join(OUTPUT_DIR, f"{base_name}_original.jpg"))

            # Generate 20 augmentations
            for i in range(1, 21):
                img = original.copy()
                for func in random.sample(augmentations, k=random.randint(1, 3)):
                    img = func(img)
                img.save(os.path.join(OUTPUT_DIR, f"{base_name}_aug{i}.jpg"))
            
            print(f"[✓] Augmented: {filename}")
        except Exception as e:
            print(f"[X] Error processing {filename}: {e}")

print("[✅ DONE] All student images augmented.")
