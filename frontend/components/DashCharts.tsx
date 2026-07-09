"use client";
import * as React from "react";
import Link from "next/link";
import type { DashboardDocs, DocBreakdown } from "@/lib/types";
import { useInView } from "@/lib/motion";
import { Counter } from "@/components/Motion";

const fmt = (n: number) => n.toLocaleString("ru-RU");
const pct = (v: number, t: number) => (t ? (v / t) * 100 : 0);

const METHOD_LABEL: Record<string, string> = {
  xlsx: "таблица", xls: "таблица", docx: "Word", pdf_text: "текст", pdf_ocr: "скан · OCR",
};
const FORMAT_LABEL: Record<string, string> = { xlsx: "Excel", xls: "Excel", docx: "Word", pdf: "PDF", scan_pdf: "скан" };

type Seg = { color: string; label: string; value: number };

/* ============================================================
   Normalization — draw-in donut + confidence ledger
   ============================================================ */
export function NormDonut({
  n, total,
}: {
  n: { auto: number; review: number; unmatched: number; manual: number; auto_match_pct: number };
  total: number;
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.35 });
  const r = 64, C = 2 * Math.PI * r, SW = 16;
  const segs: Seg[] = [
    { color: "var(--chart-auto)", label: "Авто", value: n.auto },
    { color: "var(--amber)", label: "На ревью", value: n.review },
    { color: "var(--oxblood)", label: "Без совпадения", value: n.unmatched },
    { color: "var(--ink)", label: "Вручную", value: n.manual },
  ];
  let acc = 0;
  const arcs = segs.map((s) => {
    const len = (pct(s.value, total) / 100) * C;
    const off = acc;
    acc += len;
    return { ...s, len, off };
  });

  return (
    <div className="dsh-norm" ref={ref}>
      <div className="dsh-donut">
        <svg viewBox="0 0 160 160" aria-hidden>
          <circle cx="80" cy="80" r={r} fill="none" stroke="var(--paper-3)" strokeWidth={SW} />
          {arcs.map((a, i) => (
            <circle
              key={i}
              className="arc"
              cx="80" cy="80" r={r} fill="none"
              stroke={a.color} strokeWidth={SW} strokeLinecap="butt"
              strokeDasharray={inView ? `${a.len} ${C - a.len}` : `0 ${C}`}
              strokeDashoffset={-a.off}
              style={{ transitionDelay: `${i * 130}ms` }}
            />
          ))}
        </svg>
        <div className="center">
          <div className="pct">
            <Counter value={n.auto_match_pct} decimals={1} />
            <span className="u">%</span>
          </div>
          <div className="cap">авто</div>
        </div>
      </div>

      <div className="dsh-ledger">
        {arcs.map((a, i) => (
          <div className="dsh-lrow" key={i}>
            <span className="lbl"><span className="sw" style={{ background: a.color }} />{a.label}</span>
            <span className="nums">
              <b><Counter value={a.value} /></b> · {Math.round(pct(a.value, total))}%
            </span>
            <span className="track">
              <i style={{ width: inView ? `${pct(a.value, total)}%` : 0, background: a.color, transitionDelay: `${i * 90}ms` }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Provenance — extraction methods (vision-rescued scans = accent)
   ============================================================ */
export function Provenance({ byMethod }: { byMethod: Record<string, number> }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });
  const tables = (byMethod.xlsx || 0) + (byMethod.xls || 0);
  const text = (byMethod.docx || 0) + (byMethod.pdf_text || 0);
  const scan = byMethod.pdf_ocr || 0;
  const total = tables + text + scan || 1;
  const segs: Seg[] = [
    { color: "var(--chart-auto)", label: "Таблицы", value: tables },
    { color: "var(--ink)", label: "Текст · Word", value: text },
    { color: "var(--accent)", label: "Сканы · OCR-Vision", value: scan },
  ];
  const scanPct = Math.round(pct(scan, total));

  return (
    <div className="dsh-prov" ref={ref}>
      <div className="dsh-seg">
        {segs.map((s, i) => s.value > 0 && (
          <i key={i} style={{ width: inView ? `${pct(s.value, total)}%` : 0, background: s.color, transitionDelay: `${i * 110}ms` }} />
        ))}
      </div>
      <div className="dsh-provlegend">
        {segs.map((s, i) => (
          <div className="dsh-pleg" key={i}>
            <span className="sw" style={{ background: s.color }} />
            <span className="nm">{s.label}</span>
            <span className="pc">{Math.round(pct(s.value, total))}%</span>
            <span className="ct"><Counter value={s.value} /></span>
          </div>
        ))}
      </div>
      <div className="dsh-note">
        Сканы разбираются <span className="lead">vision-моделью</span> в структурные строки.
        Иначе <span className="hl">~{scanPct || 21}%</span> позиций терялось бы при простом OCR.
      </div>
    </div>
  );
}

/* ============================================================
   Document ledger — per-document intake rows
   ============================================================ */
function LedgerRow({ d, idx }: { d: DocBreakdown; idx: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.5 });
  const t = d.items || 1;
  const autoPct = Math.round(pct(d.auto, t));
  const segs: Seg[] = [
    { color: "var(--chart-auto)", label: "auto", value: d.auto },
    { color: "var(--amber)", label: "review", value: d.review },
    { color: "var(--oxblood)", label: "unmatched", value: d.unmatched },
    { color: "var(--ink)", label: "manual", value: d.manual },
  ];
  const methods = Object.entries(d.methods).sort((a, b) => b[1] - a[1]);

  return (
    <div className="dsh-doc" ref={ref}>
      <div className="dsh-dhead">
        <span className="dsh-idx">{String(idx + 1).padStart(2, "0")}</span>
        <a className="dsh-dname" href={`/api/documents/${d.id}/file`} target="_blank" rel="noopener noreferrer" title={`Открыть исходник: ${d.source_filename}`}>
          {d.source_filename}
          <svg className="dsh-open" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7M9 7h8v8" /></svg>
        </a>
        <span className="badge">{FORMAT_LABEL[d.file_format] || d.file_format}</span>
        {d.partner_name && <span className="dsh-dpart">{d.partner_name}</span>}
        {methods.map(([m, v]) => (
          <span className="dsh-mtag" key={m}>{METHOD_LABEL[m] || m} · {fmt(v)}</span>
        ))}
        <span className="spacer" />
        <span className="dsh-dtotal">{fmt(d.items)} поз</span>
        <span className="dsh-dauto" style={{ color: autoPct >= 60 ? "var(--chart-auto)" : "var(--amber)" }}>{autoPct}% авто</span>
      </div>
      <div className="dsh-dbarrow">
        <span className="dsh-dbar">
          {segs.map((s, i) => s.value > 0 && (
            <i key={i} style={{ width: inView ? `${pct(s.value, t)}%` : 0, background: s.color, transitionDelay: `${i * 70}ms` }} />
          ))}
        </span>
        <span className="dsh-dcount">
          авто {fmt(d.auto)} · ревью {fmt(d.review)} · без&nbsp;совп. {fmt(d.unmatched)}
          {d.flagged ? <> · <span className="flg">на валидации {fmt(d.flagged)}</span></> : null}
        </span>
      </div>
    </div>
  );
}

export function DocLedger({ docs }: { docs: DocBreakdown[] }) {
  return (
    <div className="dsh-docs">
      {docs.map((d, i) => <LedgerRow key={d.id} d={d} idx={i} />)}
    </div>
  );
}

/* ============================================================
   Top categories — width animates in on view
   ============================================================ */
export function CategoryBars({ cats }: { cats: DashboardDocs["by_category"] }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.25 });
  const max = Math.max(1, ...cats.map((c) => c.items));
  return (
    <div className="dsh-cats" ref={ref}>
      {cats.map((c, i) => (
        <Link className="dsh-cat" href={`/services?category=${encodeURIComponent(c.category)}`} key={c.category} title={`Открыть услуги: ${c.category}`}>
          <span className="rk">{String(i + 1).padStart(2, "0")}</span>
          <span className="nm">{c.category}</span>
          <span className="track">
            <i style={{ width: inView ? `${(c.items / max) * 100}%` : 0, transitionDelay: `${i * 55}ms` }} />
          </span>
          <span className="ct">{fmt(c.items)}</span>
        </Link>
      ))}
    </div>
  );
}
