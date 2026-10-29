import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import engine, Base
from .routers import health, models_router, predict, metrics, analytics, history, reports, hardware_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("backend.main")

# Initialize database schema
Base.metadata.create_all(bind=engine)
logger.info("Database schema initialized.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="""
    ## Automated Waste Segregation API
    End-to-End Deep Learning System for Automated Sorting of Biodegradable and Non-Biodegradable Waste.
    
    ### Capabilities:
    * **Image Classification:** MobileNetV2, ResNet50, and EfficientNetB0 CNN inference.
    * **Multi-Model Consensus:** Real-time side-by-side comparison with ensemble voting.
    * **Hardware Diverter Abstraction:** Simulation layer with safety interlocks & confidence thresholding.
    * **Persistent Analytics:** Historical logging, model usage telemetry, and distribution trends.
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(models_router.router, prefix=settings.API_V1_STR)
app.include_router(predict.router, prefix=settings.API_V1_STR)
app.include_router(metrics.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(history.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(hardware_router.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs",
        "health": f"{settings.API_V1_STR}/health"
    }
