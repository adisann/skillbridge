"use client";

import { useEffect, useState } from "react";

/**
 * useScrollReveal Hook
 * Menggunakan IntersectionObserver dengan callback ref untuk reveal elemen saat masuk viewport,
 * lalu unobserve setelah elemen tampil untuk efisiensi CPU/GPU.
 * Default threshold: 0, rootMargin: "0px 0px 15% 0px", durasi <= 400ms.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold: number = 0,
  rootMargin: string = "0px 0px 15% 0px"
): [(node: T | null) => void, boolean] {
  const [node, setNode] = useState<T | null>(null);
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (!node || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, isVisible, threshold, rootMargin]);

  return [setNode, isVisible];
}
