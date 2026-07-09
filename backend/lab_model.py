"""Tabular liver lab-panel model: lazy loader + prediction + field metadata.

Loads the joblib bundle produced by train_tabular_model.py and exposes a
single source of truth (FIELD_META) for the 10 model features, used both
to build the frontend form and to drive OCR keyword matching in ocr.py.
"""
import logging
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import pandas as pd

logger = logging.getLogger(__name__)
_bundle_lock = threading.Lock()

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "tabular" / "liver_lab_model.pkl"

# Single source of truth: form fields <-> model feature columns <-> OCR synonyms.
FIELD_META: List[Dict[str, Any]] = [
    {
        "key": "age", "column": "Age", "label_ru": "Возраст", "unit": "лет",
        "type": "number", "min": 1, "max": 120, "step": 1,
        "synonyms": ["age", "возраст", "лет"],
        # Fallback when the document gives a birth date instead of an age (see _parse_age_from_birth_year in ocr.py).
        "birth_date_synonyms": ["год рождения", "дата рождения", "г.р.", "date of birth", "birth date", "dob"],
    },
    {
        "key": "gender", "column": "Gender", "label_ru": "Пол", "unit": None,
        "type": "select", "options": [{"value": 0, "label_ru": "Мужской"}, {"value": 1, "label_ru": "Женский"}],
        "synonyms": ["gender", "sex", "пол"],
    },
    {
        "key": "total_bilirubin", "column": "Total Bilirubin", "label_ru": "Общий билирубин", "unit": "мг/дл",
        "type": "number", "min": 0, "max": 80, "step": 0.1,
        "synonyms": ["total bilirubin", "общий билирубин", "билирубин общий", "билирубин общ"],
    },
    {
        "key": "direct_bilirubin", "column": "Direct Bilirubin", "label_ru": "Прямой билирубин", "unit": "мг/дл",
        "type": "number", "min": 0, "max": 25, "step": 0.1,
        "synonyms": ["direct bilirubin", "прямой билирубин", "билирубин прямой"],
    },
    {
        "key": "alk_phosphatase", "column": "Alkphos Alkaline Phosphotase", "label_ru": "Щелочная фосфатаза (ЩФ)", "unit": "МЕ/л",
        "type": "number", "min": 20, "max": 2500, "step": 1,
        "synonyms": ["alkaline phosphatase", "alkphos", "alp", "щелочная фосфатаза", "щф"],
    },
    {
        "key": "alt_sgpt", "column": "Sgpt Alamine Aminotransferase", "label_ru": "АЛТ (SGPT)", "unit": "МЕ/л",
        "type": "number", "min": 1, "max": 2200, "step": 1,
        "synonyms": ["alt", "sgpt", "alamine aminotransferase", "алт", "аланинаминотрансфераза"],
    },
    {
        "key": "ast_sgot", "column": "Sgot Aspartate Aminotransferase", "label_ru": "АСТ (SGOT)", "unit": "МЕ/л",
        "type": "number", "min": 1, "max": 5000, "step": 1,
        # "act" covers a common OCR misread: Cyrillic С visually matches Latin C, so "АСТ" -> "ACT".
        "synonyms": ["ast", "act", "sgot", "aspartate aminotransferase", "аст", "аспартатаминотрансфераза"],
    },
    {
        "key": "total_protein", "column": "Total Protiens", "label_ru": "Общий белок", "unit": "г/дл",
        "type": "number", "min": 1, "max": 12, "step": 0.1,
        "synonyms": ["total protein", "total proteins", "общий белок"],
    },
    {
        "key": "albumin", "column": "ALB Albumin", "label_ru": "Альбумин", "unit": "г/дл",
        "type": "number", "min": 0, "max": 7, "step": 0.1,
        "synonyms": ["albumin", "alb", "альбумин"],
    },
    {
        "key": "ag_ratio", "column": "A/G Ratio Albumin and Globulin Ratio", "label_ru": "Альбумин-глобулиновый коэффициент (A/G)", "unit": None,
        "type": "number", "min": 0.1, "max": 3.5, "step": 0.01,
        "synonyms": ["a/g ratio", "albumin globulin ratio", "альбумин-глобулиновый коэффициент", "а/г коэффициент"],
    },
]

FIELD_KEYS = [f["key"] for f in FIELD_META]

_bundle: Optional[Dict[str, Any]] = None


def _load_bundle() -> Dict[str, Any]:
    global _bundle
    if _bundle is None:
        with _bundle_lock:
            if _bundle is None:
                if not MODEL_PATH.exists():
                    raise FileNotFoundError(
                        f"No tabular model found at {MODEL_PATH}. Run train_tabular_model.py first."
                    )
                logger.info("Loading tabular liver model from %s", MODEL_PATH)
                _bundle = joblib.load(MODEL_PATH)
    return _bundle


def warm_up() -> None:
    """Load the model bundle eagerly — call from a background thread at
    app startup, not on the request path."""
    try:
        _load_bundle()
    except Exception:
        logger.exception("Tabular model warm-up failed; will retry lazily on first request.")


def predict_one(features: Dict[str, float]) -> Dict[str, Any]:
    """features: dict keyed by FIELD_META 'key' (e.g. {'age': 45, 'gender': 1, ...})."""
    bundle = _load_bundle()
    model = bundle["model"]
    feature_columns = bundle["feature_columns"]

    missing = [k for k in FIELD_KEYS if k not in features or features[k] is None]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    row = {meta["column"]: features[meta["key"]] for meta in FIELD_META}
    X = pd.DataFrame([row], columns=feature_columns)

    proba = model.predict_proba(X)[0]
    classes = list(model.classes_)
    prob_disease = float(proba[classes.index(1)]) if 1 in classes else float(proba[-1])
    prob_healthy = float(proba[classes.index(0)]) if 0 in classes else float(1 - prob_disease)
    prediction = int(prob_disease >= 0.5)

    return {
        "prediction": prediction,
        "label": "disease" if prediction == 1 else "healthy",
        "label_ru": "Признаки заболевания печени" if prediction == 1 else "Существенных отклонений не выявлено",
        "probability_disease": round(prob_disease, 4),
        "probability_healthy": round(prob_healthy, 4),
    }
