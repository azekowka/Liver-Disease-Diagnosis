"""One-off training script for the tabular liver-panel model.

Loads LD_raw_data.csv, trains a RandomForestClassifier, and saves a
joblib bundle to models/tabular/liver_lab_model.pkl for backend/lab_model.py
to load at inference time.

Run from the backend/ directory:
    python train_tabular_model.py
"""
import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "LD_raw_data.csv"
OUT_PATH = BASE_DIR / "models" / "tabular" / "liver_lab_model.pkl"

FEATURE_COLUMNS = [
    "Age", "Gender", "Total Bilirubin", "Direct Bilirubin",
    "Alkphos Alkaline Phosphotase", "Sgpt Alamine Aminotransferase",
    "Sgot Aspartate Aminotransferase", "Total Protiens",
    "ALB Albumin", "A/G Ratio Albumin and Globulin Ratio",
]
TARGET_COLUMN = "Diagnosis"


def main() -> None:
    data = pd.read_csv(DATA_PATH)

    medians = data[FEATURE_COLUMNS].median().to_dict()
    data[FEATURE_COLUMNS] = data[FEATURE_COLUMNS].fillna(medians)

    X, y = data[FEATURE_COLUMNS], data[TARGET_COLUMN]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=300, max_depth=12, class_weight="balanced", random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")
    print(classification_report(y_test, y_pred, digits=4))

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "model": model,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "medians": medians,
        "positive_label_meaning": "liver disease present",
        "trained_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
    joblib.dump(bundle, OUT_PATH)
    print(f"Saved bundle to {OUT_PATH}")


if __name__ == "__main__":
    main()
