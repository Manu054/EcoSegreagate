import os
import sys
from pathlib import Path
from PIL import Image
from collections import Counter
import json

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def validate_dataset(dataset_dir: str or Path) -> dict:
    dataset_path = Path(dataset_dir)
    print(f"[*] Validating dataset at: {dataset_path.resolve()}")
    
    if not dataset_path.exists():
        print(f"[!] Dataset path does not exist: {dataset_path}")
        return {"valid": False, "error": f"Path not found: {dataset_path}"}
        
    class_dirs = [d for d in dataset_path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    
    # Check for nested train/test structure (e.g. Kaggle DATASET/TRAIN, DATASET/TEST)
    if any(d.name.upper() in ["TRAIN", "TEST", "DATASET-TRAIN"] for d in class_dirs):
        print("[*] Detected split-level directory structure. Scanning subfolders...")
        train_dir = next((d for d in class_dirs if d.name.upper() in ["TRAIN", "DATASET-TRAIN"]), None)
        if train_dir:
            class_dirs = [d for d in train_dir.iterdir() if d.is_dir() and not d.name.startswith(".")]

    if not class_dirs:
        print("[!] No class subdirectories found in dataset path.")
        return {"valid": False, "error": "No class subdirectories found."}

    class_distribution = Counter()
    corrupted_images = []
    dimensions = []
    total_scanned = 0

    print(f"[*] Found {len(class_dirs)} class candidates: {[c.name for c in class_dirs]}")

    for cdir in class_dirs:
        class_name = cdir.name.lower()
        # Map 'o' -> 'organic', 'r' -> 'recyclable' if using Kaggle short notation
        if class_name == 'o':
            class_name = 'organic'
        elif class_name == 'r':
            class_name = 'recyclable'

        image_files = [f for f in cdir.glob("**/*") if f.suffix.lower() in SUPPORTED_EXTENSIONS]
        for img_path in image_files:
            total_scanned += 1
            try:
                with Image.open(img_path) as img:
                    img.verify()  # Verify image integrity
                with Image.open(img_path) as img:
                    dimensions.append(img.size)
                class_distribution[class_name] += 1
            except Exception as e:
                corrupted_images.append(str(img_path))

    report = {
        "valid": len(class_distribution) >= 2 and total_scanned > 0,
        "total_images": total_scanned,
        "valid_images": sum(class_distribution.values()),
        "corrupted_images_count": len(corrupted_images),
        "corrupted_files": corrupted_images[:10],
        "class_counts": dict(class_distribution),
        "detected_classes": list(class_distribution.keys()),
        "num_classes": len(class_distribution)
    }

    if dimensions:
        avg_w = sum(d[0] for d in dimensions) / len(dimensions)
        avg_h = sum(d[1] for d in dimensions) / len(dimensions)
        report["average_resolution"] = f"{int(avg_w)}x{int(avg_h)}"

    print("\n" + "=" * 50)
    print("DATASET VALIDATION SUMMARY REPORT")
    print("=" * 50)
    print(f"Total Images Scanned : {report['total_images']}")
    print(f"Valid Images         : {report['valid_images']}")
    print(f"Corrupted Images     : {report['corrupted_images_count']}")
    print(f"Detected Classes     : {', '.join(report['detected_classes'])}")
    print("Class Distribution   :")
    for cls, count in report["class_counts"].items():
        pct = (count / report['valid_images'] * 100) if report['valid_images'] > 0 else 0
        print(f"  - {cls.ljust(15)}: {count:5d} ({pct:5.1f}%)")
    print("=" * 50 + "\n")

    return report

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "c:/ML_Project/dataset"
    validate_dataset(target)
