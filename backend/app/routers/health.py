from fastapi import APIRouter
from datetime import datetime
import psutil
from ..ml.inference import inference_engine
from ..hardware import get_hardware_controller

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def check_health():
    hw = get_hardware_controller().get_status()
    models_info = inference_engine.get_models_info()
    models_ready = sum(1 for m in models_info if m["status"] == "ready")

    return {
        "status": "healthy",
        "service": "Smart Waste Management API",
        "timestamp": datetime.utcnow().isoformat(),
        "models_ready": f"{models_ready}/{len(models_info)}",
        "hardware_simulation": hw.simulation_mode,
        "emergency_stop": hw.is_emergency_stopped,
        "memory_usage_pct": psutil.virtual_memory().percent,
        "cpu_usage_pct": psutil.cpu_percent()
    }
