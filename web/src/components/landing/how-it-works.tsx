import React from "react";
import { FileText, Check, BookmarkCheck } from "lucide-react";
import { UI_COPY } from "@/lib/copy";

export function LandingHowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24 space-y-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">
            {UI_COPY.landing.howItWorksTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Langkah 1 */}
          <div className="p-6 sm:p-7 rounded-2xl border border-sb-border bg-white space-y-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-full bg-sb-mist-soft text-sb-navy font-bold text-sm flex items-center justify-center font-mono-metric">
                {UI_COPY.landing.howItWorksStep1Number}
              </div>
              <h3 className="text-lg font-semibold text-sb-navy">{UI_COPY.landing.howItWorksStep1Title}</h3>
              <p className="text-[15px] leading-relaxed text-sb-text-2">
                {UI_COPY.landing.howItWorksStep1Desc}
              </p>
            </div>

            {/* Abstrak UI Frame 1 */}
            <div className="p-4 rounded-xl bg-sb-mist-faint/50 border border-sb-border space-y-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sb-blue" />
                <div className="h-2.5 bg-sb-mist rounded w-28" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-2 bg-sb-mist-soft rounded w-full" />
                <div className="h-2 bg-sb-mist-soft rounded w-4/5" />
              </div>
              <div className="flex gap-1.5 pt-1">
                <span className="w-12 h-4 rounded bg-sb-mist-soft" />
                <span className="w-10 h-4 rounded bg-sb-mist-soft" />
                <span className="w-14 h-4 rounded bg-sb-mist-soft" />
              </div>
            </div>
          </div>

          {/* Langkah 2 */}
          <div className="p-6 sm:p-7 rounded-2xl border border-sb-border bg-white space-y-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-full bg-sb-mist-soft text-sb-navy font-bold text-sm flex items-center justify-center font-mono-metric">
                {UI_COPY.landing.howItWorksStep2Number}
              </div>
              <h3 className="text-lg font-semibold text-sb-navy">{UI_COPY.landing.howItWorksStep2Title}</h3>
              <p className="text-[15px] leading-relaxed text-sb-text-2">
                {UI_COPY.landing.howItWorksStep2Desc}
              </p>
            </div>

            {/* Abstrak UI Frame 2 */}
            <div className="p-4 rounded-xl bg-sb-mist-faint/50 border border-sb-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="h-2.5 bg-sb-sky rounded w-32" />
                <div className="w-8 h-3 bg-sb-mist-soft rounded-full" />
              </div>
              <div className="h-2 bg-sb-mist-soft rounded w-24" />
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-sb-good shrink-0" />
                  <div className="h-2 bg-sb-mist-soft rounded w-20" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-sb-border shrink-0" />
                  <div className="h-2 bg-sb-mist-soft rounded w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Langkah 3 */}
          <div className="p-6 sm:p-7 rounded-2xl border border-sb-border bg-white space-y-5 flex flex-col justify-between shadow-2xs">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-full bg-sb-mist-soft text-sb-navy font-bold text-sm flex items-center justify-center font-mono-metric">
                {UI_COPY.landing.howItWorksStep3Number}
              </div>
              <h3 className="text-lg font-semibold text-sb-navy">{UI_COPY.landing.howItWorksStep3Title}</h3>
              <p className="text-[15px] leading-relaxed text-sb-text-2">
                {UI_COPY.landing.howItWorksStep3Desc}
              </p>
            </div>

            {/* Abstrak UI Frame 3 */}
            <div className="p-4 rounded-xl bg-sb-mist-faint/50 border border-sb-border space-y-2.5">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-sb-blue" />
                <div className="h-2.5 bg-sb-mist rounded w-28" />
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between p-1.5 rounded bg-white border border-sb-border">
                  <div className="h-2 bg-sb-mist-soft rounded w-20" />
                  <span className="w-4 h-4 rounded bg-sb-good/20 text-sb-good flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white border border-sb-border">
                  <div className="h-2 bg-sb-mist-soft rounded w-24" />
                  <span className="w-4 h-4 rounded border border-sb-border" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
