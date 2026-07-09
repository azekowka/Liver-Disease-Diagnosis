"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glyph } from "./Icon";

const NAV = [
  { href: "/dashboard", label: "Методология", icon: Glyph.board },
  { href: "/documents", label: "Диагностика печеночных проб", icon: Glyph.docs },
  { href: "/ultrasound", label: "Ультразвуковое исследование печени", icon: Glyph.partners },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="brand" style={{ color: "var(--ink)" }}>
        <span className="mark" aria-hidden>M</span>
        <b>Med<span className="ac">Liver</span></b>
      </Link>
      <p className="tagline">AI-модель для выявления заболеваний печени</p>

      <nav className="nav">
        {NAV.map((n, i) =>
          "sep" in n ? (
            <div className="sep" key={i} />
          ) : (
            <Link key={n.href} href={n.href} className={isActive(n.href) ? "active" : ""}>
              <n.icon size={17} />
              {n.label}
            </Link>
          )
        )}
      </nav>

      <div className="foot">
        <div>v0.1 · MVP</div>
        <div>FastAPI · Next.js · CNN · XGBoost</div>
      </div>
    </aside>
  );
}
