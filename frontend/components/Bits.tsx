import * as React from "react";
import { useEffect, useState } from "react";
import type { Tier } from "@/lib/types";
import { TIER_LABELS } from "@/lib/types";
import { fmtKzt } from "@/lib/api";

export function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function statusClass(status: string): string {
  if (["done", "auto", "manual"].includes(status)) return "green";
  if (["needs_review", "review", "queued", "processing"].includes(status)) return "amber";
  if (["error", "unmatched"].includes(status)) return "ox";
  return "";
}

const STATUS_RU: Record<string, string> = {
  done: "готов", needs_review: "на ревью", queued: "в очереди", processing: "обработка",
  error: "ошибка", auto: "авто", manual: "вручную", review: "ревью", unmatched: "нет совпадения",
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${statusClass(status)}`}>{STATUS_RU[status] ?? status}</span>;
}

export function PriceTiers({ tiers }: { tiers: Tier[] }) {
  if (!tiers?.length) return <span className="muted">—</span>;
  return (
    <div>
      {tiers.map((t, i) => (
        <div className="tier" key={i}>
          <span className="lbl">
            <span className="tier-key">{TIER_LABELS[t.tier_type] ?? t.tier_type}</span>
          </span>
          <span className="amt">{fmtKzt(t.amount_kzt)}</span>
        </div>
      ))}
    </div>
  );
}

/** Confidence meter — the product's signature readout. score in [0,1].
 *  The fill grows from 0 on mount, so the bar "reads out" its confidence. */
export function Meter({ score, showVal = true }: { score: number; showVal?: boolean }) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  const band = score >= 0.85 ? "hi" : score >= 0.6 ? "mid" : "lo";
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <span className={`meter ${band}`} role="meter" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <span className="track"><span className="fill" style={{ width: `${w}%` }} /></span>
      {showVal && <span className="val">{score.toFixed(2)}</span>}
    </span>
  );
}

export function Loading({ what = "Загрузка" }: { what?: string }) {
  return <div className="loading">{what}…</div>;
}

export function ErrorNote({ error }: { error: string }) {
  return (
    <div className="panel pad" style={{ borderColor: "var(--oxblood)", color: "var(--oxblood)" }}>
      <b>Нет связи с API.</b> <span className="mono" style={{ fontSize: 13 }}>{error}</span>
      <div className="muted" style={{ marginTop: 8, fontSize: 13, color: "var(--ink-2)" }}>
        Запусти бэкенд на <span className="kbd">localhost:8000</span> (см. README). Фронтенд проксирует <span className="kbd">/api</span> → бэкенд.
      </div>
    </div>
  );
}
