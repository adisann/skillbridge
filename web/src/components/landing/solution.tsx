"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X, Layers, Briefcase } from "lucide-react";
import { UI_COPY } from "@/lib/copy";

export function LandingSolution() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMerged, setIsMerged] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsMerged(true);
          observer.disconnect();
        }
      },
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
            className="relative min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-4 sm:p-6"
          >
            {/* Small Job Card 1 (Data Analyst) - Stacked slightly top-left behind central card */}
            <div
              className={`absolute top-2 left-1 sm:top-4 sm:left-4 w-48 sm:w-56 p-3 rounded-xl bg-white/95 border border-sb-border shadow-xs transition-all duration-500 ease-out z-[1] motion-reduce:hidden ${
                isMerged
                  ? "translate-x-4 translate-y-4 rotate-0 opacity-0 scale-95 pointer-events-none"
                  : "-translate-x-1 -translate-y-1 -rotate-3 opacity-90 scale-100"
              }`}
              aria-hidden="true"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <p className="text-xs font-bold text-sb-navy truncate">{UI_COPY.landing.solutionCardJob1}</p>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {UI_COPY.landing.solutionCardJob1Chips.map((chip) => (
                  <span
                    key={chip}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Small Job Card 2 (Business Intelligence) - Stacked slightly top-right behind central card */}
            <div
              className={`absolute top-4 right-1 sm:top-6 sm:right-4 w-48 sm:w-56 p-3 rounded-xl bg-white/95 border border-sb-border shadow-xs transition-all duration-500 ease-out z-[1] motion-reduce:hidden ${
                isMerged
                  ? "-translate-x-4 translate-y-4 rotate-0 opacity-0 scale-95 pointer-events-none"
                  : "translate-x-1 -translate-y-1 rotate-3 opacity-90 scale-100"
              }`}
              aria-hidden="true"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <p className="text-xs font-bold text-sb-navy truncate">{UI_COPY.landing.solutionCardJob2}</p>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {UI_COPY.landing.solutionCardJob2Chips.map((chip) => (
                  <span
                    key={chip}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Small Job Card 3 (Analytics Engineer) - Stacked slightly bottom behind central card */}
            <div
              className={`absolute bottom-2 left-6 sm:bottom-4 sm:left-12 w-48 sm:w-56 p-3 rounded-xl bg-white/95 border border-sb-border shadow-xs transition-all duration-500 ease-out z-[1] motion-reduce:hidden ${
                isMerged
                  ? "-translate-y-4 rotate-0 opacity-0 scale-95 pointer-events-none"
                  : "translate-y-1 rotate-1 opacity-90 scale-100"
              }`}
              aria-hidden="true"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-sb-blue shrink-0" />
                <p className="text-xs font-bold text-sb-navy truncate">{UI_COPY.landing.solutionCardJob3}</p>
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {UI_COPY.landing.solutionCardJob3Chips.map((chip) => (
                  <span
                    key={chip}
                    className="px-2 py-0.5 rounded-full text-xs font-medium bg-sb-mist-soft text-sb-navy border border-sb-border"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
