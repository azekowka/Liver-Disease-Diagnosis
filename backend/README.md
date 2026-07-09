# Backend

FastAPI backend for liver ultrasound image classification (CNN) and
liver lab-panel diagnosis from tabular blood test values (RandomForest).

## Requirements

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run locally

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## API endpoints

- GET /health — health check
- POST /ultrasound/predict — upload an image and get a prediction
- GET /ultrasound/classes — list supported classes
- GET /labs/fields — metadata for the 10 lab-panel fields (label, unit, valid range)
- POST /labs/extract — upload a PDF/photo of a lab panel; OCR + regex extract the 10 fields (no prediction, for review before submitting)
- POST /labs/predict — JSON body of the 10 lab values → RandomForest verdict (disease / healthy + probability)

The tabular model is trained by `train_tabular_model.py` (run once from this
directory: `python train_tabular_model.py`), which reads `../LD_raw_data.csv`
and writes `../models/tabular/liver_lab_model.pkl`.

## Example request

```bash
curl -X POST "http://127.0.0.1:8000/ultrasound/predict" \
  -F "file=@/path/to/image.jpg"
```

## Response example

```json
{
  "filename": "image.jpg",
  "predicted_class": "malignant",
  "is_malignant": true,
  "confidence": 0.9213,
  "probabilities": {
    "benign": 0.0312,
    "malignant": 0.9213,
    "normal": 0.0475
  },
  "malignant_probability": 0.9213
}
```
