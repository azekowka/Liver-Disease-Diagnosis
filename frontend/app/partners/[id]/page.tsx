"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, fmtKzt } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import type { ServicePrice } from "@/lib/types";
import { TIER_LABELS } from "@/lib/types";
import { Loading, ErrorNote, StatusBadge } from "@/components/Bits";
import { Glyph } from "@/components/Icon";
import { Reveal } from "@/components/Motion";
import "@/app/discovery.css";

export const dynamic = "force-dynamic";

export default function PartnerDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const name = useSearchParams().get("name") || "Прайс-лист клиники";
  const { data, error, loading } = useFetch(() => api.partnerServices(id), [id]);
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    if (!data) return [];
    const filtered = q
      ? data.filter((d) => d.raw_name.toLowerCase().includes(q.toLowerCase()))
      : data;
    const map = new Map<string, ServicePrice[]>();
    for (const it of filtered) {
      const k = it.category || "Без категории";
      (map.get(k) ?? map.set(k, []).get(k)!).push(it);
    }
    return [...map.entries()];
  }, [data, q]);

  return (
    <>
      <div className="disc-back"><Link href="/partners"><Glyph.arrow size={13} className="disc-flip" /> к партнёрам</Link></div>

      <div className="page-head">
        <div>
          <div className="eyebrow">Партнёр · прайс-лист</div>
          <h1>{name}</h1>
        </div>
        {data && <span className="badge ink">{data.length} позиций</span>}
      </div>

      {loading && <Loading />}
      {error && <ErrorNote error={error} />}

      {data && (
        <>
          <div className="field disc-pd-filter">
            <span style={{ display: "grid", placeItems: "center", paddingLeft: 14, color: "var(--muted)" }}><Glyph.find size={16} /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="фильтр по услуге в прайсе…" />
          </div>

          {groups.map(([cat, items], gi) => (
            <Reveal dir="up" delay={Math.min(gi * 40, 240)} key={cat} className="disc-pd-group">
              <div className="disc-pd-grouphead">
                <span className="disc-gh-name">{cat}</span>
                <span className="disc-gh-count">{items.length}</span>
                <span className="disc-gh-rule" />
              </div>
              <div className="disc-pd-list">
                {items.map((it, i) => (
                  <div className="disc-pd-item" key={i}>
                    <div className="disc-pd-raw">{it.raw_name}</div>
                    <div className="disc-pd-status"><StatusBadge status={it.match_status} /></div>
                    <div className="disc-pd-tiers">
                      {it.tiers.length ? it.tiers.map((t, j) => (
                        <span key={j} className="disc-tierbadge" title={t.label_raw || ""}>
                          <span className="disc-tb-k">{TIER_LABELS[t.tier_type] ?? t.tier_type}</span>
                          <span className="disc-tb-v">{fmtKzt(t.amount_kzt)}</span>
                        </span>
                      )) : <span className="muted">—</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
          {groups.length === 0 && <div className="empty">Ничего не найдено</div>}
        </>
      )}
    </>
  );
}
