from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from . import models, schemas
import json

def create_prediction_record(
    db: Session,
    model_name: str,
    predicted_class: str,
    segregation_category: str,
    confidence: float,
    inference_time_ms: float,
    bin_assigned: str,
    servo_angle_deg: int,
    hardware_triggered: bool,
    is_uncertain: bool,
    status: str,
    probabilities: Dict[str, float],
    filename: Optional[str] = None,
    thumbnail_data: Optional[str] = None,
    notes: Optional[str] = None
) -> models.PredictionRecord:
    db_item = models.PredictionRecord(
        filename=filename,
        model_name=model_name,
        predicted_class=predicted_class,
        segregation_category=segregation_category,
        confidence=confidence,
        inference_time_ms=inference_time_ms,
        probabilities_json=json.dumps(probabilities),
        bin_assigned=bin_assigned,
        servo_angle_deg=servo_angle_deg,
        hardware_triggered=hardware_triggered,
        is_uncertain=is_uncertain,
        status=status,
        thumbnail_data=thumbnail_data,
        notes=notes
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_prediction(db: Session, prediction_id: int) -> Optional[models.PredictionRecord]:
    return db.query(models.PredictionRecord).filter(models.PredictionRecord.id == prediction_id).first()

def delete_prediction(db: Session, prediction_id: int) -> bool:
    db_item = get_prediction(db, prediction_id)
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True

def get_predictions(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    model_name: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> (List[models.PredictionRecord], int):
    query = db.query(models.PredictionRecord)
    if model_name:
        query = query.filter(models.PredictionRecord.model_name == model_name)
    if category:
        query = query.filter(models.PredictionRecord.segregation_category == category)
    if status:
        query = query.filter(models.PredictionRecord.status == status)
    if start_date:
        query = query.filter(models.PredictionRecord.timestamp >= start_date)
    if end_date:
        query = query.filter(models.PredictionRecord.timestamp <= end_date)
        
    total = query.count()
    items = query.order_by(desc(models.PredictionRecord.timestamp)).offset(skip).limit(limit).all()
    return items, total

def get_analytics_summary(db: Session) -> Dict[str, Any]:
    total = db.query(models.PredictionRecord).count()
    if total == 0:
        return {
            "total_predictions": 0,
            "biodegradable_count": 0,
            "non_biodegradable_count": 0,
            "uncertain_count": 0,
            "category_breakdown": {},
            "model_usage": {},
            "average_confidence": 0.0,
            "average_latency_ms": 0.0,
            "hardware_activations": 0
        }

    bio_count = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.segregation_category == "Biodegradable"
    ).count()
    
    non_bio_count = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.segregation_category == "Non-Biodegradable"
    ).count()

    uncertain_count = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.is_uncertain == True
    ).count()

    hw_count = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.hardware_triggered == True
    ).count()

    avg_conf = db.query(func.avg(models.PredictionRecord.confidence)).scalar() or 0.0
    avg_latency = db.query(func.avg(models.PredictionRecord.inference_time_ms)).scalar() or 0.0

    # Category breakdown
    cat_rows = db.query(
        models.PredictionRecord.predicted_class,
        func.count(models.PredictionRecord.id)
    ).group_by(models.PredictionRecord.predicted_class).all()
    cat_breakdown = {cat: count for cat, count in cat_rows}

    # Model usage breakdown
    model_rows = db.query(
        models.PredictionRecord.model_name,
        func.count(models.PredictionRecord.id)
    ).group_by(models.PredictionRecord.model_name).all()
    model_usage = {m: count for m, count in model_rows}

    return {
        "total_predictions": total,
        "biodegradable_count": bio_count,
        "non_biodegradable_count": non_bio_count,
        "uncertain_count": uncertain_count,
        "category_breakdown": cat_breakdown,
        "model_usage": model_usage,
        "average_confidence": round(float(avg_conf), 4),
        "average_latency_ms": round(float(avg_latency), 2),
        "hardware_activations": hw_count
    }

def get_analytics_trends(db: Session, days: int = 14) -> List[Dict[str, Any]]:
    # Generate daily grouping for the last N days
    since = datetime.utcnow() - timedelta(days=days)
    records = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.timestamp >= since
    ).order_by(models.PredictionRecord.timestamp.asc()).all()

    daily_data: Dict[str, Dict[str, int]] = {}
    for r in records:
        day_str = r.timestamp.strftime("%Y-%m-%d")
        if day_str not in daily_data:
            daily_data[day_str] = {"date": day_str, "total": 0, "biodegradable": 0, "non_biodegradable": 0}
        daily_data[day_str]["total"] += 1
        if r.segregation_category == "Biodegradable":
            daily_data[day_str]["biodegradable"] += 1
        else:
            daily_data[day_str]["non_biodegradable"] += 1

    return list(daily_data.values())

