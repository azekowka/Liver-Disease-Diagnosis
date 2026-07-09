"use client";
import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { PageHead, Loading, ErrorNote } from "@/components/Bits";
import { Glyph } from "@/components/Icon";
import { Reveal } from "@/components/Motion";
import "@/app/discovery.css";

const fmt = (n: number) => n.toLocaleString("ru-RU");
const FMT: Record<string, string> = { xlsx: "Excel", xls: "Excel", docx: "Word", pdf: "PDF", scan_pdf: "скан" };
type SortKey = "items" | "auto" | "fresh" | "name";
const SORTS: [SortKey, string][] = [
  ["items", "по объёму"], ["auto", "по сопоставлению"], ["fresh", "по свежести"], ["name", "по имени"],
];

export default function PartnersPage() {
  const { data, error, loading } = useFetch(() => api.dashboardPartners(), []);
  const [sort, setSort] = useState<SortKey>("items");
  const t = data?.totals;

  const partners = (data?.partners ?? []).slice().sort((a, b) => {
    if (sort === "items") return b.items - a.items;
    if (sort === "auto") return b.auto_pct - a.auto_pct;
    if (sort === "fresh") return (b.latest_year ?? 0) - (a.latest_year ?? 0);
    return a.display_name.localeCompare(b.display_name, "ru");
  });

  return (
    <>
      <PageHead eyebrow="Партнёры" title="Клиники-партнёры">
        {t && <span className="muted" style={{ fontSize: 13, fontFamily: "var(--mono)" }}>{t.partners} клиник · {t.active} активных</span>}
      </PageHead>

      {loading && <Loading />}
      {error && <ErrorNote error={error} />}
    </>
  );
}
