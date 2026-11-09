"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X, Layers, Briefcase } from "lucide-react";
import { SkillChips } from "@/components/ui/skill-chips";
import { UI_COPY } from "@/lib/copy";

interface FloatingCard {
  position: string;
  title: string;
  chips: readonly string[];
  rotate: string;
  /** Arah masuk ke kartu tengah (px). */
  mergeX: string;
  mergeY: string;
  delay: string;
}

const FLOATING_CARDS: FloatingCard[] = [
  {
    position: "top-2 left-1 sm:top-4 sm:left-4",
    title: UI_COPY.landing.solutionCardJob1,
    chips: UI_COPY.landing.solutionCardJob1Chips,
    rotate: "-3deg",
    mergeX: "110px",
    mergeY: "120px",
    delay: "0s",
  },
  {
    position: "top-4 right-1 sm:top-6 sm:right-4",
    title: UI_COPY.landing.solutionCardJob2,
    chips: UI_COPY.landing.solutionCardJob2Chips,
    rotate: "3deg",
    mergeX: "-110px",
    mergeY: "120px",
    delay: "-1.4s",
  },
  {
    position: "bottom-2 left-6 sm:bottom-4 sm:left-12",
    title: UI_COPY.landing.solutionCardJob3,
    chips: UI_COPY.landing.solutionCardJob3Chips,
    rotate: "1deg",
    mergeX: "0px",
    mergeY: "-120px",
    delay: "-2.8s",
  },
];

export function LandingSolution() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px 20% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = [
    {
      before: UI_COPY.landing.solutionItem1Before,
      after: UI_COPY.landing.solutionItem1After,
    },
    {
      before: UI_COPY.landing.solutionItem2Before,
      after: UI_COPY.landing.solutionItem2After,
    },
    {
      before: UI_COPY.landing.solutionItem3Before,
      after: UI_COPY.landing.solutionItem3After,
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-sb-mist-faint/40 border-y border-sb-border">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Story Comparison */}
          <div className="space-y-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">
              {UI_COPY.landing.solutionTitle}
            </h2>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-white border border-sb-border space-y-2.5 shadow-2xs"
                >
                  {/* Sebelum */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-sb-text-2">
                    <span className="w-5 h-5 rounded-full bg-sb-mist-soft flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-sb-text-2" />
                    </span>
                    <span className="line-through decoration-sb-border">{item.before}</span>
                  </div>

                  {/* Sesudah */}
                  <div className="flex items-start gap-2.5 text-sm sm:text-base font-semibold text-sb-navy">
                    <span className="w-5 h-5 rounded-full bg-sb-sky flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-sb-blue" />
                    </span>
                    <span>{item.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual Merging Animation */}
          <div
            ref={containerRef}
            className={`relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-4 sm:p-6 ${
              isVisible ? "" : "sb-merge-paused"
            }`}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 440" fill="none" aria-hidden="true"><path d="M80 90C80 200 180 220 250 220M420 90C420 200 320 220 250 220M160 360C160 290 220 220 250 220" stroke="var(--sb-blue)" strokeOpacity=".4" strokeWidth="2" strokeLinecap="round"/></svg>
            {/* Kartu kecil mengambang, masuk ke kartu tengah, lalu muncul kembali (loop) */}
            {FLOATING_CARDS.map((card) => (
              <div
                key={card.title}
                className={`sb-merge-card absolute ${card.position} w-48 sm:w-56 p-3 rounded-xl bg-white/95 border border-sb-border shadow-xs z-[1] motion-reduce:hidden`}
                style={
                  {
                    "--rot": card.rotate,
                    "--mx": card.mergeX,
                    "--my": card.mergeY,
                    animationDelay: card.delay,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                  <p className="text-xs font-bold text-sb-navy truncate">{card.title}</p>
                </div>
                <div className="flex flex-wrap gap-1 pt-2">
                  {card.chips.map((chip) => (
                    <span
                      key={chip}
                      className="px-2 py-0.5 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Central Merged Summary Card - ALWAYS INTACT & FULLY VISIBLE IN CENTER */}
            <div className="relative z-10 w-full max-w-[420px] p-6 sm:p-7 rounded-2xl bg-white border border-sb-border shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-sb-border">
                <div className="w-10 h-10 rounded-xl bg-sb-sky flex items-center justify-center text-sb-navy">
                  <Layers className="w-5 h-5 text-sb-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-sb-navy">
                    {UI_COPY.landing.solutionSummaryTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-sb-good inline-block" />
                    <span className="text-xs text-sb-text-2">
                      {UI_COPY.landing.solutionCardJob1} · {UI_COPY.landing.solutionCardJob2}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {UI_COPY.landing.solutionSummarySkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sb-mist-soft text-sb-navy border border-sb-border"
                    >
                      <Check className="w-3 h-3 text-sb-blue" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4"><SkillChips skills={[`${UI_COPY.landing.sceneGap} · ${UI_COPY.landing.sceneMissing}`]} gapClass="gap-2" chipClass="" variant="missing" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
