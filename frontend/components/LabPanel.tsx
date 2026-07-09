"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { LabFieldMeta, LabPredictInput, LabPredictResult } from "@/lib/types";
import { Meter, Loading } from "./Bits";
import { Glyph } from "./Icon";
import { AmbientField } from "./Motion";

const HISTORY_KEY = "medarchive:labHistory";
const HISTORY_LIMIT = 20;

type HistoryEntry = {
  id: string;
  at: string;
  source: string;
  result: LabPredictResult;
};

type FormState = Record<string, string>;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  } catch { /* ignore quota errors */ }
}

function emptyForm(fields: LabFieldMeta[]): FormState {
  const out: FormState = {};
  for (const f of fields) out[f.key] = "";
  return out;
}

export default function LabPanel() {
  const [fields, setFields] = useState<LabFieldMeta[] | null>(null);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);
  const [foundKeys, setFoundKeys] = useState<Set<string>>(new Set());
  const [rawText, setRawText] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({});
  const [showForm, setShowForm] = useState(false);

  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [result, setResult] = useState<LabPredictResult | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    api.labFields()
      .then((r) => { setFields(r.fields); setForm(emptyForm(r.fields)); })
      .catch((e) => setFieldsError(String(e?.message || e)));
  }, []);

  function resetAll() {
    setExtractError(null);
    setSourceLabel(null);
    setFoundKeys(new Set());
    setRawText(null);
    setResult(null);
    setPredictError(null);
    setShowForm(false);
    if (fields) setForm(emptyForm(fields));
  }

  async function handleFile(file: File) {
    resetAll();
    setExtracting(true);
    setSourceLabel(file.name);
    try {
      const res = await api.labExtract(file);
      const next: FormState = { ...(fields ? emptyForm(fields) : {}) };
      const found = new Set<string>();
      for (const [key, f] of Object.entries(res.fields)) {
        if (f.found && f.value !== null) {
          next[key] = String(f.value);
          found.add(key);
        }
      }
      setForm(next);
      setFoundKeys(found);
      setRawText(res.raw_text || null);
      setShowForm(true);
    } catch (e) {
      setExtractError(String((e as Error)?.message || e));
      setShowForm(true); // fall back to manual completion
    } finally {
      setExtracting(false);
    }
  }

  function startManual() {
    resetAll();
    setSourceLabel("Введено вручную");
    setShowForm(true);
  }

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const missingKeys = useMemo(() => {
    if (!fields) return [];
    return fields.filter((f) => form[f.key] === undefined || form[f.key] === "").map((f) => f.key);
  }, [fields, form]);

  async function submit() {
    if (!fields || missingKeys.length > 0) return;
    setPredicting(true);
    setPredictError(null);
    try {
      const payload = Object.fromEntries(
        fields.map((f) => [f.key, parseFloat(form[f.key])])
      ) as unknown as LabPredictInput;
      const res = await api.labPredict(payload);
      setResult(res);
      const entry: HistoryEntry = {
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        source: sourceLabel || (mode === "upload" ? "Файл" : "Вручную"),
        result: res,
      };
      const nextHistory = [entry, ...history].slice(0, HISTORY_LIMIT);
      setHistory(nextHistory);
      saveHistory(nextHistory);
    } catch (e) {
      setPredictError(String((e as Error)?.message || e));
    } finally {
      setPredicting(false);
    }
  }

  if (fieldsError) {
    return (
      <div className="panel pad" style={{ borderColor: "var(--oxblood)", color: "var(--oxblood)" }}>
        <b>Нет связи с API.</b> <span className="mono" style={{ fontSize: 13 }}>{fieldsError}</span>
      </div>
    );
  }

  if (!fields) return <Loading what="Загрузка полей модели" />;

  return (
    <div className="lab-panel">
      <div className="seg-toggle lab-modes">
        <button
          className={mode === "upload" ? "on" : ""}
          onClick={() => { setMode("upload"); resetAll(); }}
        >
          <Glyph.scan size={14} /> Загрузить файл
        </button>
        <button
          className={mode === "manual" ? "on" : ""}
          onClick={() => { setMode("manual"); startManual(); }}
        >
          <Glyph.plus size={14} /> Ввести вручную
        </button>
      </div>

      {mode === "upload" && !showForm && !extracting && (
        <div
          className={`pipe-drop lab-drop ${over ? "over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <AmbientField />
          <div className="pipe-drop-glyph"><Glyph.upload size={40} /></div>
          <div className="pipe-drop-main">
            <div className="pipe-kicker">Загрузка · 01</div>
            <h2>Перетащите PDF или фото печёночной пробы</h2>
            <div className="sub">
              {over ? "Отпустите — начнём распознавание." : "OCR распознает возраст, пол и 8 биохимических показателей."}
            </div>
            <div className="cta-row">
              <button className="btn pipe-pick" onClick={() => inputRef.current?.click()}>
                <Glyph.scan size={15} /> Выбрать файл
              </button>
              <span className="hint">форматы <span className="kbd">PDF</span> <span className="kbd">JPG</span> <span className="kbd">PNG</span></span>
            </div>
            <input
              ref={inputRef} type="file" hidden
              accept=".pdf,image/*"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>
          <div className="pipe-drop-aside">
            <div className="pipe-fmts">
              <div className="pipe-fmt">
                <span className="ic"><Glyph.docs size={17} /></span>
                <span className="nm">PDF-выписка<small>текст или скан</small></span>
                <span className="ext">.pdf</span>
              </div>
              <div className="pipe-fmt">
                <span className="ic"><Glyph.scan size={17} /></span>
                <span className="nm">Фото бланка<small>OCR</small></span>
                <span className="ext">.jpg · .png</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {extracting && (
        <div className="panel pad lab-extracting">
          <Loading what={`Распознаём «${sourceLabel}»`} />
          <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
            OCR читает документ и ищет 10 показателей. Обычно это занимает несколько секунд.
          </div>
        </div>
      )}

      {showForm && (
        <div className="panel pad lab-review">
          <div className="between lab-review-head">
            <div>
              <div className="section-title" style={{ margin: "0 0 4px" }}>Проверьте данные</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {sourceLabel}{mode === "upload" && !extractError && ` · распознано ${foundKeys.size} из ${fields.length}`}
              </div>
            </div>
            <button className="btn small" onClick={resetAll}><Glyph.x size={13} /> Начать заново</button>
          </div>

          {extractError && (
            <div className="pipe-note warn" style={{ marginTop: 12 }}>
              <span className="ic"><Glyph.info size={14} /></span>
              Не удалось распознать файл автоматически ({extractError}). Заполните значения вручную.
            </div>
          )}

          <div className="lab-form-grid">
            {fields.map((f) => (
              <label className={`lab-field ${foundKeys.has(f.key) ? "auto" : ""}`} key={f.key}>
                <span className="lbl">
                  {f.label_ru}{f.unit ? <span className="unit"> · {f.unit}</span> : null}
                  {foundKeys.has(f.key) && <span className="badge green lab-ocr-badge">OCR</span>}
                </span>
                {f.type === "select" ? (
                  <select
                    className="input"
                    value={form[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                  >
                    <option value="" disabled>Выберите…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label_ru}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input"
                    type="number"
                    step={f.step ?? "any"}
                    min={f.min}
                    max={f.max}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.min !== undefined && f.max !== undefined ? `${f.min}–${f.max}` : undefined}
                  />
                )}
              </label>
            ))}
          </div>

          {rawText && (
            <details className="lab-raw">
              <summary>Показать распознанный текст</summary>
              <pre>{rawText}</pre>
            </details>
          )}

          {predictError && (
            <div className="pipe-err" style={{ marginTop: 14 }}>
              <b>Не удалось получить вердикт.</b>
              <div className="msg">{predictError}</div>
            </div>
          )}

          <div className="lab-review-foot">
            <span className="muted" style={{ fontSize: 12.5 }}>
              {missingKeys.length > 0 ? `Не заполнено полей: ${missingKeys.length}` : "Все поля заполнены"}
            </span>
            <button className="btn primary" disabled={missingKeys.length > 0 || predicting} onClick={submit}>
              {predicting ? "Анализируем…" : "Получить вердикт"}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`panel pad lab-verdict ${result.prediction === 1 ? "disease" : "healthy"}`}>
          <div className="pipe-rcells" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
            <div className="pipe-rcell hero">
              <div className="k">Вердикт модели</div>
              <div className="v" style={{ fontSize: 26 }}>{result.label_ru}</div>
            </div>
            <div className="pipe-rcell">
              <div className="k">Вероятность заболевания</div>
              <div className="stat" style={{ marginTop: 11 }}>
                <Meter score={result.probability_disease} />
              </div>
            </div>
          </div>
          <div className="lab-disclaimer">
            <Glyph.info size={14} />
            Результат — это статистическая оценка модели RandomForest, а не медицинский диагноз.
            Для точной интерпретации проконсультируйтесь с врачом.
          </div>
          <div className="pipe-foot">
            <div className="spacer" />
            <button className="btn small primary" onClick={() => { resetAll(); setMode("upload"); }}>Новый анализ</button>
          </div>
        </div>
      )}

      <div className="section-title">История анализов</div>
      {history.length === 0 ? (
        <div className="empty">Здесь появится история пройденных анализов этой сессии.</div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Источник</th>
                <th style={{ width: 160 }}>Время</th>
                <th style={{ width: 220 }}>Вердикт</th>
                <th style={{ width: 140 }} className="num">Вероятность</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="pipe-doc-name">{h.source}</td>
                  <td className="muted mono" style={{ fontSize: 12.5 }}>{new Date(h.at).toLocaleString("ru-RU")}</td>
                  <td><span className={`badge ${h.result.prediction === 1 ? "ox" : "green"}`}>{h.result.label_ru}</span></td>
                  <td className="num mono">{(h.result.probability_disease * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
