import os
import io
import logging
import threading
from typing import List, Dict, Any
from pathlib import Path

import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

import lab_model
import ocr as lab_ocr
import ultrasound_store


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Liver Ultrasound CNN API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _warm_up_lab_models() -> None:
    # EasyOCR/joblib loading is slow (seconds to tens of seconds on CPU) —
    # do it once in the background at boot instead of on a user's first
    # request, where a slow cold-start could look like a hung/failed call.
    threading.Thread(target=lab_ocr.warm_up, daemon=True).start()
    threading.Thread(target=lab_model.warm_up, daemon=True).start()
    ultrasound_store.init_db()

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_KERAS_PATH = BASE_DIR / "models" / "custom_liver_cnn.keras"
MODEL_SAVED_MODEL_PATH = BASE_DIR / "models" / "custom_liver_cnn"

CLASS_NAMES = ["benign", "malignant", "normal"]

model = None


def _load_model() -> Any:
    global model
    if model is None:
        if MODEL_KERAS_PATH.exists():
            logger.info("Loading CNN model from %s", MODEL_KERAS_PATH)
            model = tf.keras.models.load_model(MODEL_KERAS_PATH)
            return model

        if MODEL_SAVED_MODEL_PATH.exists():
            logger.info("Loading SavedModel from %s", MODEL_SAVED_MODEL_PATH)
            model = tf.keras.models.load_model(MODEL_SAVED_MODEL_PATH, compile=False)
            return model

        raise FileNotFoundError(
            f"No model found. Checked: {MODEL_KERAS_PATH} and {MODEL_SAVED_MODEL_PATH}"
        )
    return model


def _prepare_image(image_bytes: bytes, target_size: int = 224) -> np.ndarray:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((target_size, target_size))
    arr = np.asarray(image, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"status": "ok"}


@app.post("/ultrasound/predict")
async def predict_ultrasound(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        image_batch = _prepare_image(contents)
        loaded_model = _load_model()
        prediction = loaded_model.predict(image_batch, verbose=0)
        probs = prediction[0].tolist()
        pred_index = int(np.argmax(probs))
        predicted_class = CLASS_NAMES[pred_index]

        malignant_prob = float(probs[CLASS_NAMES.index("malignant")]) if "malignant" in CLASS_NAMES else 0.0
        is_malignant = malignant_prob >= 0.5
        probabilities = {
            class_name: round(float(prob), 4) for class_name, prob in zip(CLASS_NAMES, probs)
        }

        saved = ultrasound_store.save_result(
            filename=file.filename,
            content_type=file.content_type or "image/jpeg",
            image_bytes=contents,
            predicted_class=predicted_class,
            is_malignant=is_malignant,
            confidence=round(float(np.max(probs)), 4),
            malignant_probability=round(malignant_prob, 4),
            probabilities=probabilities,
        )

        return {
            "id": saved["id"],
            "created_at": saved["created_at"],
            "filename": file.filename,
            "predicted_class": predicted_class,
            "is_malignant": is_malignant,
            "confidence": round(float(np.max(probs)), 4),
            "probabilities": probabilities,
            "malignant_probability": round(malignant_prob, 4),
        }
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image") from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@app.get("/ultrasound/classes")
def get_classes() -> Dict[str, List[str]]:
    return {"classes": CLASS_NAMES}


@app.get("/ultrasound/history")
def list_ultrasound_history(limit: int = 100) -> List[Dict[str, Any]]:
    return ultrasound_store.list_history(limit=limit)


@app.get("/ultrasound/history/{record_id}")
def get_ultrasound_history_item(record_id: str) -> Dict[str, Any]:
    record = ultrasound_store.get_record(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return record


@app.get("/ultrasound/history/{record_id}/image")
def get_ultrasound_history_image(record_id: str) -> Response:
    found = ultrasound_store.get_image(record_id)
    if found is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    image_bytes, content_type = found
    return Response(content=image_bytes, media_type=content_type)


@app.delete("/ultrasound/history/{record_id}")
def delete_ultrasound_history_item(record_id: str) -> Dict[str, bool]:
    deleted = ultrasound_store.delete_record(record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"deleted": True}


# ---------------------------------------------------------------------------
# Tabular liver lab-panel model (separate from the ultrasound CNN above).
# ---------------------------------------------------------------------------

class LabPredictRequest(BaseModel):
    age: float = Field(..., ge=0, le=130)
    gender: float = Field(..., ge=0, le=1)
    total_bilirubin: float = Field(..., ge=0)
    direct_bilirubin: float = Field(..., ge=0)
    alk_phosphatase: float = Field(..., ge=0)
    alt_sgpt: float = Field(..., ge=0)
    ast_sgot: float = Field(..., ge=0)
    total_protein: float = Field(..., ge=0)
    albumin: float = Field(..., ge=0)
    ag_ratio: float = Field(..., ge=0)


@app.get("/labs/fields")
def get_lab_fields() -> Dict[str, Any]:
    return {"fields": lab_model.FIELD_META}


@app.post("/labs/predict")
def predict_lab_panel(payload: LabPredictRequest) -> Dict[str, Any]:
    try:
        return lab_model.predict_one(payload.model_dump())
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Lab prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@app.post("/labs/extract")
async def extract_lab_panel(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        result = await run_in_threadpool(
            lab_ocr.extract_and_parse, file.filename, file.content_type, contents
        )
        return {"filename": file.filename, **result}
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image") from exc
    except Exception as exc:
        logger.exception("Lab document extraction failed")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {exc}") from exc
