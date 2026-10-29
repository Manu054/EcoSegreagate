import base64
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from PIL import Image

from ..database import get_db
from ..schemas import PredictionResponse, ModelComparisonResponse
from ..ml.inference import inference_engine
from ..hardware import get_hardware_controller
from .. import crud

router = APIRouter(prefix="/predict", tags=["Prediction"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit

def validate_and_read_image(file: UploadFile) -> tuple[bytes, str]:
    # 1. Content-Type check
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Invalid file type '{file.content_type}'. Must be an image.")

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Image exceeds maximum allowable file size (10MB).")

    # 2. Decode verification
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
        
        # Create thumbnail for lightweight database storage
        with Image.open(io.BytesIO(content)) as orig:
            thumb = orig.copy()
            thumb.thumbnail((120, 120))
            thumb_io = io.BytesIO()
            thumb.convert("RGB").save(thumb_io, format="JPEG", quality=75)
            thumbnail_b64 = "data:image/jpeg;base64," + base64.b64encode(thumb_io.getvalue()).decode("utf-8")

        return content, thumbnail_b64
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Corrupted or unreadable image file: {str(e)}")

@router.post("", response_model=PredictionResponse)
def predict_single(
    file: UploadFile = File(...),
    model_name: str = Form("mobilenet_v2"),
    db: Session = Depends(get_db)
):
    """
    Accepts an image upload and selected model architecture.
    Performs inference, triggers hardware actuator layer, and persists prediction record.
    """
    image_bytes, thumb_b64 = validate_and_read_image(file)

    try:
        pred_result = inference_engine.predict(image_bytes, model_name=model_name)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=400, detail=str(fnf))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")

    # Route through hardware abstraction
    hw_controller = get_hardware_controller()
    hw_action = hw_controller.route_waste(
        segregation_category=pred_result["segregation_category"],
        detailed_class=pred_result["predicted_class"],
        confidence=pred_result["confidence"]
    )

    # Persist in database
    db_rec = crud.create_prediction_record(
        db=db,
        model_name=pred_result["model_name"],
        predicted_class=pred_result["predicted_class"],
        segregation_category=pred_result["segregation_category"],
        confidence=pred_result["confidence"],
        inference_time_ms=pred_result["inference_time_ms"],
        bin_assigned=hw_action.bin_assigned,
        servo_angle_deg=hw_action.servo_angle_deg,
        hardware_triggered=hw_action.triggered,
        is_uncertain=pred_result["is_uncertain"],
        status=pred_result["status"],
        probabilities=pred_result["probabilities"],
        filename=file.filename,
        thumbnail_data=thumb_b64,
        notes=hw_action.message
    )

    pred_result["id"] = db_rec.id
    pred_result["bin_assigned"] = hw_action.bin_assigned
    pred_result["servo_angle_deg"] = hw_action.servo_angle_deg
    pred_result["hardware_triggered"] = hw_action.triggered
    pred_result["timestamp"] = db_rec.timestamp.isoformat()
    pred_result["thumbnail_data"] = thumb_b64

    return pred_result

@router.post("/compare", response_model=ModelComparisonResponse)
def predict_compare_all(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Runs all three CNN models (MobileNetV2, ResNet50, EfficientNetB0) simultaneously
    on the uploaded image to evaluate agreement and contrast inference performance.
    """
    image_bytes, thumb_b64 = validate_and_read_image(file)

    try:
        comparison_result = inference_engine.predict_compare_all(image_bytes)
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=400, detail=str(fnf))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison inference failed: {str(e)}")

    # Record fastest prediction in database
    top_model = comparison_result["fastest_model"].lower().replace(" ", "_")
    if top_model in comparison_result["predictions"]:
        top_pred = comparison_result["predictions"][top_model]
        hw_controller = get_hardware_controller()
        hw_action = hw_controller.route_waste(
            segregation_category=top_pred["segregation_category"],
            detailed_class=top_pred["predicted_class"],
            confidence=top_pred["confidence"]
        )

        crud.create_prediction_record(
            db=db,
            model_name=f"ensemble_comparison ({top_model})",
            predicted_class=top_pred["predicted_class"],
            segregation_category=comparison_result["consensus_category"],
            confidence=top_pred["confidence"],
            inference_time_ms=top_pred["inference_time_ms"],
            bin_assigned=hw_action.bin_assigned,
            servo_angle_deg=hw_action.servo_angle_deg,
            hardware_triggered=hw_action.triggered,
            is_uncertain=top_pred["is_uncertain"],
            status="comparison",
            probabilities=top_pred["probabilities"],
            filename=file.filename,
            thumbnail_data=thumb_b64,
            notes=f"Comparison: {comparison_result['recommended_action']}"
        )

    return comparison_result
