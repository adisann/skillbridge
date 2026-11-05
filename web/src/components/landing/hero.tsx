"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Code2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParallax } from "@/lib/hooks/use-parallax";
import { UI_COPY } from "@/lib/copy";
import { PixelArrow } from "./pixel-arrow";

export function LandingHero() {
  const heroRef = useRef<HTMLElement>(null);

  // Parallax layers for hero (clamped within ±80px, disabled on mobile)
  const orbRef = useParallax<HTMLDivElement>(0.2);
  const collageRef = useParallax<HTMLDivElement>(0.4);

  // IntersectionObserver to pause hero animations when off-screen
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.remove("hero-paused");
        } else {
          el.classList.add("hero-paused");
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero-section"
      className="relative pt-[72px] min-h-[min(100svh,760px)] flex items-center pb-8 sm:pb-12"
    >
      {/* Parallax Layer 1: Ambient background radial glow */}
      <div
        ref={orbRef}
        className="absolute inset-0 -z-10 pointer-events-none parallax-layer will-change-transform"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 right-20 w-96 h-96 rounded-full bg-sb-mist/40 blur-3xl" />
        <div className="absolute top-1/2 left-10 w-80 h-80 rounded-full bg-sb-mist-soft blur-3xl" />
      </div>

      <div className="mx-auto max-w-[1380px] w-full px-6 sm:px-12 lg:px-20 xl:px-24">
        <div className="grid min-h-[480px] items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          {/* Left Content */}
          <div className="max-w-[580px] space-y-6">
            <h1 className="text-[34px] sm:text-5xl lg:text-[46px] xl:text-[50px] font-extrabold leading-[1.14] tracking-[-0.03em] text-sb-navy [text-wrap:balance]">
              <span className="block">{UI_COPY.landing.heroHeadingLine1}</span>
              <span className="block text-sb-blue">{UI_COPY.landing.heroHeadingLine2}</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-sb-text-2 max-w-[500px]">
              {UI_COPY.landing.heroSubheading}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="primary"
                  className="px-8 shadow-xs"
                  rightIcon={<ArrowRight className="h-4 w-4 ml-1" />}
                >
                  {UI_COPY.landing.heroCtaPrimary}
                </Button>
              </Link>

              <Link href="/lowongan">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-7 bg-white/80 hover:bg-sb-mist-soft border-sb-border text-sb-navy"
                >
                  {UI_COPY.landing.heroCtaSecondary}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual: Parallax Wrapper with Rising Pixel Arrows and Floating Cards */}
          <div className="relative min-h-[420px] sm:min-h-[460px] flex items-center justify-center overflow-hidden lg:overflow-visible">
            {/* Rising Upward Pixel Arrows in Background (Crisp 0.75-0.85 opacity, behind cards) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
              <PixelArrow delay="0s" className="right-8 bottom-6 sm:right-16 opacity-85" />
              <PixelArrow delay="-3.5s" className="hidden sm:block right-48 bottom-12 opacity-80" />
            </div>

            {/* Floating Cards Cluster */}
            <div
              ref={collageRef}
              className="relative w-full max-w-[500px] space-y-3.5 parallax-layer will-change-transform z-10"
            >
              {/* Field Card 1 (Float 1) */}
              <div
                className="sb-float"
                style={{
                  ["--float-y" as string]: "-10px",
                  ["--float-dur" as string]: "6s",
                  ["--float-delay" as string]: "0s",
                }}
              >
                <div className="p-4 sm:p-5 rounded-2xl shadow-xs border border-sb-border bg-[var(--sb-glass-bg-strong)] space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-sb-navy">{UI_COPY.landing.heroFieldDataTitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {UI_COPY.landing.heroFieldDataChips.map((chip) => (
                      <span
                        key={chip}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field Card 2 (Float 2) */}
              <div
                className="sb-float ml-4 sm:ml-8"
                style={{
                  ["--float-y" as string]: "-8px",
                  ["--float-dur" as string]: "7s",
                  ["--float-delay" as string]: "-1.5s",
                }}
              >
                <div className="p-4 sm:p-5 rounded-2xl shadow-xs border border-sb-border bg-[var(--sb-glass-bg-strong)] space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-sb-navy">{UI_COPY.landing.heroFieldEngineeringTitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {UI_COPY.landing.heroFieldEngineeringChips.map((chip) => (
                      <span
                        key={chip}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Field Card 3 (Float 3) */}
              <div
                className="sb-float ml-2 sm:ml-4"
                style={{
                  ["--float-y" as string]: "-11px",
                  ["--float-dur" as string]: "6.5s",
                  ["--float-delay" as string]: "-3.5s",
                  ["--float-r" as string]: "-0.3deg",
                }}
              >
                <div className="p-4 sm:p-5 rounded-2xl shadow-xs border border-sb-border bg-[var(--sb-glass-bg-strong)] space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy">
                      <Palette className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-bold text-sb-navy">{UI_COPY.landing.heroFieldDesignTitle}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {UI_COPY.landing.heroFieldDesignChips.map((chip) => (
                      <span
                        key={chip}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
