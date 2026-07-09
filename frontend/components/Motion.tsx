"use client";
import * as React from "react";
import { useInView, useCountUp, useScrollProgress, useParallax } from "@/lib/motion";

/* ============================================================
   Shared motion primitives — the "showcase" layer.
   Every effect degrades to static under prefers-reduced-motion.
   ============================================================ */

/** Reveals children on scroll into view. `dir` controls the entrance vector. */
export function Reveal({
  children,
  delay = 0,
  dir = "up",
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  dir?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return React.createElement(
    Tag,
    {
      ref,
      className: `reveal r-${dir} ${inView ? "in" : ""} ${className}`,
      style: { transitionDelay: `${delay}ms` },
    },
    children
  );
}

/** Staggers a row of children — each child fades up in sequence. */
export function Stagger({
  children,
  step = 70,
  className = "",
}: {
  children: React.ReactNode;
  step?: number;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const arr = React.Children.toArray(children);
  return (
    <div ref={ref} className={className}>
      {arr.map((c, i) => (
        <div
          key={i}
          className={`reveal r-up ${inView ? "in" : ""}`}
          style={{ transitionDelay: `${i * step}ms` }}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

/**
 * Animated number readout. Counts up from 0 the first time it scrolls into
 * view. Formats with ru-RU grouping by default.
 */
export function Counter({
  value,
  duration = 1300,
  decimals = 0,
  suffix = "",
  prefix = "",
  format,
  className = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>({ threshold: 0.4 });
  const n = useCountUp(value, inView, duration);
  const text = format
    ? format(n)
    : n.toLocaleString("ru-RU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref} className={`num ${className}`}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/** Thin scroll-progress rail fixed to the top of the viewport. */
export function ScrollRail() {
  const p = useScrollProgress();
  return (
    <div className="scroll-rail" aria-hidden>
      <i style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/**
 * Ambient editorial backdrop: a precise dot-grid that drifts on parallax,
 * with two soft accent washes. Pure CSS/SVG, GPU-cheap, no canvas.
 * Place as the first child of a `position: relative` section.
 */
export function AmbientField({
  className = "",
  dots = true,
}: {
  className?: string;
  dots?: boolean;
}) {
  const [ref, off] = useParallax<HTMLDivElement>(28);
  return (
    <div ref={ref} className={`ambient ${className}`} aria-hidden>
      {dots && (
        <div className="ambient-dots" style={{ transform: `translate3d(0, ${off * 0.5}px, 0)` }} />
      )}
      <div className="ambient-wash a" style={{ transform: `translate3d(${off * 0.4}px, ${-off}px, 0)` }} />
      <div className="ambient-wash b" style={{ transform: `translate3d(${-off * 0.3}px, ${off}px, 0)` }} />
    </div>
  );
}

/** Infinite marquee strip. Children are duplicated for a seamless loop. */
export function Marquee({
  children,
  speed = 38,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <div className={`marquee ${className}`} aria-hidden>
      <div className="marquee-track" style={{ animationDuration: `${speed}s` }}>
        <div className="marquee-group">{children}</div>
        <div className="marquee-group">{children}</div>
      </div>
    </div>
  );
}
