"use client";
import { useEffect, useRef, useState } from "react";

/** True when the user prefers reduced motion. Defaults to false on the server. */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduce;
}

/** Observe an element; returns [ref, inView]. Fires once by default. */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  opts: { threshold?: number; once?: boolean; rootMargin?: string } = {}
) {
  // threshold 0 (fire as soon as any part enters) keeps tall lists working —
  // a ratio threshold can never be met by an element taller than the viewport.
  // The "reveal slightly before fully in view" feel comes from rootMargin.
  const { threshold = 0, once = true, rootMargin = "0px 0px -12% 0px" } = opts;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // If the element is already within the viewport at mount (e.g. content that
    // appears after a fetch, or anything above the fold), reveal it immediately
    // instead of waiting a frame for the async observer callback — no flash.
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.top < vh && r.bottom > 0) {
      setInView(true);
      if (once) return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);
  return [ref, inView] as const;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Count up from 0 → value once `start` is true. Returns the live number.
 * Respects reduced-motion (jumps to the final value instantly).
 */
export function useCountUp(value: number, start: boolean, duration = 1200): number {
  const reduce = usePrefersReducedMotion();
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!start) return;
    if (reduce || duration <= 0) {
      setN(value);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setN(value * easeOutExpo(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setN(value);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, start, duration, reduce]);
  return n;
}

/**
 * Parallax: returns [ref, offsetPx]. As the element scrolls through the
 * viewport, offset moves between roughly [-strength, +strength].
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(strength = 40) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress: 0 when element center at bottom, 1 when at top
      const progress = (vh - r.top) / (vh + r.height);
      setOffset((Math.max(0, Math.min(1, progress)) - 0.5) * 2 * strength);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength, reduce]);
  return [ref, offset] as const;
}

/** Whole-page scroll progress 0→1 (for a top progress rail). */
export function useScrollProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return p;
}

/** Pointer position relative to an element's center, normalized to [-1,1]. */
export function usePointerTilt<T extends HTMLElement = HTMLDivElement>(max = 6) {
  const ref = useRef<T>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      setTilt({ x: -py * max, y: px * max });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max, reduce]);
  return [ref, tilt] as const;
}
