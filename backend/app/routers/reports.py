import os
from pathlib import Path
from typing import List
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from ..config import settings
from ..schemas import ReportFileInfo

router = APIRouter(prefix="/reports", tags=["Reports"])

ALLOWED_REPORT_FILES = {
    "Smart_Waste_Management_Project_Report.md": "Comprehensive 43-section academic technical project report (Markdown)",
    "Smart_Waste_Management_Project_Report.docx": "Comprehensive academic technical project report formatted for Word/Office",
    "Smart_Waste_Management_Project_Report.pdf": "Comprehensive academic technical project report formatted for PDF",
    "API_Documentation.md": "REST API contracts, response models, and integration specifications",
    "Setup_and_Execution_Guide.md": "Setup, training execution, hardware interfacing, and deployment guide",
    "Testing_Report.md": "Automated test suite methodology, execution results, and edge-case validation",
    "model_comparison.csv": "Tabular evaluation metrics across MobileNetV2, ResNet50, and EfficientNetB0",
    "model_comparison.json": "Machine-readable evaluation metrics with confusion matrices and per-class stats"
}

@router.get("", response_model=List[ReportFileInfo])
def list_available_reports():
    """Returns a catalogue of verified technical documentation and evaluation artifacts."""
    reports = []
    
    for filename, description in ALLOWED_REPORT_FILES.items():
        doc_path = settings.DOCS_DIR / filename
        eval_path = settings.EVALUATION_DIR / filename
        
        target = doc_path if doc_path.exists() else (eval_path if eval_path.exists() else None)
        
        if target and target.exists():
            stat = target.stat()
            reports.append(ReportFileInfo(
                filename=filename,
                file_type=target.suffix.replace(".", "").upper(),
                size_bytes=stat.st_size,
                description=description,
                created_at=datetime.fromtimestamp(stat.st_mtime).isoformat(),
                download_url=f"/api/reports/{filename}"
            ))
        else:
            # File is defined in schema but not yet generated
            reports.append(ReportFileInfo(
                filename=filename,
                file_type=filename.split(".")[-1].upper(),
                size_bytes=0,
                description=f"{description} (Generation pending)",
                created_at=datetime.utcnow().isoformat(),
                download_url=f"/api/reports/{filename}"
            ))

    return reports

@router.get("/{report_name}")
def download_report(report_name: str):
    """Securely downloads an approved project document or evaluation artifact."""
    if report_name not in ALLOWED_REPORT_FILES:
        raise HTTPException(status_code=400, detail="Requested file is not in approved documentation catalogue.")

    # Prevent directory traversal
    clean_name = os.path.basename(report_name)
    doc_path = settings.DOCS_DIR / clean_name
    eval_path = settings.EVALUATION_DIR / clean_name

    target = doc_path if doc_path.exists() else (eval_path if eval_path.exists() else None)

    if not target or not target.exists():
        raise HTTPException(status_code=404, detail=f"File '{clean_name}' has not yet been generated. Run evaluation/doc generation pipeline.")

    media_type = "application/octet-stream"
    if clean_name.endswith(".md") or clean_name.endswith(".txt"):
        media_type = "text/markdown; charset=utf-8"
    elif clean_name.endswith(".csv"):
        media_type = "text/csv; charset=utf-8"
    elif clean_name.endswith(".json"):
        media_type = "application/json"
    elif clean_name.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif clean_name.endswith(".pdf"):
        media_type = "application/pdf"

    return FileResponse(path=str(target), filename=clean_name, media_type=media_type)
