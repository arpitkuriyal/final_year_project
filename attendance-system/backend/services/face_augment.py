import random
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def _random_rotate(img: Image.Image) -> Image.Image:
    angle = random.choice([-20, -10, 0, 10, 20])
    return img.rotate(angle)


def _change_brightness(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.5, 1.5)
    return ImageEnhance.Brightness(img).enhance(factor)


def _add_noise(img: Image.Image) -> Image.Image:
    arr = np.array(img)
    noise = np.random.normal(0, 25, arr.shape).astype(np.uint8)
    noisy = cv2.add(arr, noise)
    return Image.fromarray(noisy)


def _apply_blur(img: Image.Image) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(radius=random.uniform(0.5, 1.5)))


def _horizontal_flip(img: Image.Image) -> Image.Image:
    return img.transpose(Image.FLIP_LEFT_RIGHT)


_AUGMENTATIONS = [
    _random_rotate,
    _change_brightness,
    _add_noise,
    _apply_blur,
    _horizontal_flip,
]


def augment_student_photo(source_path: Path, output_dir: Path, base_name: str, count: int = 20) -> int:
    """Save original + augmented images for ML training."""
    output_dir.mkdir(parents=True, exist_ok=True)
    original = Image.open(source_path).convert("RGB")
    original.save(output_dir / f"{base_name}_original.jpg")

    for i in range(1, count + 1):
        img = original.copy()
        for func in random.sample(_AUGMENTATIONS, k=random.randint(1, 3)):
            img = func(img)
        img.save(output_dir / f"{base_name}_aug{i}.jpg")

    return count + 1
