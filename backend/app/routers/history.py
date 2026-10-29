from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import PaginatedHistory, HistoryItem
from .. import crud

router = APIRouter(prefix="/history", tags=["History"])

@router.get("", response_model=PaginatedHistory)
def get_prediction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    model_name: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    skip = (page - 1) * page_size
    items, total = crud.get_predictions(
        db=db,
        skip=skip,
        limit=page_size,
        model_name=model_name,
        category=category,
        status=status
    )

    history_items = [
        HistoryItem(
            id=item.id,
            timestamp=item.timestamp.isoformat(),
            filename=item.filename,
            model_name=item.model_name,
            predicted_class=item.predicted_class,
            segregation_category=item.segregation_category,
            confidence=item.confidence,
            inference_time_ms=item.inference_time_ms,
            bin_assigned=item.bin_assigned,
            servo_angle_deg=item.servo_angle_deg,
            hardware_triggered=item.hardware_triggered,
            is_uncertain=item.is_uncertain,
            status=item.status,
            thumbnail_data=item.thumbnail_data
        )
        for item in items
    ]

    return PaginatedHistory(
        total=total,
        page=page,
        page_size=page_size,
        items=history_items
    )

@router.get("/{prediction_id}")
def get_prediction_detail(prediction_id: int, db: Session = Depends(get_db)):
    rec = crud.get_prediction(db, prediction_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    
    return {
        "id": rec.id,
        "timestamp": rec.timestamp.isoformat(),
        "filename": rec.filename,
        "model_name": rec.model_name,
        "predicted_class": rec.predicted_class,
        "segregation_category": rec.segregation_category,
        "confidence": rec.confidence,
        "inference_time_ms": rec.inference_time_ms,
        "probabilities": rec.probabilities_json,
        "bin_assigned": rec.bin_assigned,
        "servo_angle_deg": rec.servo_angle_deg,
        "hardware_triggered": rec.hardware_triggered,
        "is_uncertain": rec.is_uncertain,
        "status": rec.status,
        "thumbnail_data": rec.thumbnail_data,
        "notes": rec.notes
    }

@router.delete("/{prediction_id}")
def delete_prediction_record(prediction_id: int, db: Session = Depends(get_db)):
    success = crud.delete_prediction(db, prediction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Prediction record not found.")
    return {"message": f"Prediction record {prediction_id} deleted successfully."}
