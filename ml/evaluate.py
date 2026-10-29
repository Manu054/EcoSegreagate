import os
import sys
import time
import json
import platform
import psutil
from pathlib import Path
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, precision_recall_curve, auc,
    classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.models import MODEL_BUILDERS, MODEL_DISPLAY_NAMES
from ml.dataset.data_loader import create_stratified_loaders

def get_system_hardware_details():
    try:
        cpu_name = platform.processor() or "x86_64 Compatible"
    except Exception:
        cpu_name = "Standard CPU"
        
    ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)
    os_name = f"{platform.system()} {platform.release()}"
    gpu_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None (CPU Inference)"

    return {
        "os": os_name,
        "cpu": cpu_name,
        "ram_gb": ram_gb,
        "gpu": gpu_name,
        "pytorch_version": torch.__version__
    }

def measure_inference_latency(model, sample_tensor, device, num_warmup: int = 10, num_runs: int = 50):
    model.eval()
    sample_tensor = sample_tensor.to(device)

    # Warm-up runs
    with torch.no_grad():
        for _ in range(num_warmup):
            _ = model(sample_tensor)

    if device.type == "cuda":
        torch.cuda.synchronize()

    start = time.perf_counter()
    with torch.no_grad():
        for _ in range(num_runs):
            _ = model(sample_tensor)
            if device.type == "cuda":
                torch.cuda.synchronize()
    end = time.perf_counter()

    avg_latency_ms = ((end - start) / num_runs) * 1000.0
    return round(avg_latency_ms, 2)

def compute_multiclass_specificity(cm: np.ndarray):
    """
    Computes per-class specificity and macro average using One-vs-Rest strategy:
    TN / (TN + FP)
    """
    num_classes = cm.shape[0]
    specificities = []
    total_samples = np.sum(cm)

    for i in range(num_classes):
        tp = cm[i, i]
        fp = np.sum(cm[:, i]) - tp
        fn = np.sum(cm[i, :]) - tp
        tn = total_samples - (tp + fp + fn)
        denom = tn + fp
        spec = (tn / denom) if denom > 0 else 0.0
        specificities.append(spec)

    macro_spec = np.mean(specificities)
    return specificities, macro_spec

def plot_confusion_matrix_heatmap(cm: np.ndarray, class_names: list, output_path: Path, model_display_name: str):
    plt.figure(figsize=(7, 6))
    sns.heatmap(
        cm, annot=True, fmt='d', cmap='Greens',
        xticklabels=class_names, yticklabels=class_names,
        cbar=True, annot_kws={"size": 12}
    )
    plt.title(f'{model_display_name} - Confusion Matrix (Test Set)', fontsize=13, fontweight='bold', pad=12)
    plt.xlabel('Predicted Label', fontsize=11, fontweight='medium')
    plt.ylabel('Ground Truth Label', fontsize=11, fontweight='medium')
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_comparison_bar_chart(df: pd.DataFrame, output_path: Path):
    plt.figure(figsize=(10, 6))
    metrics_to_plot = ["Accuracy", "Macro Precision", "Macro Recall", "Macro F1", "Weighted F1"]
    
    # Melt dataframe for seaborn barplot
    melted = df.melt(id_vars=["Model"], value_vars=metrics_to_plot, var_name="Metric", value_name="Score")
    
    sns.barplot(data=melted, x="Metric", y="Score", hue="Model", palette="crest")
    plt.title("Comparative Performance Across CNN Architectures", fontsize=14, fontweight='bold', pad=14)
    plt.ylim(0, 1.05)
    plt.ylabel("Score (0.0 to 1.0)", fontsize=11)
    plt.xlabel("Evaluation Metric", fontsize=11)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.legend(title="Architecture", frameon=True)
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()

def plot_latency_vs_f1(df: pd.DataFrame, output_path: Path):
    plt.figure(figsize=(8, 5))
    
    for _, row in df.iterrows():
        plt.scatter(row["Inference Latency (ms)"], row["Macro F1"], s=row["Model Size (MB)"] * 8, alpha=0.7, edgecolors="black", linewidth=1.5)
        plt.annotate(
            f"{row['Model']}\n({row['Model Size (MB)']} MB)",
            (row["Inference Latency (ms)"], row["Macro F1"]),
            textcoords="offset points",
            xytext=(10, 5),
            fontsize=10,
            fontweight='bold'
        )

    plt.title("Latency vs Macro F1 Trade-off (Bubble Size = Model Size MB)", fontsize=13, fontweight='bold', pad=12)
    plt.xlabel("Inference Latency per Image (ms) - Lower is Faster", fontsize=11)
    plt.ylabel("Macro F1-Score - Higher is Better", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.6)
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=300)
    plt.close()

