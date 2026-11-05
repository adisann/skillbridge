"use client";

import { useEffect, useRef } from "react";

/**
 * useParallax Hook
 * Menggunakan requestAnimationFrame dan translate3d untuk performa 60fps tanpa CLS.
 * Menghormati prefers-reduced-motion dan mematikan/mengurangi efek di layar mobile (<768px).
 * Clamp translateY maksimal ±80px, dan hitung hanya saat elemen berada di viewport.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed: number = 0.5) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    // 1. Cek reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || speed === 0) return;

    let rafId: number | null = null;
    let initialOffsetTop = 0;

    const element = ref.current;
    if (!element) return;

    // Hitung posisi awal elemen terhadap dokumen
    const rect = element.getBoundingClientRect();
    initialOffsetTop = rect.top + window.scrollY;

    const onScroll = () => {
      if (rafId !== null) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (!element) return;

        // Di mobile (< 768px), matikan efek untuk kenyamanan dan hemat baterai
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          element.style.transform = "translate3d(0, 0, 0)";
          return;
        }

        // Hanya hitung saat elemen berada dalam viewport
        const currentRect = element.getBoundingClientRect();
        if (currentRect.bottom < 0 || currentRect.top > window.innerHeight) {
          return;
        }

        const scrollY = window.scrollY;
        // Hitung jarak relatif terhadap scroll viewport
        const relativeScroll = scrollY - (initialOffsetTop - window.innerHeight / 2);
        const rawTranslateY = Math.round(relativeScroll * speed * 0.35);

        // Clamp translateY ke rentang aman [-80px, 80px]
        const clampedY = Math.max(-80, Math.min(80, rawTranslateY));

        element.style.transform = `translate3d(0, ${clampedY}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [speed]);

  return ref;
}
