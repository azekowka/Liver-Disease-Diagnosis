/* Hand-drawn geometric glyphs — deliberately NOT lucide.
   Square-cornered, 1.6px stroke, currentColor. Minimal archival marks. */
import * as React from "react";

type P = { size?: number; className?: string };
const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "square", strokeLinejoin: "miter",
});

export const Glyph = {
  // dashboard: a filled ledger square split into quadrants
  board: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><rect x="3" y="3" width="18" height="18"/><path d="M3 12h18M12 3v18"/></svg>
  ),
  // search: lens as concentric square + tick (not the usual circle+handle)
  find: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><rect x="4" y="4" width="11" height="11"/><path d="M15 15l5 5"/></svg>
  ),
  // services: stacked rules (a list/registry)
  registry: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M4 6h16M4 12h16M4 18h10"/></svg>
  ),
  // partners: two offset frames (institutions)
  partners: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><rect x="3" y="7" width="11" height="13"/><path d="M10 7V4h11v13h-3"/></svg>
  ),
  // documents: a sheet with a folded corner drawn square
  docs: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/></svg>
  ),
  // review: a checkmark inside a frame
  review: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><rect x="3" y="3" width="18" height="18"/><path d="M7 12l3 3 6-7"/></svg>
  ),
  // arrow used inline
  arrow: ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className}><path d="M5 12h12M12 6l6 6-6 6"/></svg>
  ),
  // plus
  plus: ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 5v14M5 12h14"/></svg>
  ),
  // cross
  x: ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className}><path d="M6 6l12 12M18 6L6 18"/></svg>
  ),
  // upload: tray with an up-stroke
  upload: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v5h16v-5"/></svg>
  ),
  // scan / OCR: a framed page with a sweeping line
  scan: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M4 12h16"/></svg>
  ),
  // table: gridded cells
  table: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><rect x="3" y="4" width="18" height="16"/><path d="M3 10h18M3 15h18M9 4v16"/></svg>
  ),
  // normalize / reconcile: two marks converging to one
  reconcile: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M4 6h6l4 6 4-6M4 18h6l4-6"/></svg>
  ),
  // validate: shield with a tick
  shield: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>
  ),
  // versions: stacked sheets
  layers: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M12 3l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 17l8 4 8-4"/></svg>
  ),
  // check
  check: ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className}><path d="M5 12l4 4 10-11"/></svg>
  ),
  // price tag
  tag: ({ size = 18, className }: P) => (
    <svg {...base(size)} className={className}><path d="M3 12V4h8l9 9-8 8z"/><path d="M8 8h.01"/></svg>
  ),
  // clock: circle + hour/minute hands
  clock: ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
  ),
  // info: circle with i
  info: ({ size = 16, className }: P) => (
    <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 12v4"/></svg>
  ),
};