def evaluate_model(
    model_name: str,
    test_loader,
    class_names: list,
    device,
    saved_models_dir: Path,
    hardware_info: dict
):
    display_name = MODEL_DISPLAY_NAMES.get(model_name, model_name)
    model_dir = saved_models_dir / model_name
    checkpoint_path = model_dir / "best_model.pth"
    meta_path = model_dir / "model_metadata.json"

    if not checkpoint_path.exists():
        print(f"[!] Warning: No checkpoint found for {model_name} at {checkpoint_path}")
        return None

    # Load metadata
    metadata = {}
    if meta_path.exists():
        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)

    # Initialize architecture
    builder = MODEL_BUILDERS[model_name]
    model = builder(num_classes=len(class_names), pretrained=False)
    
    # Load checkpoint weights
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(device)
    model.eval()

    all_preds = []
    all_targets = []
    all_probs = []

    softmax = nn.Softmax(dim=1)

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = softmax(outputs).cpu().numpy()
            preds = np.argmax(probs, axis=1)

            all_preds.extend(preds)
            all_targets.extend(labels.numpy())
            all_probs.extend(probs)

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)
    all_probs = np.array(all_probs)

    # 1. Accuracy
    acc = accuracy_score(all_targets, all_preds)

    # 2-4. Macro Metrics
    macro_prec = precision_score(all_targets, all_preds, average='macro', zero_division=0)
    macro_rec = recall_score(all_targets, all_preds, average='macro', zero_division=0)
    macro_f1 = f1_score(all_targets, all_preds, average='macro', zero_division=0)

    # 5-7. Weighted Metrics
    weighted_prec = precision_score(all_targets, all_preds, average='weighted', zero_division=0)
    weighted_rec = recall_score(all_targets, all_preds, average='weighted', zero_division=0)
    weighted_f1 = f1_score(all_targets, all_preds, average='weighted', zero_division=0)

    # 8. Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds)

    # 9. Specificity
    per_class_spec, macro_spec = compute_multiclass_specificity(cm)

    # 10. Per-Class Metrics
    per_class_prec = precision_score(all_targets, all_preds, average=None, zero_division=0)
    per_class_rec = recall_score(all_targets, all_preds, average=None, zero_division=0)
    per_class_f1 = f1_score(all_targets, all_preds, average=None, zero_division=0)

    per_class_dict = {}
    for i, cls in enumerate(class_names):
        per_class_dict[cls] = {
            "precision": round(float(per_class_prec[i]), 4),
            "recall": round(float(per_class_rec[i]), 4),
            "f1_score": round(float(per_class_f1[i]), 4),
            "specificity": round(float(per_class_spec[i]), 4),
            "support": int(np.sum(all_targets == i))
        }

    # 11. ROC-AUC and PR-AUC
    try:
        if len(class_names) == 2:
            roc_auc = float(roc_auc_score(all_targets, all_probs[:, 1]))
            prec_curve, rec_curve, _ = precision_recall_curve(all_targets, all_probs[:, 1])
            pr_auc = float(auc(rec_curve, prec_curve))
        else:
            roc_auc = float(roc_auc_score(all_targets, all_probs, multi_class='ovr', average='macro'))
            pr_auc = None
    except Exception:
        roc_auc = None
        pr_auc = None

    # 12. Inference Latency
    sample_tensor = torch.randn(1, 3, 224, 224)
    latency_ms = measure_inference_latency(model, sample_tensor, device)

    # 13. Parameter Count & File Size
    total_params = sum(p.numel() for p in model.parameters())
    file_size_mb = checkpoint_path.stat().st_size / (1024 * 1024)

    # 14. Peak Memory
    proc = psutil.Process(os.getpid())
    peak_mem_mb = round(proc.memory_info().rss / (1024 * 1024), 1)

    # Save Confusion Matrix Heatmap
    cm_path = ROOT_DIR / "evaluation_results" / "plots" / f"confusion_matrix_{model_name}.png"
    plot_confusion_matrix_heatmap(cm, class_names, cm_path, display_name)

    # Save Classification Report
    cr_text = classification_report(all_targets, all_preds, target_names=class_names, digits=4, zero_division=0)
    cr_path = ROOT_DIR / "evaluation_results" / "reports" / f"classification_report_{model_name}.txt"
    cr_path.parent.mkdir(parents=True, exist_ok=True)
    with open(cr_path, "w", encoding="utf-8") as f:
        f.write(f"CLASSIFICATION REPORT: {display_name}\n")
        f.write("=" * 60 + "\n\n")
        f.write(cr_text)

    metrics_result = {
        "model_name": model_name,
        "display_name": display_name,
        "status": "evaluated",
        "accuracy": round(float(acc), 4),
        "macro_precision": round(float(macro_prec), 4),
        "macro_recall": round(float(macro_rec), 4),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_precision": round(float(weighted_prec), 4),
        "weighted_recall": round(float(weighted_rec), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "macro_specificity": round(float(macro_spec), 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
        "inference_latency_ms": latency_ms,
        "model_size_mb": round(file_size_mb, 2),
        "parameter_count": total_params,
        "training_time_sec": metadata.get("training_time_sec", 0.0),
        "peak_memory_mb": peak_mem_mb,
        "per_class_metrics": per_class_dict,
        "confusion_matrix": cm.tolist(),
        "hardware_details": hardware_info,
        "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    return metrics_result

def run_evaluation(dataset_dir: Path):
    print("\n" + "=" * 60)
    print("STARTING TEST EVALUATION PIPELINE")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    hardware_info = get_system_hardware_details()

    _, _, test_loader, class_names, _, _ = create_stratified_loaders(
        dataset_dir=dataset_dir,
        batch_size=16,
        val_split=0.15,
        test_split=0.15,
        random_seed=42
    )

    saved_models_dir = ROOT_DIR / "saved_models"
    eval_dir = ROOT_DIR / "evaluation_results"
    plots_dir = eval_dir / "plots"
    docs_dir = ROOT_DIR / "docs"

    eval_dir.mkdir(parents=True, exist_ok=True)
    plots_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    model_keys = ["mobilenet_v2", "resnet50", "efficientnet_b0"]
    evaluation_records = {}

    for m in model_keys:
        res = evaluate_model(m, test_loader, class_names, device, saved_models_dir, hardware_info)
        if res:
            evaluation_records[m] = res

    if not evaluation_records:
        print("[!] No trained models found to evaluate. Run train.py first.")
        return

    # Build Comparison Table for CSV and JSON
    table_rows = []
    for m, rec in evaluation_records.items():
        table_rows.append({
            "Model": rec["display_name"],
            "Accuracy": rec["accuracy"],
            "Macro Precision": rec["macro_precision"],
            "Macro Recall": rec["macro_recall"],
            "Macro F1": rec["macro_f1"],
            "Weighted F1": rec["weighted_f1"],
            "Inference Latency (ms)": rec["inference_latency_ms"],
            "Model Size (MB)": rec["model_size_mb"],
            "Training Time (s)": rec["training_time_sec"],
            "Parameter Count": rec["parameter_count"]
        })

    df = pd.DataFrame(table_rows)

    # Save CSV and JSON to both evaluation_results and docs/
    csv_path_eval = eval_dir / "model_comparison.csv"
    csv_path_docs = docs_dir / "model_comparison.csv"
    df.to_csv(csv_path_eval, index=False)
    df.to_csv(csv_path_docs, index=False)

    json_path_eval = eval_dir / "model_comparison.json"
    json_path_docs = docs_dir / "model_comparison.json"
    with open(json_path_eval, "w", encoding="utf-8") as f:
        json.dump(evaluation_records, f, indent=2)
    with open(json_path_docs, "w", encoding="utf-8") as f:
        json.dump(evaluation_records, f, indent=2)

    # Generate comparative plots
    plot_comparison_bar_chart(df, plots_dir / "model_comparison_chart.png")
    plot_latency_vs_f1(df, plots_dir / "latency_vs_f1.png")

    print("\n" + "=" * 60)
    print("EVALUATION COMPLETED. COMPARATIVE SUMMARY TABLE:")
    print("=" * 60)
    print(df.to_string(index=False))
    print("\n[OK] Results saved to:")
    print(f" - {csv_path_eval}")
    print(f" - {json_path_eval}")
    print(f" - {plots_dir}")

if __name__ == "__main__":
    dataset_path = Path("c:/ML_Project/dataset")
    run_evaluation(dataset_path)
