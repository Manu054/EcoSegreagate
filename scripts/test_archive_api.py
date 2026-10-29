import json
import subprocess
from pathlib import Path

archive_dir = Path('c:/ML_Project/dataset_raw/kaggle_archive')

for label in ['O', 'R']:
    samples = list((archive_dir / label).glob('*.jpg'))[:4]
    gt = "Biodegradable" if label == "O" else "Non-Biodegradable"
    print(f"\n=== Testing {label} (Ground Truth: {gt}) ===")
    for s in samples:
        cmd = ['curl', '-s', '-X', 'POST', 'http://127.0.0.1:8000/api/predict', '-F', f'file=@{s}', '-F', 'model_name=mobilenet_v2']
        res = subprocess.run(cmd, capture_output=True, text=True)
        try:
            data = json.loads(res.stdout)
            pred = data.get("predicted_class")
            conf = data.get("confidence", 0) * 100
            cat = data.get("segregation_category")
            bin_name = data.get("bin_assigned")
            match = "[MATCH]" if cat == gt else "[MISMATCH]"
            print(f"  {s.name}: pred={pred:<10} ({conf:5.1f}%) -> {cat:<17} {match} (bin: {bin_name})")
        except Exception as e:
            print(f"  {s.name}: failed to parse -> {res.stdout[:100]}")
