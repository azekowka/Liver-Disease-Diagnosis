"use client";
import { useEffect, useMemo, useState } from "react";
import { Glyph } from "./Icon";

const STAGES = [
  { lbl: "Загрузка изображения", det: "формат · JPG / PNG" },
  { lbl: "Предобработка", det: "resize · нормализация" },
  { lbl: "CNN inference", det: "класс · вероятность" },
];

type Result =
  | { kind: "done"; predictedClass: string; isMalignant: boolean; confidence: number; malignantProbability: number; probabilities: Record<string, number>; filename: string }
  | { kind: "error"; msg: string };

export default function ParseProgress({
  file,
  reconnectName,
  onComplete,
  onClose,
}: {
  file?: File;
  reconnectId?: string;
  reconnectName?: string;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [stage, setStage] = useState(0);
  const [pct, setPct] = useState(2);
  const [pctTarget, setPctTarget] = useState(2);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, setPending] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  // Local preview of the uploaded image — created once per file, revoked on change/unmount.
  useEffect(() => {
    if (!file) { setImgUrl(null); return; }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setPct((p) => {
        const d = pctTarget - p;
        if (Math.abs(d) < 0.4) return pctTarget;
        raf = requestAnimationFrame(tick);
        return p + d * 0.1;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pctTarget]);

  useEffect(() => {
    let alive = true;

    async function runPrediction() {
      if (!file) return;
      setPending(true);
      setStage(0);
      setPctTarget(20);

      try {
        const form = new FormData();
        form.append("file", file);

        setStage(1);
        setPctTarget(60);

        const res = await fetch("/api/ultrasound/predict", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Prediction failed");
        }

        const data = await res.json();
        if (!alive) return;

        setStage(2);
        setPctTarget(100);
        setResult({
          kind: "done",
          predictedClass: data.predicted_class,
          isMalignant: data.is_malignant,
          confidence: data.confidence,
          malignantProbability: data.malignant_probability,
          probabilities: data.probabilities,
          filename: data.filename,
        });
        onComplete();
      } catch (e) {
        if (!alive) return;
        setResult({ kind: "error", msg: e instanceof Error ? e.message : "Не удалось обработать файл." });
      } finally {
        if (alive) setPending(false);
      }
    }

    runPrediction();
    return () => { alive = false; };
  }, [file, onComplete]);

  function cancel() {
    setCanceling(true);
    onComplete();
    onClose();
  }

  const displayName = file?.name || reconnectName || "изображение";
  const ext = (displayName.split(".").pop() || "").toUpperCase().slice(0, 4);
  const sizeKb = file
    ? (file.size < 1024 * 1024
        ? `${Math.max(1, Math.round(file.size / 1024))} КБ`
        : `${(file.size / 1024 / 1024).toFixed(1)} МБ`)
    : "возобновлено";
  const done = pct >= 99.5;
  const probabilityEntries = useMemo(() => {
    if (result?.kind !== "done") return [];
    return Object.entries(result.probabilities).sort((a, b) => b[1] - a[1]);
  }, [result]);

  return (
    <div className="pipe-pp" role="status" aria-live="polite">
      <div className="pipe-pp-head">
        <div className="pipe-pp-chip">
          <Glyph.docs size={18} />
          <span className="ext">{ext}</span>
        </div>
        <div className="pipe-pp-id">
          <div className="pipe-pp-name">{displayName}</div>
          <div className="pipe-pp-meta">{sizeKb} · анализ УЗИ печени</div>
        </div>
        {!result && (
          <button className="btn small pp-cancel" disabled={canceling} onClick={cancel}>
            <Glyph.x size={13} /> {canceling ? "Отмена…" : "Отменить"}
          </button>
        )}
        <div className="pipe-pp-pct">
          <b>{Math.round(pct)}%</b>
          <div className="l">{result ? "готово" : "обработка"}</div>
        </div>
      </div>

      <div className={`pipe-pp-bar ${done ? "full" : ""}`}><i style={{ width: `${pct}%` }} /></div>

      <div className="pp-body">
        <div className="pipe-pp-stages">
          {STAGES.map((s, i) => {
            const cls = result ? "done" : i < stage ? "done" : i === stage ? "active" : "";
            return (
              <div className={`pipe-stage ${cls}`} key={s.lbl}>
                <span className="mk">
                  {cls === "done" ? <Glyph.check size={13} /> : cls === "active" ? <span className="dot" /> : i + 1}
                </span>
                <div>
                  <div className="lbl">{s.lbl}</div>
                  <div className="det">{s.det}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pp-shot-pane">
          <div
            className={`pp-shot-frame ${
              result?.kind === "done" ? (result.isMalignant ? "verdict-warn" : "verdict-ok") : ""
            } ${result?.kind === "error" ? "verdict-error" : ""}`}
          >
            {imgUrl ? (
              <img className="pp-shot-img" src={imgUrl} alt="Превью загруженного УЗИ" />
            ) : (
              <div className="pp-shot-empty"><Glyph.scan size={28} /></div>
            )}
            {!result && <div className="pp-scan-tint" />}
            {!result && <div className="pp-scanline" />}
            {result?.kind === "done" && (
              <div className={`pp-shot-badge ${result.isMalignant ? "warn" : "ok"}`}>
                <Glyph.check size={15} />
              </div>
            )}
          </div>

          {!result && (
            <div className="pp-meter">
              <div className="pp-meter-head">
                <span><span className="pp-live" /> CNN inference</span>
                <b>{pending ? "идёт" : "ожидание"}</b>
              </div>
              <div className="pp-meter-bar"><i style={{ width: `${Math.round(pct)}%` }} /></div>
            </div>
          )}
        </div>
      </div>

      {result?.kind === "done" && (
        <div className="pipe-result">
          <div className="pipe-rcells">
            <div className="pipe-rcell hero">
              <div className="k">Класс</div>
              <div className="v">{result.predictedClass}</div>
            </div>
            <div className="pipe-rcell">
              <div className="k">Злокачественность</div>
              <div className="stat">{result.isMalignant ? "Да" : "Нет"}</div>
            </div>
            <div className="pipe-rcell">
              <div className="k">Уверенность</div>
              <div className="stat">{result.confidence.toFixed(2)}</div>
            </div>
          </div>

          <div className="pp-preview">
            <div className="pp-preview-head">Вероятности по классам</div>
            <div className="pp-preview-rows">
              {probabilityEntries.map(([name, value]) => (
                <div className="pp-pv-row" key={name}>
                  <div className="pp-pv-raw">{name}</div>
                  <div className="pp-pv-price">{value.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pipe-foot">
            <div className="spacer" />
            <button className="btn small primary" onClick={onClose}>Загрузить ещё</button>
          </div>
        </div>
      )}

      {result?.kind === "error" && (
        <div className="pipe-result">
          <div className="pipe-err">
            <b>Не удалось обработать файл.</b>
            <div className="msg">{result.msg}</div>
          </div>
          <div className="pipe-foot">
            <div className="spacer" />
            <button className="btn small" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}
