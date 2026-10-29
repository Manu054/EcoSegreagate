from fastapi import APIRouter
from typing import List
from ..schemas import ModelInfo
from ..ml.inference import inference_engine

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=List[ModelInfo])
def get_available_models():
    """Returns available CNN models with their real-time loading status and parameter counts."""
    return inference_engine.get_models_info()
