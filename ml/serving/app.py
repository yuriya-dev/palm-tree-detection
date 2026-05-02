import hashlib
from typing import Dict

from fastapi import FastAPI, File, Form, UploadFile

app = FastAPI(title="Palm ML Service", version="0.1.0")


def normalize_status(value: str) -> str:
    mapping: Dict[str, str] = {
        "healthy": "Healthy",
        "warning": "Warning",
        "critical": "Critical",
    }
    return mapping.get(value.lower().strip(), "Warning")


def mock_predict(image_bytes: bytes, confidence_threshold: float) -> Dict[str, object]:
    digest = hashlib.sha256(image_bytes).hexdigest()
    status_bucket = int(digest[0:2], 16) % 3
    statuses = ["Healthy", "Warning", "Critical"]
    status = statuses[status_bucket]

    base_confidence = 0.70 + (int(digest[2:4], 16) / 255.0) * 0.28
    confidence = max(base_confidence, confidence_threshold)
    confidence = min(confidence, 0.99)

    return {
        "status": status,
        "confidence": round(confidence, 4),
        "source": "python-ml-service-mock",
    }


@app.get("/health")
async def health() -> Dict[str, object]:
    return {"success": True, "status": "healthy"}


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    site: str = Form("Site 1"),
    model: str = Form("mopad"),
    confidence_threshold: float = Form(0.55),
) -> Dict[str, object]:
    image_bytes = await image.read()
    prediction = mock_predict(image_bytes=image_bytes, confidence_threshold=confidence_threshold)

    if model:
        prediction["model"] = model
    if site:
        prediction["site"] = site

    prediction["status"] = normalize_status(str(prediction["status"]))

    return {
        "success": True,
        "prediction": prediction,
        "message": "OK",
    }
