from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

try:
    from ultralytics import YOLO  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    YOLO = None


LOGGER = logging.getLogger("ml-service")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

LABEL_TO_STATUS = {
    "healthy": "Healthy",
    "good": "Healthy",
    "normal": "Healthy",
    "palm": "Healthy",
    "palm_tree": "Healthy",
    "warning": "Warning",
    "warn": "Warning",
    "yellow": "Warning",
    "small": "Warning",
    "grass": "Warning",
    "stress": "Warning",
    "critical": "Critical",
    "dead": "Critical",
    "unhealthy": "Critical",
}

DEFAULT_MODEL_CANDIDATES = (
    "models/best.pt",
    "models/last.pt",
    "weights/best.pt",
    "weights/last.pt",
    "../runs/detect/runs/palm_detection/yolov8s_exp1-8/weights/best.pt",
    "../runs/detect/runs/palm_detection/yolov8s_exp1/weights/best.pt",
)

app = FastAPI(title="Palm Tree ML Service", version="1.0.0")
cors_origins = [origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials="*" not in cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clamp(value: float, minimum: float = 0.0, maximum: float = 1.0) -> float:
    return max(minimum, min(maximum, value))


def normalize_status(label: str) -> str:
    normalized = label.strip().lower().replace(" ", "_")
    if normalized in LABEL_TO_STATUS:
        return LABEL_TO_STATUS[normalized]
    if normalized in {"non_palm", "background", "other"}:
        return "Warning"
    return ""


def decode_image(image_bytes: bytes) -> Image.Image:
    image = Image.open(BytesIO(image_bytes))
    return image.convert("RGB")


@lru_cache(maxsize=1)
def load_model() -> tuple[Any | None, str]:
    if YOLO is None:
        LOGGER.info("ultralytics is not installed; heuristic fallback is active")
        return None, "heuristic"

    model_path = os.getenv("MODEL_PATH", "").strip()
    candidates = [model_path] if model_path else []
    candidates.extend(DEFAULT_MODEL_CANDIDATES)

    base_dir = Path(__file__).resolve().parent
    for candidate in candidates:
        if not candidate:
            continue

        resolved = Path(candidate)
        if not resolved.is_absolute():
            resolved = (base_dir / resolved).resolve()

        if not resolved.exists():
            continue

        try:
            model = YOLO(str(resolved))
            LOGGER.info("loaded model from %s", resolved)
            return model, str(resolved)
        except Exception as exc:  # pragma: no cover - startup logging only
            LOGGER.warning("failed to load model %s: %s", resolved, exc)

    LOGGER.info("no model file found; heuristic fallback is active")
    return None, "heuristic"


def heuristic_prediction(image: Image.Image, site: str, model_name: str, threshold: float) -> dict[str, Any]:
    resized = image.copy()
    resized.thumbnail((256, 256))
    array = np.asarray(resized, dtype=np.float32) / 255.0

    brightness = float(array.mean()) if array.size else 0.5
    saturation = float((array.max(axis=2) - array.min(axis=2)).mean()) if array.ndim == 3 and array.size else 0.2
    texture = float(array.std()) if array.size else 0.2

    health_score = clamp((1.0 - brightness) * 0.45 + saturation * 0.35 + texture * 0.2)

    if health_score < 0.34:
        status = "Healthy"
    elif health_score < 0.67:
        status = "Warning"
    else:
        status = "Critical"

    confidence = clamp(0.58 + abs(health_score - 0.5) * 0.72)
    if confidence < threshold:
        confidence = clamp(threshold + 0.04)

    width, height = image.size
    box_width = max(24.0, width * 0.38)
    box_height = max(24.0, height * 0.34)
    left = max(0.0, (width - box_width) / 2)
    top = max(0.0, (height - box_height) / 2)

    detection = {
        "label": "heuristic_canopy",
        "status": status,
        "confidence": round(confidence, 4),
        "class_id": None,
        "box": {
            "x1": round(left, 2),
            "y1": round(top, 2),
            "x2": round(left + box_width, 2),
            "y2": round(top + box_height, 2),
        },
    }

    return {
        "status": status,
        "confidence": round(confidence, 4),
        "model": model_name,
        "source": "heuristic",
        "site": site,
        "detections": [detection],
    }


def infer_with_model(image: Image.Image, site: str, model_name: str, threshold: float) -> dict[str, Any]:
    model, loaded_path = load_model()
    if model is None:
        return heuristic_prediction(image, site, model_name, threshold)

    try:
        results = model.predict(image, conf=threshold, verbose=False)
    except Exception as exc:
        LOGGER.warning("model inference failed, fallback to heuristic: %s", exc)
        return heuristic_prediction(image, site, model_name, threshold)

    if not results:
        return heuristic_prediction(image, site, model_name, threshold)

    result = results[0]
    boxes = []
    best_status = ""
    best_confidence = 0.0
    fallback_status = heuristic_prediction(image, site, model_name, threshold)["status"]

    names = getattr(model, "names", {}) or {}

    for box in getattr(result, "boxes", []) or []:
        confidence = float(box.conf[0]) if getattr(box, "conf", None) is not None else 0.0
        class_id = int(box.cls[0]) if getattr(box, "cls", None) is not None else None
        label = str(names.get(class_id, f"class_{class_id}" if class_id is not None else "object"))
        status = normalize_status(label)
        if not status:
            status = fallback_status
        xyxy = box.xyxy[0].tolist() if getattr(box, "xyxy", None) is not None else [0.0, 0.0, 0.0, 0.0]

        if confidence >= best_confidence:
            best_confidence = confidence
            best_status = status

        boxes.append(
            {
                "label": label,
                "status": status,
                "confidence": round(confidence, 4),
                "class_id": class_id,
                "box": {
                    "x1": round(float(xyxy[0]), 2),
                    "y1": round(float(xyxy[1]), 2),
                    "x2": round(float(xyxy[2]), 2),
                    "y2": round(float(xyxy[3]), 2),
                },
            }
        )

    if not boxes:
        return heuristic_prediction(image, site, model_name, threshold)

    if not best_status:
        best_status = boxes[0]["status"]
        best_confidence = float(boxes[0]["confidence"])

    return {
        "status": best_status,
        "confidence": round(clamp(best_confidence), 4),
        "model": model_name,
        "source": loaded_path,
        "site": site,
        "detections": boxes,
    }


@app.get("/health")
def health() -> dict[str, Any]:
    model, loaded_path = load_model()
    return {
        "success": True,
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": loaded_path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    site: str = Form("Site 1"),
    model: str = Form("mopad"),
    confidence_threshold: float = Form(0.55),
) -> dict[str, Any]:
    image_bytes = await image.read()
    if not image_bytes:
        return {
            "success": False,
            "message": "image file is empty",
            "prediction": None,
        }

    try:
        pil_image = decode_image(image_bytes)
    except Exception as exc:
        return {
            "success": False,
            "message": f"invalid image file: {exc}",
            "prediction": None,
        }

    prediction = infer_with_model(pil_image, site=site, model_name=model, threshold=confidence_threshold)
    return {
        "success": True,
        "message": "prediction completed",
        "prediction": {
            **prediction,
            "image_name": image.filename or "image.jpg",
            "image_size": {"width": pil_image.width, "height": pil_image.height},
            "confidence_threshold": confidence_threshold,
        },
    }
