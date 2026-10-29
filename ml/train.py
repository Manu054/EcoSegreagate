import os
import sys
import time
import json
import argparse
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
import matplotlib.pyplot as plt

# Ensure ml is in path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.models import MODEL_BUILDERS, MODEL_DISPLAY_NAMES
from ml.dataset.data_loader import create_stratified_loaders
from ml.dataset.dataset_manager import check_dataset_present, create_sample_demonstration_dataset

def count_parameters(model: nn.Module):
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total_params, trainable_params

def train_single_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc

def evaluate_loader(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total
    return epoch_loss, epoch_acc

def plot_and_save_curves(history, output_path: Path, model_name: str):
    epochs_range = range(1, len(history["train_loss"]) + 1)
    
    plt.figure(figsize=(12, 5))
    
    # Loss subplot
    plt.subplot(1, 2, 1)
    plt.plot(epochs_range, history["train_loss"], 'b-o', label='Training Loss')
    plt.plot(epochs_range, history["val_loss"], 'r-s', label='Validation Loss')
    plt.title(f'{model_name} - Loss History')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend()

    # Accuracy subplot
    plt.subplot(1, 2, 2)
    plt.plot(epochs_range, [acc * 100 for acc in history["train_acc"]], 'b-o', label='Training Acc')
    plt.plot(epochs_range, [acc * 100 for acc in history["val_acc"]], 'r-s', label='Validation Acc')
    plt.title(f'{model_name} - Accuracy (%)')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy (%)')
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.legend()

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()

def train_model(
    model_name: str,
    dataset_dir: Path,
    output_dir: Path,
    epochs: int = 10,
    batch_size: int = 16,
    lr: float = 1e-3,
    patience: int = 4
):
    print("\n" + "=" * 60)
    display_name = MODEL_DISPLAY_NAMES.get(model_name, model_name)
    print(f"STARTING TRAINING PIPELINE: {display_name}")
    print("=" * 60)

    # Device configuration
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Compute Target: {device}")
    if device.type == "cuda":
        print(f"[*] GPU Name      : {torch.cuda.get_device_name(0)}")

    # Load data
    train_loader, val_loader, test_loader, class_names, class_weights, split_info = create_stratified_loaders(
        dataset_dir=dataset_dir,
        batch_size=batch_size,
        val_split=0.15,
        test_split=0.15,
        random_seed=42
    )

    print(f"[*] Dataset Classes: {class_names} ({len(class_names)} classes)")
    print(f"[*] Train Samples  : {split_info['train_samples']}")
    print(f"[*] Val Samples    : {split_info['val_samples']}")
    print(f"[*] Test Samples   : {split_info['test_samples']}")

    # Build model architecture
    builder = MODEL_BUILDERS[model_name]
    model = builder(num_classes=len(class_names), pretrained=True)
    model = model.to(device)

    total_params, trainable_params = count_parameters(model)
    print(f"[*] Total Parameters    : {total_params:,}")
    print(f"[*] Trainable Parameters: {trainable_params:,}")

    # Loss with class imbalance handling
    criterion = nn.CrossEntropyLoss(weight=class_weights.to(device))
    optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=lr, weight_decay=1e-4)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2, verbose=True)

    history = {
        "train_loss": [], "train_acc": [],
        "val_loss": [], "val_acc": []
    }

    best_val_loss = float("inf")
    best_val_acc = 0.0
    patience_counter = 0

    model_save_dir = output_dir / model_name
    model_save_dir.mkdir(parents=True, exist_ok=True)
    best_model_path = model_save_dir / "best_model.pth"

    start_time = time.time()

    for epoch in range(1, epochs + 1):
        epoch_start = time.time()
        
        train_loss, train_acc = train_single_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate_loader(model, val_loader, criterion, device)
        scheduler.step(val_loss)

        epoch_duration = time.time() - epoch_start

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        print(f"Epoch [{epoch:02d}/{epochs:02d}] ({epoch_duration:.1f}s) - "
              f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:5.2f}% | "
              f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc*100:5.2f}%")

        # Save checkpoint on validation improvement
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_val_acc = val_acc
            patience_counter = 0
            
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": val_loss,
                "val_acc": val_acc,
                "class_names": class_names,
                "model_name": model_name
            }, best_model_path)
            print(f"  --> Checkpoint saved: {best_model_path.name} (Val Loss improved to {val_loss:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= patience:
                print(f"[!] Early stopping triggered after {patience} epochs with no validation loss improvement.")
                break

    total_training_time = time.time() - start_time
    print(f"\n[OK] Training Complete in {total_training_time:.2f} seconds.")
    print(f"[OK] Best Validation Accuracy: {best_val_acc * 100:.2f}% | Best Val Loss: {best_val_loss:.4f}")

    # Calculate model size on disk
    model_size_mb = best_model_path.stat().st_size / (1024 * 1024) if best_model_path.exists() else 0.0

    # Save training curves plot
    plot_path = ROOT_DIR / "evaluation_results" / "plots" / f"training_curves_{model_name}.png"
    plot_and_save_curves(history, plot_path, display_name)

    # Save model metadata
    metadata = {
        "model_name": model_name,
        "display_name": display_name,
        "architecture": model_name,
        "class_names": class_names,
        "num_classes": len(class_names),
        "total_parameters": total_params,
        "trainable_parameters": trainable_params,
        "best_val_accuracy": round(best_val_acc, 4),
        "best_val_loss": round(best_val_loss, 4),
        "model_size_mb": round(model_size_mb, 2),
        "training_time_sec": round(total_training_time, 2),
        "epochs_trained": len(history["train_loss"]),
        "history": history,
        "input_resolution": "224x224",
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    with open(model_save_dir / "model_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata

def main():
    parser = argparse.ArgumentParser(description="Train Waste Segregation Image Classifiers")
    parser.add_argument("--model", type=str, default="all", choices=["mobilenet_v2", "resnet50", "efficientnet_b0", "all"])
    parser.add_argument("--dataset_dir", type=str, default="c:/ML_Project/dataset")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--patience", type=int, default=3)
    args = parser.parse_args()

    dataset_path = Path(args.dataset_dir)
    output_dir = ROOT_DIR / "saved_models"

    if not check_dataset_present(dataset_path):
        print("[!] No dataset detected in dataset folder.")
        print("[*] Generating demonstration dataset so training can be verified immediately...")
        create_sample_demonstration_dataset(dataset_path, samples_per_class=35)

    models_to_train = ["mobilenet_v2", "resnet50", "efficientnet_b0"] if args.model == "all" else [args.model]

    results = {}
    for m in models_to_train:
        results[m] = train_model(
            model_name=m,
            dataset_dir=dataset_path,
            output_dir=output_dir,
            epochs=args.epochs,
            batch_size=args.batch_size,
            lr=args.lr,
            patience=args.patience
        )

    print("\n" + "=" * 60)
    print("ALL REQUESTED MODELS TRAINED SUCCESSFULLY")
    print("=" * 60)
    for m, meta in results.items():
        print(f" - {meta['display_name'].ljust(16)}: Best Val Acc = {meta['best_val_accuracy']*100:5.2f}% | Size = {meta['model_size_mb']} MB")

if __name__ == "__main__":
    main()
