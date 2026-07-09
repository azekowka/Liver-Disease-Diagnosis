"use client";
import "./dashboard.css";
import Link from "next/link";
import { useInView } from "@/lib/motion";
import { PageHead, Loading, ErrorNote } from "@/components/Bits";
import { Reveal, Counter } from "@/components/Motion";
import { Glyph } from "@/components/Icon";
import { NormDonut, Provenance, DocLedger, CategoryBars } from "@/components/DashCharts";

const fmt = (n: number) => n.toLocaleString("ru-RU");

/** Thin confidence meter under the lead stat — fills on view. */
function LeadMeter({ value }: { value: number }) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 });
  return (
    <div className="dsh-meter" ref={ref} aria-hidden>
      <i style={{ width: inView ? `${Math.max(0, Math.min(100, value))}%` : 0 }} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <>
      <PageHead eyebrow="Машинное обучение" title="Методология">
      </PageHead>
    </>
  );
}
