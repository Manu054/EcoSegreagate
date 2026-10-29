import os
from pathlib import Path
from typing import Tuple, List, Dict, Optional
from PIL import Image
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

class WasteDataset(Dataset):
    def __init__(self, file_paths: List[Path], labels: List[int], transform=None):
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        path = self.file_paths[idx]
        try:
            with Image.open(path) as img:
                image = img.convert("RGB")
        except Exception:
            # Fallback for damaged read
            image = Image.new("RGB", (224, 224), color=(128, 128, 128))

        if self.transform:
            image = self.transform(image)

        label = self.labels[idx]
        return image, label

def get_transforms(image_size: int = 224):
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomResizedCrop(image_size, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=imagenet_mean, std=imagenet_std)
    ])

    return train_transform, val_test_transform

def discover_dataset_files(dataset_dir: Path) -> Tuple[List[Path], List[str], List[str]]:
    """
    Scans dataset folder for class folders and gathers all valid image paths and labels.
    Supports both flat class folders and Kaggle TRAIN/TEST subfolders.
    """
    dataset_path = Path(dataset_dir)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_path}")

    # Check for Kaggle-style TRAIN/TEST split folders
    subdirs = [d for d in dataset_path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    train_dir = next((d for d in subdirs if d.name.upper() in ["TRAIN", "DATASET-TRAIN"]), None)
    
    if train_dir:
        # Scan inside train_dir and also test_dir if available
        test_dir = next((d for d in subdirs if d.name.upper() in ["TEST", "DATASET-TEST"]), None)
        scan_roots = [train_dir]
        if test_dir:
            scan_roots.append(test_dir)
    else:
        scan_roots = [dataset_path]

    class_names_set = set()
    file_entries = []  # (Path, class_str)

    for root in scan_roots:
        class_folders = [d for d in root.iterdir() if d.is_dir() and not d.name.startswith(".")]
        for cdir in class_folders:
            cname = cdir.name.lower()
            if cname == 'o':
                cname = 'organic'
            elif cname == 'r':
                cname = 'recyclable'
            class_names_set.add(cname)

            for f in cdir.glob("**/*"):
                if f.suffix.lower() in SUPPORTED_EXTENSIONS:
                    file_entries.append((f, cname))

    class_names = sorted(list(class_names_set))
    class_to_idx = {name: idx for idx, name in enumerate(class_names)}

    paths = [entry[0] for entry in file_entries]
    labels = [class_to_idx[entry[1]] for entry in file_entries]

    return paths, labels, class_names

def create_stratified_loaders(
    dataset_dir: str or Path,
    batch_size: int = 32,
    val_split: float = 0.15,
    test_split: float = 0.15,
    random_seed: int = 42,
    image_size: int = 224,
    num_workers: int = 0
):
    """
    Creates stratified Train, Validation, and Test PyTorch DataLoaders
    with strict isolation to prevent data leakage.
    """
    paths, labels, class_names = discover_dataset_files(Path(dataset_dir))

    if len(paths) == 0:
        raise ValueError(f"No valid images found in dataset directory: {dataset_dir}")

    total_samples = len(paths)
    indices = np.arange(total_samples)
    y = np.array(labels)

    # First split off test set
    test_size_actual = int(total_samples * test_split)
    train_val_idx, test_idx, train_val_y, test_y = train_test_split(
        indices, y,
        test_size=test_size_actual,
        stratify=y,
        random_state=random_seed
    )

    # Next split train into train and val
    val_size_actual = int(total_samples * val_split)
    val_ratio_of_remaining = val_size_actual / len(train_val_idx)
    train_idx, val_idx, train_y, val_y = train_test_split(
        train_val_idx, train_val_y,
        test_size=val_ratio_of_remaining,
        stratify=train_val_y,
        random_state=random_seed
    )

    train_paths = [paths[i] for i in train_idx]
    train_labels = [labels[i] for i in train_idx]

    val_paths = [paths[i] for i in val_idx]
    val_labels = [labels[i] for i in val_idx]

    test_paths = [paths[i] for i in test_idx]
    test_labels = [labels[i] for i in test_idx]

    # Calculate class weights for loss function
    unique_classes = np.unique(train_labels)
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=unique_classes,
        y=train_labels
    )
    class_weights_tensor = torch.tensor(class_weights, dtype=torch.float)

    train_tf, val_test_tf = get_transforms(image_size)

    train_dataset = WasteDataset(train_paths, train_labels, transform=train_tf)
    val_dataset = WasteDataset(val_paths, val_labels, transform=val_test_tf)
    test_dataset = WasteDataset(test_paths, test_labels, transform=val_test_tf)

    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True,
        num_workers=num_workers, pin_memory=torch.cuda.is_available()
    )
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=torch.cuda.is_available()
    )
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=torch.cuda.is_available()
    )

    split_info = {
        "total_samples": total_samples,
        "train_samples": len(train_dataset),
        "val_samples": len(val_dataset),
        "test_samples": len(test_dataset),
        "class_names": class_names,
        "num_classes": len(class_names),
        "class_weights": class_weights.tolist()
    }

    return train_loader, val_loader, test_loader, class_names, class_weights_tensor, split_info
