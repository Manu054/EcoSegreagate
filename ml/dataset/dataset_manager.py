"""
Dataset Manager and Downloader Instructions Module
--------------------------------------------------
Manages detection, instructions, and demonstration sample synthesis for waste classification.
Primary Candidate Dataset: Kaggle Waste Classification Data (techsash/waste-classification-data)
Alternative Multi-Class: Garbage Classification (asdasdasasdas/garbage-classification)
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import random
import numpy as np

DATASET_INSTRUCTIONS = """
========================================================================================
HOW TO SETUP THE KAGGLE WASTE CLASSIFICATION DATASET
========================================================================================
1. Download from Kaggle:
   URL: https://www.kaggle.com/datasets/techsash/waste-classification-data
   Or use the Kaggle CLI:
   kaggle datasets download -d techsash/waste-classification-data

2. Unpack the downloaded zip file into the dataset directory:
   Destination: c:\\ML_Project\\dataset\\

3. Expected directory structure:
   c:\\ML_Project\\dataset\\
   ├── TRAIN/
   │   ├── O/   (Organic / Biodegradable images)
   │   └── R/   (Recyclable / Non-Biodegradable images)
   └── TEST/
       ├── O/
       └── R/

   Alternatively, for multi-class classification:
   c:\\ML_Project\\dataset\\
   ├── cardboard/
   ├── glass/
   ├── metal/
   ├── paper/
   ├── plastic/
   ├── trash/
   └── organic/
========================================================================================
"""

def print_dataset_instructions():
    print(DATASET_INSTRUCTIONS)

def check_dataset_present(dataset_path: Path) -> bool:
    if not dataset_path.exists():
        return False
    images = list(dataset_path.glob("**/*.jpg")) + list(dataset_path.glob("**/*.png"))
    return len(images) > 0

def create_sample_demonstration_dataset(dataset_path: Path, samples_per_class: int = 40):
    """
    Creates clean demonstration samples with distinctive color and structural textures
    so the full end-to-end training, checkpointing, and evaluation pipeline can be validated
    and tested completely before downloading the full multi-gigabyte Kaggle dataset.
    """
    print(f"[*] Initializing demonstration verification dataset at: {dataset_path}...")
    dataset_path.mkdir(parents=True, exist_ok=True)
    
    classes = ["organic", "recyclable"]
    for cls in classes:
        cls_dir = dataset_path / cls
        cls_dir.mkdir(parents=True, exist_ok=True)
        
        # Check if already has samples
        existing = list(cls_dir.glob("*.jpg"))
        if len(existing) >= samples_per_class:
            continue

        for i in range(samples_per_class):
            img = Image.new("RGB", (224, 224))
            draw = ImageDraw.Draw(img)
            
            if cls == "organic":
                # Organic: earthy greens, browns, leafy and textured fruit shapes
                base_color = (random.randint(30, 90), random.randint(100, 180), random.randint(30, 80))
                draw.rectangle([0, 0, 224, 224], fill=base_color)
                for _ in range(8):
                    x1 = random.randint(10, 160)
                    y1 = random.randint(10, 160)
                    x2 = x1 + random.randint(20, 60)
                    y2 = y1 + random.randint(20, 60)
                    leaf_col = (random.randint(60, 140), random.randint(140, 220), random.randint(40, 100))
                    draw.ellipse([x1, y1, x2, y2], fill=leaf_col)
            else:
                # Recyclable: metallic cyans, blues, silvers, geometric bottle/can forms
                base_color = (random.randint(160, 210), random.randint(180, 220), random.randint(210, 250))
                draw.rectangle([0, 0, 224, 224], fill=base_color)
                for _ in range(6):
                    x1 = random.randint(20, 150)
                    y1 = random.randint(20, 150)
                    x2 = x1 + random.randint(30, 70)
                    y2 = y1 + random.randint(40, 80)
                    poly_col = (random.randint(30, 80), random.randint(80, 150), random.randint(180, 240))
                    draw.rectangle([x1, y1, x2, y2], fill=poly_col, outline=(255, 255, 255))

            # Apply slight blur for realistic camera noise
            img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
            filename = f"sample_{cls}_{i:03d}.jpg"
            img.save(cls_dir / filename, "JPEG", quality=90)

    print(f"[OK] Demonstration dataset generated ({samples_per_class} samples/class).")

if __name__ == "__main__":
    import sys
    target_dir = Path("c:/ML_Project/dataset")
    if len(sys.argv) > 1 and sys.argv[1] == "--demo":
        create_sample_demonstration_dataset(target_dir)
    else:
        print_dataset_instructions()
