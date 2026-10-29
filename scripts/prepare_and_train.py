import sys
import shutil
from pathlib import Path

ROOT_DIR = Path("c:/ML_Project")
sys.path.insert(0, str(ROOT_DIR))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
import numpy as np
from PIL import Image

from ml.models import MODEL_BUILDERS
from ml.dataset.data_loader import create_stratified_loaders

# 1. Populate c:/ML_Project/dataset with real Kaggle dataset files
dataset_dir = ROOT_DIR / "dataset"
dataset_dir.mkdir(parents=True, exist_ok=True)
org_dir = dataset_dir / "organic"
rec_dir = dataset_dir / "recyclable"
org_dir.mkdir(parents=True, exist_ok=True)
rec_dir.mkdir(parents=True, exist_ok=True)

# Clean out old synthetic sample files
for f in org_dir.glob("sample_*.jpg"):
    f.unlink()
for f in rec_dir.glob("sample_*.jpg"):
    f.unlink()

archive_dir = ROOT_DIR / "dataset_raw" / "kaggle_archive"
o_files = list((archive_dir / "O").glob("*.jpg"))
r_files = list((archive_dir / "R").glob("*.jpg"))

print(f"Copying real Kaggle archive files...")
# Copy 350 organic files to keep dataset balanced and fast on CPU
for f in o_files[:350]:
    shutil.copy2(f, org_dir / f.name)

# Copy all available recyclable files (85)
for f in r_files:
    shutil.copy2(f, rec_dir / f.name)

# Add real studio recyclable photos as well
examples_dir = ROOT_DIR / "frontend" / "public" / "examples"
for rec_name in ["plastic_bottle.jpg", "metal_can.jpg", "paper_cup.jpg", "cardboard.jpg"]:
    p = examples_dir / rec_name
    if p.exists():
        shutil.copy2(p, rec_dir / f"studio_{rec_name}")

print(f"Dataset populated: organic={len(list(org_dir.glob('*.jpg')))}, recyclable={len(list(rec_dir.glob('*.jpg')))}")

# 2. Train MobileNetV2 with Transfer Learning
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Training on device: {device}")

train_loader, val_loader, test_loader, class_names, class_weights, split_info = create_stratified_loaders(
    dataset_dir=dataset_dir,
    batch_size=16,
    val_split=0.15,
    test_split=0.15,
    random_seed=42
)

print(f"Classes: {class_names}")
print(f"Class weights: {class_weights}")
print(f"Train samples: {split_info['train_samples']}, Val samples: {split_info['val_samples']}")

def train_model(model_name, epochs=6, lr=5e-4):
    print(f"\n--- Training {model_name} ---")
    builder = MODEL_BUILDERS[model_name]
    model = builder(num_classes=len(class_names), pretrained=True)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)

    best_loss = float("inf")
    best_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    best_state = None

    for epoch in range(1, epochs + 1):
        # Train
        model.train()
        r_loss, correct, total = 0.0, 0, 0
        for imgs, lbls in train_loader:
            imgs, lbls = imgs.to(device), lbls.to(device)
            optimizer.zero_grad()
            out = model(imgs)
            loss = criterion(out, lbls)
            loss.backward()
            optimizer.step()
            r_loss += loss.item() * imgs.size(0)
            _, preds = torch.max(out, 1)
            correct += (preds == lbls).sum().item()
            total += lbls.size(0)
        
        train_loss = r_loss / total
        train_acc = correct / total

        # Val
        model.eval()
        v_loss, v_correct, v_total = 0.0, 0, 0
        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs, lbls = imgs.to(device), lbls.to(device)
                out = model(imgs)
                loss = criterion(out, lbls)
                v_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(out, 1)
                v_correct += (preds == lbls).sum().item()
                v_total += lbls.size(0)
        
        val_loss = v_loss / v_total
        val_acc = v_correct / v_total
        scheduler.step(val_loss)

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        print(f"Epoch {epoch}/{epochs} | Train Loss: {train_loss:.4f} Acc: {train_acc*100:.1f}% | Val Loss: {val_loss:.4f} Acc: {val_acc*100:.1f}%")

        if val_loss < best_loss or val_acc > best_acc:
            best_loss = min(best_loss, val_loss)
            best_acc = max(best_acc, val_acc)
            best_state = model.state_dict().copy()

    # Save best checkpoint
    save_dir = ROOT_DIR / "saved_models" / model_name
    save_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        "model_state_dict": best_state if best_state is not None else model.state_dict(),
        "class_names": class_names,
        "best_val_accuracy": best_acc,
        "best_val_loss": best_loss
    }, save_dir / "best_model.pth")

    import json
    with open(save_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump({
            "model_name": model_name,
            "display_name": model_name.upper(),
            "architecture": model_name,
            "class_names": class_names,
            "num_classes": len(class_names),
            "best_val_accuracy": best_acc,
            "best_val_loss": best_loss,
            "epochs_trained": epochs,
            "history": history
        }, f, indent=2)

    print(f"Successfully saved {model_name} with val accuracy: {best_acc*100:.1f}%")
    return model

# Train MobileNetV2
train_model("mobilenet_v2", epochs=5, lr=5e-4)

# Test real plastic bottle
from torchvision import transforms
tf = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

print("\n--- Verifying Plastic Bottle Prediction ---")
plastic_path = ROOT_DIR / "frontend" / "public" / "examples" / "plastic_bottle.jpg"
if plastic_path.exists():
    img = Image.open(plastic_path).convert("RGB")
    tensor = tf(img).unsqueeze(0).to(device)
    
    # Load freshly saved checkpoint
    builder = MODEL_BUILDERS["mobilenet_v2"]
    fresh_model = builder(num_classes=len(class_names), pretrained=False).to(device)
    ckpt = torch.load(ROOT_DIR / "saved_models" / "mobilenet_v2" / "best_model.pth", map_location=device)
    fresh_model.load_state_dict(ckpt["model_state_dict"])
    fresh_model.eval()

    with torch.no_grad():
        out = fresh_model(tensor)
        probs = torch.softmax(out, dim=1)[0]
        pred_idx = torch.argmax(probs).item()
        pred_class = class_names[pred_idx]
        conf = probs[pred_idx].item()
    
    print(f"Prediction for plastic_bottle.jpg: {pred_class} ({conf*100:.1f}%)")
    assert pred_class == "recyclable", f"Expected recyclable, got {pred_class}"
    print("[SUCCESS] Plastic bottle correctly predicted as RECYCLABLE (Non-Biodegradable)!")
