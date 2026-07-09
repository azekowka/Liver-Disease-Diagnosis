"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Meter } from "./Bits";
import { Glyph } from "./Icon";

/* The hero instrument. A messy source line — scan, spreadsheet or Word —
   is read, matched against the service dictionary, and resolves into one
   canonical service with a confidence score and the method that found it.
   The swap runs as a small machine: scan → match → settle. */

type Kind = "scan" | "table" | "doc";

type Ex = {
  tab: string;
  fmt: string;
  kind: Kind;
  raw: string;
  meta: string[];
  canon: string;
  cat: string;
  score: number;
  method: string;
};

const EXAMPLES: Ex[] = [
  {
    tab: "Скан",
    fmt: "scan_kardio.pdf",
    kind: "scan",
    raw: "А02.020.000.2  Приём кардиолога, первичн.",
    meta: ["код A02.020.000", "OCR · rus"],
    canon: "Приём (осмотр, консультация) врача-кардиолога первичный",
    cat: "Кардиология",
    score: 1.0,
    method: "код-в-код",
  },
  {
    tab: "Excel",
    fmt: "price_2024.xlsx",
    kind: "table",
    raw: "Узи орг.бр.пол + почки",
    meta: ["лист «Прайс»", "ячейка B214"],
    canon: "УЗИ органов брюшной полости и почек",
    cat: "Ультразвук",
    score: 0.92,
    method: "семантика",
  },
  {
    tab: "Word",
    fmt: "uslugi.docx",
    kind: "doc",
    raw: "ОАК (5 diff) развёрн.",
    meta: ["правки в тексте", "абзац 38"],
    canon: "Общий анализ крови (5 diff), развёрнутый",
    cat: "Лаборатория",
    score: 0.88,
    method: "семантика",
  },
  {
    tab: "Скан",
    fmt: "lab_scan.pdf",
    kind: "scan",
    raw: "Дисбактериоз кишечн. (микрофлора)",
    meta: ["категория: —", "OCR · низкое DPI"],
    canon: "Исследование микрофлоры кишечника (дисбактериоз)",
    cat: "Лаборатория",
    score: 0.74,
    method: "на ревью",
  },
];

const KIND_ICON: Record<Kind, ReactNode> = {
  scan: <Glyph.scan size={13} />,
  table: <Glyph.table size={13} />,
  doc: <Glyph.docs size={13} />,
};

export default function Reconcile() {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"scan" | "done">("done");

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setPhase("done");
      return;
    }
    setPhase("scan");
    const t1 = setTimeout(() => setPhase("done"), 920);
    const t2 = setTimeout(() => setI((x) => (x + 1) % EXAMPLES.length), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [i]);

  const ex = EXAMPLES[i];
  const auto = ex.score >= 0.85;
  const onReview = ex.method === "на ревью";
  const verdictColor = onReview ? "var(--amber)" : "var(--accent-ink)";

  return (
    <div className={`lp2-rec ${phase === "scan" ? "is-scan" : "is-done"}`}>
      <div className="lp2-rec-chrome" aria-hidden>
        <span className="lp2-rec-dots"><i /><i /><i /></span>
        <span className="lp2-rec-file">
          {KIND_ICON[ex.kind]} {ex.fmt}
        </span>
        <span className="lp2-rec-live">
          <i /> live
        </span>
      </div>

      <div className="lp2-rec-tabs" role="tablist" aria-label="Источник">
        {EXAMPLES.map((e, idx) => (
          <button
            key={e.fmt}
            type="button"
            role="tab"
            aria-selected={idx === i}
            className={`lp2-rec-tab ${idx === i ? "on" : ""}`}
            onClick={() => setI(idx)}
          >
            {e.tab}
          </button>
        ))}
      </div>

      <div className="lp2-rec-stage" aria-live="polite">
        <div className="lp2-rec-scanline" aria-hidden />

        <div className="lp2-rec-col" key={`src-${i}`}>
          <div className="lp2-rec-cap">Строка источника</div>
          <div className="lp2-rec-raw">
            <div className="lp2-rec-line">{ex.raw}</div>
            <div className="lp2-rec-meta">
              {ex.meta.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="lp2-rec-flow" aria-hidden>
          <span className="lp2-rec-spark" />
          <Glyph.arrow size={20} />
        </div>

        <div className="lp2-rec-col" key={`canon-${i}`}>
          <div className="lp2-rec-cap">Услуга справочника</div>
          <div className="lp2-rec-canon">
            <div className="lp2-rec-line">{ex.canon}</div>
            <div className="lp2-rec-meta">
              <span className="lp2-rec-cat">
                <Glyph.tag size={11} /> {ex.cat}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lp2-rec-foot">
        {phase === "scan" ? (
          <span className="lp2-rec-working">
            <Glyph.reconcile size={13} /> сопоставление со справочником…
          </span>
        ) : (
          <span className="lp2-rec-verdict" style={{ color: verdictColor }}>
            {onReview ? <Glyph.review size={13} /> : <Glyph.check size={13} />}
            {auto ? "Авто" : "На ревью"} · {ex.method}
          </span>
        )}
        <span className={`lp2-rec-meter ${phase === "scan" ? "muted-out" : ""}`}>
          <Meter score={ex.score} key={`m-${i}-${phase}`} />
        </span>
      </div>
    </div>
  );
}
