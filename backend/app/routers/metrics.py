import json
from pathlib import Path
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException
from ..config import settings
from ml.models import MODEL_DISPLAY_NAMES

router = APIRouter(prefix="/metrics", tags=["Metrics"])

def load_evaluation_metrics() -> Dict[str, Any]:
    json_path = settings.EVALUATION_DIR / "model_comparison.json"
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

@router.get("", response_model=Dict[str, Any])
def get_all_metrics():
    """
    Returns comparative evaluation metrics across all 3 models.
    Marks status as 'pending_training' if evaluation has not yet been executed.
    """
    metrics = load_evaluation_metrics()
    
    # Check if complete
    response = {}
    for key, display_name in MODEL_DISPLAY_NAMES.items():
        if key in metrics:
            response[key] = metrics[key]
        else:
            response[key] = {
                "model_name": key,
                "display_name": display_name,
                "status": "pending_training",
                "accuracy": None,
                "macro_precision": None,
                "macro_recall": None,
                "macro_f1": None,
                "weighted_f1": None,
                "inference_latency_ms": None,
                "model_size_mb": None,
                "parameter_count": None,
                "training_time_sec": None,
                "message": "Model evaluation pending: Train models via 'python ml/train.py' then run 'python ml/evaluate.py'."
            }

    return response

@router.get("/{model_name}", response_model=Dict[str, Any])
def get_model_metric(model_name: str):
    """Returns detailed evaluation breakdown for a specific architecture."""
    if model_name not in MODEL_DISPLAY_NAMES:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found. Available: {list(MODEL_DISPLAY_NAMES.keys())}")

    metrics = load_evaluation_metrics()
    if model_name in metrics:
        return metrics[model_name]

    return {
        "model_name": model_name,
        "display_name": MODEL_DISPLAY_NAMES[model_name],
        "status": "pending_training",
        "accuracy": None,
        "macro_precision": None,
        "macro_recall": None,
        "macro_f1": None,
        "weighted_f1": None,
        "inference_latency_ms": None,
        "model_size_mb": None,
        "parameter_count": None,
        "training_time_sec": None,
        "message": "Evaluation pending training completion."
    }
