import sys
from pathlib import Path

ROOT_DIR = Path("c:/ML_Project")
sys.path.insert(0, str(ROOT_DIR))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
import json
from PIL import Image

from ml.models import MODEL_BUILDERS
from ml.dataset.data_loader import create_stratified_loaders

dataset_dir = ROOT_DIR / "dataset"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Training ensemble backbones on: {device}")

train_loader, val_loader, test_loader, class_names, class_weights, split_info = create_stratified_loaders(
    dataset_dir=dataset_dir,
    batch_size=16,
    val_split=0.15,
    test_split=0.15,
    random_seed=42
)

def train_backbone(model_name, epochs=4, lr=4e-4):
    print(f"\n--- Training {model_name} on real dataset ---")
    builder = MODEL_BUILDERS[model_name]
    model = builder(num_classes=len(class_names), pretrained=True)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)

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

    save_dir = ROOT_DIR / "saved_models" / model_name
    save_dir.mkdir(parents=True, exist_ok=True)
    torch.save({
        "model_state_dict": best_state if best_state is not None else model.state_dict(),
        "class_names": class_names,
        "best_val_accuracy": best_acc,
        "best_val_loss": best_loss
    }, save_dir / "best_model.pth")

    with open(save_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump({
            "model_name": model_name,
            "display_name": model_name.upper(),
            "architecture": model_name,
            "class_names": class_names,
            "num_classes": len(class_names),
            "best_val_accuracy": best_acc,
            "best_val_loss": best_loss,
            "epochs_trained": epochs
        }, f, indent=2)

    print(f"Saved {model_name} with best val accuracy: {best_acc*100:.1f}%")

train_backbone("resnet50", epochs=4, lr=3e-4)
train_backbone("efficientnet_b0", epochs=4, lr=4e-4)
print("\nAll ensemble models successfully updated with real Kaggle dataset weights!")
