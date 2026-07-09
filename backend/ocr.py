"""Extract text from an uploaded lab-panel PDF/image and parse the 10 model fields.

PDF text layer is read directly via PyMuPDF (fast, no OCR needed for
digitally generated reports). Scanned PDFs (no text layer) and plain
image uploads fall back to EasyOCR.
"""
import datetime
import io
import logging
import re
import sys
import threading
from typing import Any, Dict, List, Optional

import fitz  # PyMuPDF
import numpy as np
from PIL import Image

from lab_model import FIELD_META

logger = logging.getLogger(__name__)

# EasyOCR's model-download progress bar prints Unicode block characters;
# on Windows the console defaults to a codepage (e.g. cp1252) that can't
# encode them, which crashes the download outright. Force UTF-8 output.
if sys.platform == "win32":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

MIN_TEXT_LEN_PER_PAGE = 20  # below this, treat the PDF page as scanned and OCR it

_reader = None
_reader_lock = threading.Lock()


def _get_ocr_reader():
    global _reader
    if _reader is None:
        with _reader_lock:
            if _reader is None:
                import easyocr
                logger.info("Loading EasyOCR reader (ru+en)...")
                _reader = easyocr.Reader(["ru", "en"], gpu=False)
                logger.info("EasyOCR reader ready.")
    return _reader


def warm_up() -> None:
    """Load the (slow, CPU-bound) EasyOCR reader eagerly so the first real
    upload doesn't pay the cold-start cost — call from a background thread
    at app startup, not on the request path."""
    try:
        _get_ocr_reader()
    except Exception:
        logger.exception("EasyOCR warm-up failed; will retry lazily on first request.")


def _ocr_image(image: Image.Image) -> str:
    reader = _get_ocr_reader()
    arr = np.array(image.convert("RGB"))
    lines = reader.readtext(arr, detail=0, paragraph=True)
    return "\n".join(lines)


def extract_text(filename: str, content_type: Optional[str], data: bytes) -> str:
    is_pdf = (filename or "").lower().endswith(".pdf") or content_type == "application/pdf"

    if is_pdf:
        text_parts: List[str] = []
        doc = fitz.open(stream=data, filetype="pdf")
        try:
            for page in doc:
                page_text = page.get_text().strip()
                if len(page_text) >= MIN_TEXT_LEN_PER_PAGE:
                    text_parts.append(page_text)
                else:
                    pix = page.get_pixmap(dpi=200)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    text_parts.append(_ocr_image(img))
        finally:
            doc.close()
        return "\n".join(text_parts)

    image = Image.open(io.BytesIO(data))
    return _ocr_image(image)


_NUMBER_RE = r"(-?\d{1,4}(?:[.,]\d{1,3})?)"

# Gender is usually written as a word/letter (М/Ж, Male/Female), not "0"/"1".
_MALE_WORDS = r"(?:мужской|муж\.?|male|m)\b"
_FEMALE_WORDS = r"(?:женский|жен\.?|female|f|ж)\b"


def _parse_gender(normalized: str, synonyms: List[str]) -> Optional[float]:
    for synonym in synonyms:
        pattern = r"\b" + re.escape(synonym.lower()) + r"\b\s*[:\-]?\s*(" + _MALE_WORDS + "|" + _FEMALE_WORDS + ")"
        match = re.search(pattern, normalized)
        if match:
            token = match.group(1)
            return 1.0 if re.fullmatch(_FEMALE_WORDS, token) else 0.0
    return None


_DATE_RE = r"(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})"


def _parse_age_from_birth_date(normalized: str, synonyms: List[str]) -> Optional[float]:
    """Many lab forms print a birth date instead of an age directly."""
    for synonym in synonyms:
        pattern = r"\b" + re.escape(synonym.lower()) + r"\b[\s\S]{0,20}?" + _DATE_RE
        match = re.search(pattern, normalized)
        if match:
            birth_year = int(match.group(3))
            age = datetime.date.today().year - birth_year
            if 0 < age <= 120:
                return float(age)
    return None


# PDF text extraction (and some OCR output) represents inter-word spacing
# with non-breaking or other Unicode space variants instead of a plain
# U+0020 " " — a literal multi-word synonym like "год рождения" would
# otherwise never match against "год\xa0рождения". Normalize them all away.
_SPACE_CODEPOINTS = [0x09, 0xA0] + list(range(0x2000, 0x200B)) + [0x202F, 0x3000]
_SPACE_VARIANTS = {cp: " " for cp in _SPACE_CODEPOINTS}


def parse_lab_fields(text: str) -> Dict[str, Any]:
    normalized = text.lower().translate(_SPACE_VARIANTS)
    results: Dict[str, Any] = {}

    for meta in FIELD_META:
        found_value = None

        if meta["type"] == "select":
            found_value = _parse_gender(normalized, meta["synonyms"])
        else:
            for synonym in meta["synonyms"]:
                # [\s\S] (not .) so the window can cross line breaks — OCR on
                # tabular reports usually puts each cell on its own line, so
                # the value is often a newline or two after its label.
                pattern = r"\b" + re.escape(synonym.lower()) + r"\b" + r"[\s\S]{0,50}?" + _NUMBER_RE
                match = re.search(pattern, normalized)
                if match:
                    raw = match.group(1).replace(",", ".")
                    try:
                        found_value = float(raw)
                    except ValueError:
                        continue
                    break

            if found_value is None and meta.get("birth_date_synonyms"):
                found_value = _parse_age_from_birth_date(normalized, meta["birth_date_synonyms"])

        results[meta["key"]] = {"value": found_value, "found": found_value is not None}

    return results


def extract_and_parse(filename: str, content_type: Optional[str], data: bytes) -> Dict[str, Any]:
    text = extract_text(filename, content_type, data)
    fields = parse_lab_fields(text)
    return {"fields": fields, "raw_text": text}
