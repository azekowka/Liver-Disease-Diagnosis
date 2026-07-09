import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DB_PATH = Path(__file__).resolve().parent.parent / "models" / "ultrasound_history.sqlite3"

_LIST_COLUMNS = (
    "id, filename, created_at, predicted_class, is_malignant, "
    "confidence, malignant_probability, probabilities"
)


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS ultrasound_history (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                created_at TEXT NOT NULL,
                predicted_class TEXT NOT NULL,
                is_malignant INTEGER NOT NULL,
                confidence REAL NOT NULL,
                malignant_probability REAL NOT NULL,
                probabilities TEXT NOT NULL,
                content_type TEXT NOT NULL,
                image BLOB NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_ultrasound_history_created_at "
            "ON ultrasound_history(created_at DESC)"
        )


def save_result(
    *,
    filename: str,
    content_type: str,
    image_bytes: bytes,
    predicted_class: str,
    is_malignant: bool,
    confidence: float,
    malignant_probability: float,
    probabilities: Dict[str, float],
) -> Dict[str, Any]:
    record_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO ultrasound_history "
            "(id, filename, created_at, predicted_class, is_malignant, confidence, "
            "malignant_probability, probabilities, content_type, image) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                record_id, filename, created_at, predicted_class, int(is_malignant),
                confidence, malignant_probability, json.dumps(probabilities),
                content_type or "image/jpeg", image_bytes,
            ),
        )
    return {"id": record_id, "created_at": created_at}


def list_history(limit: int = 100) -> List[Dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            f"SELECT {_LIST_COLUMNS} FROM ultrasound_history ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_record(record_id: str) -> Optional[Dict[str, Any]]:
    with _connect() as conn:
        row = conn.execute(
            f"SELECT {_LIST_COLUMNS} FROM ultrasound_history WHERE id = ?",
            (record_id,),
        ).fetchone()
    return _row_to_dict(row) if row else None


def get_image(record_id: str) -> Optional[Tuple[bytes, str]]:
    with _connect() as conn:
        row = conn.execute(
            "SELECT image, content_type FROM ultrasound_history WHERE id = ?",
            (record_id,),
        ).fetchone()
    return (row["image"], row["content_type"]) if row else None


def delete_record(record_id: str) -> bool:
    with _connect() as conn:
        cur = conn.execute("DELETE FROM ultrasound_history WHERE id = ?", (record_id,))
    return cur.rowcount > 0


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "filename": row["filename"],
        "created_at": row["created_at"],
        "predicted_class": row["predicted_class"],
        "is_malignant": bool(row["is_malignant"]),
        "confidence": row["confidence"],
        "malignant_probability": row["malignant_probability"],
        "probabilities": json.loads(row["probabilities"]),
    }
