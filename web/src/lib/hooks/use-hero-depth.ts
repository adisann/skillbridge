"use client";

import { useEffect, useRef } from "react";

/**
 * Kedalaman hero: satu loop rAF menulis CSS variable pada elemen hero.
 *  --hd-x, --hd-y : posisi pointer (-1..1), diperhalus (lerp)
 *  --hd-s         : progres scroll melewati hero (0..1)
 * Tiap lapisan membaca variabel ini dengan pengali berbeda (lihat .depth-layer di globals.css),
 * sehingga lapisan belakang, tengah, dan depan bergerak dengan laju berbeda.
 * Hanya aktif di layar >= 1024px dengan pointer halus; mati bila prefers-reduced-motion.
 */
export function useHeroDepth<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    if (!mq.matches) return;

    let raf: number | null = null;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let visible = true;

    const writeScroll = () => {
      const h = el.offsetHeight || 1;
      const s = Math.min(1, Math.max(0, window.scrollY / h));
      el.style.setProperty("--hd-s", s.toFixed(4));
    };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--hd-x", cx.toFixed(4));
      el.style.setProperty("--hd-y", cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    };
    const kick = () => {
      if (raf === null && visible) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };
    let sRaf: number | null = null;
    const onScroll = () => {
      if (sRaf !== null || !visible) return;
      sRaf = requestAnimationFrame(() => {
        sRaf = null;
        writeScroll();
      });
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(el);

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    writeScroll();

    return () => {
      io.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
      if (sRaf !== null) cancelAnimationFrame(sRaf);
    };
  }, []);

  return ref;
}
