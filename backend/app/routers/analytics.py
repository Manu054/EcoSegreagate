from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AnalyticsSummary, TelemetryDataResponse
from .. import crud

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Provides genuine aggregate statistics of live prediction requests."""
    return crud.get_analytics_summary(db)

@router.get("/trends")
def get_analytics_trends(days: int = 14, db: Session = Depends(get_db)):
    """Provides daily trend telemetry of waste classifications over time."""
    return crud.get_analytics_trends(db, days=days)

@router.get("/telemetry", response_model=TelemetryDataResponse)
def get_telemetry_feed(
    time_range: str = Query("1h", regex="^(15m|1h|24h)$"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """
    Live telemetry data feed including latest detection, recent activity,
    computed real metrics, time-bucketed trend chart, and system health status.
    """
    return crud.get_telemetry_feed(
        db=db,
        time_range=time_range,
        min_confidence=min_confidence,
        limit=limit
    )

