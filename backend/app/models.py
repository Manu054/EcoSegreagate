from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from .database import Base

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    filename = Column(String(255), nullable=True)
    model_name = Column(String(64), index=True)
    predicted_class = Column(String(64), index=True)
    segregation_category = Column(String(64), index=True)  # Biodegradable vs Non-Biodegradable
    confidence = Column(Float, nullable=False)
    inference_time_ms = Column(Float, nullable=False)
    probabilities_json = Column(Text, nullable=True)
    bin_assigned = Column(String(128), nullable=False)
    servo_angle_deg = Column(Integer, default=0)
    hardware_triggered = Column(Boolean, default=False)
    is_uncertain = Column(Boolean, default=False)
    status = Column(String(32), default="success")  # "success", "uncertain", "rejected"
    thumbnail_data = Column(Text, nullable=True)  # Base64 thumbnail for lightweight UI display
    notes = Column(Text, nullable=True)

class ModelEvaluationSummary(Base):
    __tablename__ = "model_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(64), unique=True, index=True)
    accuracy = Column(Float, nullable=False)
    macro_precision = Column(Float, nullable=False)
    macro_recall = Column(Float, nullable=False)
    macro_f1 = Column(Float, nullable=False)
    weighted_f1 = Column(Float, nullable=False)
    latency_ms = Column(Float, nullable=False)
    model_size_mb = Column(Float, nullable=False)
    parameter_count = Column(Integer, nullable=False)
    training_time_sec = Column(Float, nullable=False)
    evaluated_at = Column(DateTime, default=datetime.utcnow)
    details_json = Column(Text, nullable=True)  # Per-class metrics, confusion matrix, etc.
