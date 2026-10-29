import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Waste Management System"
    API_V1_STR: str = "/api"
    
    # Paths
    BASE_DIR: Path = BASE_DIR
    SAVED_MODELS_DIR: Path = BASE_DIR / "saved_models"
    EVALUATION_DIR: Path = BASE_DIR / "evaluation_results"
    DOCS_DIR: Path = BASE_DIR / "docs"
    DATASET_DIR: Path = BASE_DIR / "dataset"
    UPLOADS_DIR: Path = BASE_DIR / "backend" / "uploads"
    
    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'backend' / 'waste_management.db'}"
    
    # Hardware Simulation
    HARDWARE_SIMULATION_MODE: bool = True
    CONFIDENCE_THRESHOLD: float = 0.65  # Threshold below which physical actuation is halted for safety
    DEFAULT_SAFE_BIN: str = "Inspection / Manual Review"
    
    # Class mapping path
    CLASS_MAPPING_FILE: Path = BASE_DIR / "ml" / "dataset" / "class_mapping.json"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.SAVED_MODELS_DIR.mkdir(parents=True, exist_ok=True)
settings.EVALUATION_DIR.mkdir(parents=True, exist_ok=True)
settings.DOCS_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
