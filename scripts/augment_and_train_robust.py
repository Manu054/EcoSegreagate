import sys
import random
from pathlib import Path

ROOT_DIR = Path("c:/ML_Project")
sys.path.insert(0, str(ROOT_DIR))

import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image, ImageEnhance
import json

rec_dir = ROOT_DIR / "dataset" / "recyclable"
org_dir = ROOT_DIR / "dataset" / "organic"

print(f"Current counts: organic={len(list(org_dir.glob('*.jpg')))}, recyclable={len(list(rec_dir.glob('*.jpg')))}")

# 1. Augment recyclable dataset with realistic variations (flips, rotations, brightness)
rec_files = list(rec_dir.glob("*.jpg"))
target_rec_count = 350

counter = 0
while len(list(rec_dir.glob("*.jpg"))) < target_rec_count:
    src_f = random.choice(rec_files)
    try:
        with Image.open(src_f) as img:
            im = img.convert("RGB")
            # Random augment
            if random.random() > 0.5:
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            if random.random() > 0.5:
                angle = random.choice([90, 180, 270, 15, -15])
                im = im.rotate(angle)
            if random.random() > 0.5:
                enhancer = ImageEnhance.Brightness(im)
                im = enhancer.enhance(random.uniform(0.85, 1.15))
            
            aug_name = f"aug_{counter:04d}_{src_f.name}"
            im.save(rec_dir / aug_name, quality=90)
            counter += 1
    except Exception as e:
        pass

print(f"Balanced counts: organic={len(list(org_dir.glob('*.jpg')))}, recyclable={len(list(rec_dir.glob('*.jpg')))}")

# 2. Train MobileNetV2 with balanced data
from ml.models import MODEL_BUILDERS
from ml.dataset.data_loader import create_stratified_loaders

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Training on device: {device}")

train_loader, val_loader, test_loader, class_names, class_weights, split_info = create_stratified_loaders(
    dataset_dir=ROOT_DIR / "dataset",
    batch_size=16,
    val_split=0.15,
    test_split=0.15,
    random_seed=42
)

print(f"Classes: {class_names}")
print(f"Class weights: {class_weights}")
print(f"Train samples: {split_info['train_samples']}, Val samples: {split_info['val_samples']}")

builder = MODEL_BUILDERS["mobilenet_v2"]
model = builder(num_classes=len(class_names), pretrained=True)
model = model.to(device)

criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=5e-4, weight_decay=1e-4)

epochs = 6
best_loss = float("inf")
best_acc = 0.0
best_state = None

for epoch in range(1, epochs + 1):
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

    print(f"Epoch {epoch}/{epochs} | Train Loss: {train_loss:.4f} Acc: {train_acc*100:.1f}% | Val Loss: {val_loss:.4f} Acc: {val_acc*100:.1f}%")

    if val_loss < best_loss or val_acc > best_acc:
        best_loss = min(best_loss, val_loss)
        best_acc = max(best_acc, val_acc)
        best_state = model.state_dict().copy()

# Save best model
save_dir = ROOT_DIR / "saved_models" / "mobilenet_v2"
save_dir.mkdir(parents=True, exist_ok=True)
torch.save({
    "model_state_dict": best_state if best_state is not None else model.state_dict(),
    "class_names": class_names,
    "best_val_accuracy": best_acc,
    "best_val_loss": best_loss
}, save_dir / "best_model.pth")

with open(save_dir / "model_metadata.json", "w", encoding="utf-8") as f:
    json.dump({
        "model_name": "mobilenet_v2",
        "display_name": "MobileNetV2",
        "architecture": "mobilenet_v2",
        "class_names": class_names,
        "num_classes": len(class_names),
        "best_val_accuracy": best_acc,
        "best_val_loss": best_loss,
        "epochs_trained": epochs
    }, f, indent=2)

print(f"\n[OK] Model saved with {best_acc*100:.1f}% validation accuracy!")

# 3. Thoroughly test key items
from torchvision import transforms
tf = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

eval_model = builder(num_classes=len(class_names), pretrained=False).to(device)
ckpt = torch.load(save_dir / "best_model.pth", map_location=device)
eval_model.load_state_dict(ckpt["model_state_dict"])
eval_model.eval()

tests = [
    ("plastic_bottle.jpg", "recyclable"),
    ("metal_can.jpg", "recyclable"),
    ("banana_peel.jpg", "organic"),
    ("food_waste.jpg", "organic"),
]

print("\n--- Final Verification on Real Public Images ---")
for fn, expected in tests:
    p = ROOT_DIR / "frontend" / "public" / "examples" / fn
    if p.exists():
        img = Image.open(p).convert("RGB")
        tensor = tf(img).unsqueeze(0).to(device)
        with torch.no_grad():
            out = eval_model(tensor)
            probs = torch.softmax(out, dim=1)[0]
            pred_idx = torch.argmax(probs).item()
            pred_class = class_names[pred_idx]
            conf = probs[pred_idx].item()
        
        status = "[PASS]" if pred_class == expected else "[FAIL]"
        print(f"  {fn:<20}: predicted={pred_class:<10} ({conf*100:5.1f}%) | expected={expected} {status}")
