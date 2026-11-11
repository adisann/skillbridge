"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X, Layers, Briefcase } from "lucide-react";
import { SkillChips } from "@/components/ui/skill-chips";
import { UI_COPY } from "@/lib/copy";

interface FloatingCard {
  position: string;
  /** Lebar kartu; kartu bawah lebih lebar agar chip-nya satu baris seperti kartu atas. */
  width: string;
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
    width: "w-48 sm:w-56",
    title: UI_COPY.landing.solutionCardJob1,
    chips: UI_COPY.landing.solutionCardJob1Chips,
    rotate: "-3deg",
    mergeX: "110px",
    mergeY: "120px",
    delay: "0s",
  },
  {
    position: "top-4 right-1 sm:top-6 sm:right-4",
    width: "w-48 sm:w-56",
    title: UI_COPY.landing.solutionCardJob2,
    chips: UI_COPY.landing.solutionCardJob2Chips,
    rotate: "3deg",
    mergeX: "-110px",
    mergeY: "120px",
    delay: "-1.4s",
  },
  {
    position: "bottom-2 left-6 sm:bottom-4 sm:left-12",
    width: "w-60 sm:w-72",
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
    <section className="py-stack-6xl sm:py-stack-8xl">
      <div className="mx-auto max-w-[1380px] px-stack-xl sm:px-stack-4xl lg:px-stack-6xl xl:px-stack-7xl">
        <div className="grid lg:grid-cols-2 gap-stack-4xl lg:gap-stack-5xl items-center">
          {/* Left Column: Story Comparison */}
          <div className="space-y-stack-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">
              {UI_COPY.landing.solutionTitle}
            </h2>

            <div className="space-y-stack-md">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-stack-lg sm:p-stack-xl rounded-2xl bg-white border border-sb-border space-y-stack-xs landing-card-shadow"
                >
                  {/* Sebelum */}
                  <div className="flex items-center gap-stack-xs text-xs sm:text-sm text-sb-text-2">
                    <span className="w-5 h-5 rounded-full bg-sb-mist-soft flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-sb-text-2" />
                    </span>
                    <span className="line-through decoration-sb-border">{item.before}</span>
                  </div>

                  {/* Sesudah */}
                  <div className="flex items-start gap-stack-xs text-sm sm:text-base font-semibold text-sb-navy">
                    <span className="w-5 h-5 rounded-full bg-sb-sky flex items-center justify-center shrink-0 mt-stack-3xs">
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
            className={`relative min-h-[440px] sm:min-h-[470px] flex items-center justify-center p-stack-md sm:p-stack-xl ${
              isVisible ? "" : "sb-merge-paused"
            }`}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 470" preserveAspectRatio="none" fill="none" aria-hidden="true">
              {/* Satu garis per kartu, ikut tertarik ke kartu tengah saat kartu bergabung (delay sama dengan kartunya) */}
              {[
                { d: "M80 80C80 180 180 220 250 235", delay: FLOATING_CARDS[0].delay },
                { d: "M420 90C420 180 320 220 250 235", delay: FLOATING_CARDS[1].delay },
                { d: "M150 400C150 310 210 260 250 235", delay: FLOATING_CARDS[2].delay },
              ].map((line) => (
                <path key={line.d} d={line.d} pathLength={1} className="sb-merge-line" style={{ animationDelay: line.delay }}
                  stroke="var(--sb-blue)" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
            {/* Kartu kecil mengambang, masuk ke kartu tengah, lalu muncul kembali (loop) */}
            {FLOATING_CARDS.map((card) => (
              <div
                key={card.title}
                className={`sb-merge-card absolute ${card.position} ${card.width} p-stack-sm rounded-xl bg-white/95 border border-sb-border shadow-xs z-[1] motion-reduce:hidden`}
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
                <div className="flex items-center gap-stack-xs">
                  <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                  <p className="text-xs font-bold text-sb-navy truncate">{card.title}</p>
                </div>
                <div className="flex flex-wrap gap-stack-2xs pt-stack-xs">
                  {card.chips.map((chip) => (
                    <span
                      key={chip}
                      className="px-stack-xs py-stack-3xs rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Central Merged Summary Card - ALWAYS INTACT & FULLY VISIBLE IN CENTER */}
            <div className="relative z-10 w-full max-w-[420px] p-stack-xl sm:p-stack-xl rounded-2xl bg-white border border-sb-border shadow-sm">
              <div className="flex items-center gap-stack-sm pb-stack-md border-b border-sb-border">
                <div className="w-10 h-10 rounded-xl bg-sb-sky flex items-center justify-center text-sb-navy">
                  <Layers className="w-5 h-5 text-sb-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-sb-navy">
                    {UI_COPY.landing.solutionSummaryTitle}
                  </h3>
                  <div className="flex items-center gap-stack-2xs mt-stack-3xs">
                    <span className="w-2 h-2 rounded-full bg-sb-good inline-block" />
                    <span className="text-xs text-sb-text-2">
                      {UI_COPY.landing.solutionCardJob1} · {UI_COPY.landing.solutionCardJob2}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-stack-md space-y-stack-sm">
                <div className="flex flex-wrap gap-stack-xs">
                  {UI_COPY.landing.solutionSummarySkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-stack-2xs px-stack-sm py-stack-2xs rounded-full text-xs font-semibold bg-sb-mist-soft text-sb-navy border border-sb-border"
                    >
                      <Check className="w-3 h-3 text-sb-blue" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-stack-md"><SkillChips skills={[`${UI_COPY.landing.sceneGap} · ${UI_COPY.landing.sceneMissing}`]} gapClass="gap-stack-xs" chipClass="" variant="missing" /></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
