"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParallax } from "@/lib/hooks/use-parallax";
import { UI_COPY } from "@/lib/copy";
import { HeroAnalysisPreview } from "./hero-analysis-preview";

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
          <div className="max-w-[580px] space-y-6 hero-enter">
            <h1 className="text-[34px] sm:text-5xl lg:text-[clamp(2.75rem,5vw,4.25rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-sb-navy [text-wrap:balance]">
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
                  className="px-8"
                  rightIcon={<ArrowRight className="h-4 w-4 ml-1" />}
                >
                  {UI_COPY.landing.heroCtaPrimary}
                </Button>
              </Link>

              <Link href="/lowongan">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-7"
                >
                  {UI_COPY.landing.heroCtaSecondary}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[380px] sm:min-h-[460px] py-4 flex items-center justify-center overflow-hidden lg:overflow-visible">
            <div
              ref={collageRef}
              className="relative w-full max-w-[500px] space-y-3.5 parallax-layer will-change-transform z-10"
            >
              <div className="sb-float [--float-y:-8px] [--float-dur:7s] [--float-r:0deg]">
                <HeroAnalysisPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
