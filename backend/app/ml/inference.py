import os
import sys
import io
import time
import json
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from PIL import Image
import torch
import torch.nn as nn
from torchvision import transforms

from ..config import settings
from ml.models import MODEL_BUILDERS, MODEL_DISPLAY_NAMES

logger = logging.getLogger("ml.inference")

class InferenceEngine:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.loaded_models: Dict[str, nn.Module] = {}
        self.model_metadata: Dict[str, Dict[str, Any]] = {}
        self.class_mappings = self._load_class_mappings()
        
        # Standard evaluation transform
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

        self.softmax = nn.Softmax(dim=1)
        self._load_available_models()

    def _load_class_mappings(self) -> Dict[str, Any]:
        mapping_path = settings.CLASS_MAPPING_FILE
        if mapping_path.exists():
            try:
                with open(mapping_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error reading class mapping: {e}")
        return {}

    def _load_available_models(self):
        for model_name, builder in MODEL_BUILDERS.items():
            checkpoint_path = settings.SAVED_MODELS_DIR / model_name / "best_model.pth"
            meta_path = settings.SAVED_MODELS_DIR / model_name / "model_metadata.json"

            if checkpoint_path.exists():
                try:
                    metadata = {}
                    if meta_path.exists():
                        with open(meta_path, "r", encoding="utf-8") as f:
                            metadata = json.load(f)

                    class_names = metadata.get("class_names", ["organic", "recyclable"])
                    model = builder(num_classes=len(class_names), pretrained=False)
                    checkpoint = torch.load(checkpoint_path, map_location=self.device)
                    model.load_state_dict(checkpoint["model_state_dict"])
                    model = model.to(self.device)
                    model.eval()

                    self.loaded_models[model_name] = model
                    self.model_metadata[model_name] = {
                        "class_names": class_names,
                        "metadata": metadata
                    }
                    logger.info(f"Loaded trained model: {model_name} on {self.device}")
                except Exception as e:
                    logger.error(f"Failed to load weights for {model_name}: {e}")

    def get_models_info(self) -> list:
        models_info = []
        for model_name, display_name in MODEL_DISPLAY_NAMES.items():
            is_loaded = model_name in self.loaded_models
            meta = self.model_metadata.get(model_name, {}).get("metadata", {})
            param_count = meta.get("total_parameters", 0)

            models_info.append({
                "name": model_name,
                "display_name": display_name,
                "architecture": model_name,
                "status": "ready" if is_loaded else "weights_missing",
                "parameter_count": param_count,
                "is_default": model_name == "mobilenet_v2",
                "description": self._get_model_description(model_name),
                "input_resolution": "224x224"
            })
        return models_info

    def _get_model_description(self, model_name: str) -> str:
        descs = {
            "mobilenet_v2": "Lightweight inverted residual architecture optimized for edge devices and rapid low-latency sorting.",
            "resnet50": "Deep 50-layer residual network utilizing skip connections for highly robust feature discrimination.",
            "efficientnet_b0": "Compound-scaled CNN balancing depth, width, and resolution for maximum parameter efficiency."
        }
        return descs.get(model_name, "")

    def preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            tensor = self.transform(image).unsqueeze(0)
            return tensor
        except Exception as e:
            raise ValueError(f"Invalid image format: {e}")

    def predict(self, image_bytes: bytes, model_name: str = "mobilenet_v2") -> Dict[str, Any]:
        if model_name not in MODEL_BUILDERS:
            raise ValueError(f"Unknown model name '{model_name}'. Available: {list(MODEL_BUILDERS.keys())}")

        # Check if model weights are loaded
        if model_name not in self.loaded_models:
            # Try reloading in case weights were just generated
            self._load_available_models()

        if model_name not in self.loaded_models:
            raise FileNotFoundError(
                f"Trained weights for '{MODEL_DISPLAY_NAMES.get(model_name, model_name)}' are not found. "
                "Please run 'python ml/train.py' to generate valid model checkpoints."
            )

        model = self.loaded_models[model_name]
        class_names = self.model_metadata[model_name]["class_names"]

        input_tensor = self.preprocess_image(image_bytes).to(self.device)

        start_time = time.perf_counter()
        with torch.no_grad():
            outputs = model(input_tensor)
            probs_tensor = self.softmax(outputs)[0]
        inference_latency_ms = (time.perf_counter() - start_time) * 1000.0

        probs = {class_names[i]: float(probs_tensor[i].item()) for i in range(len(class_names))}
        top_idx = int(torch.argmax(probs_tensor).item())
        top_class = class_names[top_idx]
        top_confidence = probs[top_class]

        # Map to segregation category and bin
        mapping_info = self.class_mappings.get("class_mappings", {}).get(top_class.lower(), {})
        fallback = self.class_mappings.get("default_fallback", {})

        segregation_category = mapping_info.get("primary_category", "Non-Biodegradable")
        bin_assigned = mapping_info.get("bin_name", "Yellow Bin (Recyclable Stream)")
        servo_angle = mapping_info.get("servo_angle_deg", 90)

        # Uncertainty handling
        is_uncertain = top_confidence < settings.CONFIDENCE_THRESHOLD
        status = "uncertain" if is_uncertain else "success"

        if is_uncertain:
            bin_assigned = fallback.get("bin_name", "Inspection / Manual Review Bin")
            servo_angle = fallback.get("servo_angle_deg", 0)
            message = (
                f"Prediction confidence ({top_confidence:.1%}) is below safety threshold "
                f"({settings.CONFIDENCE_THRESHOLD:.1%}). Directing item to inspection chute."
            )
        else:
            message = f"Successfully segregated as {segregation_category} ({top_class}). Target: {bin_assigned}."

        return {
            "model_name": model_name,
            "predicted_class": top_class,
            "segregation_category": segregation_category,
            "confidence": round(top_confidence, 4),
            "is_uncertain": is_uncertain,
            "inference_time_ms": round(inference_latency_ms, 2),
            "bin_assigned": bin_assigned,
            "servo_angle_deg": servo_angle,
            "hardware_triggered": not is_uncertain,
            "probabilities": {k: round(v, 4) for k, v in probs.items()},
            "status": status,
            "message": message,
            "calibration_note": "Softmax output values represent relative model activation and are not guaranteed calibrated real-world probabilities."
        }

    def predict_compare_all(self, image_bytes: bytes) -> Dict[str, Any]:
        results = {}
        missing_models = []

        for m in MODEL_BUILDERS.keys():
            try:
                results[m] = self.predict(image_bytes, model_name=m)
            except FileNotFoundError:
                missing_models.append(m)

        if missing_models:
            raise FileNotFoundError(
                f"Model weights missing for: {', '.join(missing_models)}. Run 'python ml/train.py' to train models."
            )

        # Calculate consensus and agreement
        categories = [res["segregation_category"] for res in results.values()]
        primary_classes = [res["predicted_class"] for res in results.values()]
        
        # Most frequent category
        consensus_category = max(set(categories), key=categories.count)
        agreement_count = categories.count(consensus_category)
        agreement_pct = round((agreement_count / len(categories)) * 100, 1)
        all_agree = (agreement_count == len(categories))

        # Fastest model
        fastest = min(results.items(), key=lambda x: x[1]["inference_time_ms"])[0]
        # Highest confidence
        highest_conf = max(results.items(), key=lambda x: x[1]["confidence"])[0]

        recommendation = (
            f"Consensus: {consensus_category} with {agreement_pct}% agreement. "
            f"Fastest inference: {MODEL_DISPLAY_NAMES[fastest]} ({results[fastest]['inference_time_ms']}ms)."
        )

        bin_assigned = results[highest_conf]["bin_assigned"]

        return {
            "predictions": results,
            "consensus_category": consensus_category,
            "agreement_percentage": agreement_pct,
            "all_agree": all_agree,
            "fastest_model": MODEL_DISPLAY_NAMES[fastest],
            "highest_confidence_model": MODEL_DISPLAY_NAMES[highest_conf],
            "recommended_action": recommendation,
            "bin_assigned": bin_assigned,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

# Global Engine Singleton
inference_engine = InferenceEngine()