def upsert_model_evaluation(db: Session, eval_data: Dict[str, Any]) -> models.ModelEvaluationSummary:
    existing = db.query(models.ModelEvaluationSummary).filter(
        models.ModelEvaluationSummary.model_name == eval_data["model_name"]
    ).first()

    if existing:
        for k, v in eval_data.items():
            if k == "details_json" and isinstance(v, dict):
                setattr(existing, k, json.dumps(v))
            else:
                setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        details = eval_data.get("details_json")
        if isinstance(details, dict):
            details = json.dumps(details)
            
        record = models.ModelEvaluationSummary(
            model_name=eval_data["model_name"],
            accuracy=eval_data["accuracy"],
            macro_precision=eval_data["macro_precision"],
            macro_recall=eval_data["macro_recall"],
            macro_f1=eval_data["macro_f1"],
            weighted_f1=eval_data["weighted_f1"],
            latency_ms=eval_data["latency_ms"],
            model_size_mb=eval_data["model_size_mb"],
            parameter_count=eval_data["parameter_count"],
            training_time_sec=eval_data["training_time_sec"],
            details_json=details
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

def get_all_model_evaluations(db: Session) -> List[models.ModelEvaluationSummary]:
    return db.query(models.ModelEvaluationSummary).all()

def get_model_evaluation(db: Session, model_name: str) -> Optional[models.ModelEvaluationSummary]:
    return db.query(models.ModelEvaluationSummary).filter(
        models.ModelEvaluationSummary.model_name == model_name
    ).first()

def record_to_history_item(rec: models.PredictionRecord) -> schemas.HistoryItem:
    return schemas.HistoryItem(
        id=rec.id,
        timestamp=rec.timestamp.isoformat() if rec.timestamp else "",
        filename=rec.filename,
        model_name=rec.model_name,
        predicted_class=rec.predicted_class,
        segregation_category=rec.segregation_category,
        confidence=rec.confidence,
        inference_time_ms=rec.inference_time_ms,
        bin_assigned=rec.bin_assigned,
        servo_angle_deg=rec.servo_angle_deg,
        hardware_triggered=rec.hardware_triggered,
        is_uncertain=rec.is_uncertain,
        status=rec.status,
        thumbnail_data=rec.thumbnail_data
    )

def get_telemetry_feed(
    db: Session,
    time_range: str = "1h",
    min_confidence: float = 0.0,
    limit: int = 50
) -> Dict[str, Any]:
    now = datetime.utcnow()
    if time_range == "15m":
        window_minutes = 15
        bucket_count = 5
        bucket_mins = 3
    elif time_range == "24h":
        window_minutes = 24 * 60
        bucket_count = 12
        bucket_mins = 120
    else:  # "1h" default
        time_range = "1h"
        window_minutes = 60
        bucket_count = 6
        bucket_mins = 10

    start_time = now - timedelta(minutes=window_minutes)

    # 1. Total records in selected window
    window_query = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.timestamp >= start_time
    )
    window_records = window_query.order_by(desc(models.PredictionRecord.timestamp)).all()

    total_detections = len(window_records)
    bio_count = sum(1 for r in window_records if r.segregation_category == "Biodegradable")
    non_bio_count = sum(1 for r in window_records if r.segregation_category == "Non-Biodegradable")

    bio_pct = round((bio_count / total_detections * 100.0), 1) if total_detections > 0 else 0.0
    non_bio_pct = round((non_bio_count / total_detections * 100.0), 1) if total_detections > 0 else 0.0

    latencies = [r.inference_time_ms for r in window_records if r.inference_time_ms is not None]
    avg_latency = round(sum(latencies) / len(latencies), 1) if latencies else 0.0
    throughput_per_min = round(total_detections / window_minutes, 2)

    # 2. Latest detection overall across the database
    latest_rec = db.query(models.PredictionRecord).order_by(desc(models.PredictionRecord.timestamp)).first()
    latest_detection = record_to_history_item(latest_rec) if latest_rec else None

    # 3. Recent activity filtered by min_confidence
    activity_query = db.query(models.PredictionRecord)
    if min_confidence > 0.0:
        activity_query = activity_query.filter(models.PredictionRecord.confidence >= min_confidence)
    recent_records = activity_query.order_by(desc(models.PredictionRecord.timestamp)).limit(limit).all()
    recent_activity = [record_to_history_item(r) for r in recent_records]

    # 4. Generate trend buckets from start_time to now
    trend_chart = []
    bucket_step = timedelta(minutes=bucket_mins)
    for i in range(bucket_count):
        b_start = start_time + (i * bucket_step)
        b_end = b_start + bucket_step
        time_label = b_end.strftime("%H:%M")
        
        b_records = [r for r in window_records if b_start <= r.timestamp < b_end]
        b_bio = sum(1 for r in b_records if r.segregation_category == "Biodegradable")
        b_non_bio = sum(1 for r in b_records if r.segregation_category == "Non-Biodegradable")
        
        trend_chart.append({
            "time": time_label,
            "biodegradable": b_bio,
            "non_biodegradable": b_non_bio,
            "total": len(b_records)
        })

    # 5. System Health
    from .ml.inference import inference_engine
    models_info = inference_engine.get_models_info()
    models_ready_count = sum(1 for m in models_info if m.get("status") == "ready")
    recent_errors = db.query(models.PredictionRecord).filter(
        models.PredictionRecord.status == "error"
    ).count()

    system_health = {
        "api_status": "Operational",
        "models_ready": f"{models_ready_count} / {len(models_info)} Active",
        "hardware_status": "Ready (Conveyor Simulation)",
        "last_inference_timestamp": latest_rec.timestamp.isoformat() if latest_rec and latest_rec.timestamp else None,
        "recent_errors_count": recent_errors
    }

    metrics = {
        "total_detections": total_detections,
        "biodegradable_count": bio_count,
        "non_biodegradable_count": non_bio_count,
        "biodegradable_pct": bio_pct,
        "non_biodegradable_pct": non_bio_pct,
        "avg_latency_ms": avg_latency,
        "throughput_per_min": throughput_per_min,
        "time_window_minutes": window_minutes
    }

    return {
        "latest_detection": latest_detection,
        "recent_activity": recent_activity,
        "metrics": metrics,
        "trend_chart": trend_chart,
        "system_health": system_health
    }
