import shutil
from pathlib import Path
from PIL import Image

archive_dir = Path("c:/ML_Project/dataset_raw/kaggle_archive")
dest_dir = Path("c:/ML_Project/frontend/public/dataset_samples")
dest_dir.mkdir(parents=True, exist_ok=True)

o_files = list((archive_dir / "O").glob("*.jpg"))
r_files = list((archive_dir / "R").glob("*.jpg"))

print(f"Total O: {len(o_files)}, Total R: {len(r_files)}")

# Copy 3 diverse organic samples
for i, f in enumerate(o_files[:3]):
    dest = dest_dir / f"organic_{i+1}.jpg"
    shutil.copy2(f, dest)
    print(f"Copied {f.name} -> {dest}")

# Copy 3 diverse recyclable samples
for i, f in enumerate(r_files[:3]):
    dest = dest_dir / f"recyclable_{i+1}.jpg"
    shutil.copy2(f, dest)
    print(f"Copied {f.name} -> {dest}")

print("Dataset samples ready in frontend/public/dataset_samples/")
