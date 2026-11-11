"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/lib/copy";
import { HeroAnalysisPreview } from "./hero-analysis-preview";

export function LandingHero() {
  const heroRef = useRef<HTMLElement>(null);


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
      className="relative z-10 pt-stack-6xl min-h-[min(100svh,760px)] flex items-center pb-stack-5xl sm:pb-stack-7xl"
    >

      <div className="mx-auto max-w-[1380px] w-full px-stack-xl sm:px-stack-4xl lg:px-stack-6xl xl:px-stack-7xl">
        <div className="grid min-h-[480px] items-center gap-stack-3xl lg:grid-cols-[1fr_1fr] lg:gap-stack-4xl">
          {/* Left Content */}
          <div className="max-w-[580px] space-y-stack-xl hero-enter">
            <h1 className="text-[34px] sm:text-5xl lg:text-[clamp(2.75rem,5vw,4.25rem)] font-extrabold leading-[1.14] tracking-[-0.03em] text-sb-navy [text-wrap:balance]">
              <span className="block">{UI_COPY.landing.heroHeadingLine1}</span>
              <span className="block text-sb-blue">{UI_COPY.landing.heroHeadingLine2}</span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-sb-text-2 max-w-[500px]">
              {UI_COPY.landing.heroSubheading}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-stack-sm pt-stack-2xs">
              <Link href="/login">
                <Button
                  size="lg"
                  variant="primary"
                  className="px-stack-2xl"
                  rightIcon={<ArrowRight className="h-4 w-4 ml-stack-2xs" />}
                >
                  {UI_COPY.landing.heroCtaPrimary}
                </Button>
              </Link>

              <Link href="/lowongan">
                <Button
                  size="lg"
                  variant="secondary"
                  className="px-stack-xl"
                >
                  {UI_COPY.landing.heroCtaSecondary}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[380px] sm:min-h-[460px] py-stack-md flex items-center justify-center overflow-hidden lg:overflow-visible">
            <div
              className="relative w-full max-w-[500px] space-y-stack-sm z-10"
            >
              <div className="sb-float [--float-y:-8px] [--float-down:8px] [--float-dur:4s] [--float-r:0deg]">
                <HeroAnalysisPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
