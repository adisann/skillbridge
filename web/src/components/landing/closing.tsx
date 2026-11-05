import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/lib/copy";
import { PixelArrow } from "./pixel-arrow";

interface LandingClosingProps {
  onDemoClick: () => Promise<void>;
  isDemoLoading: boolean;
}

export function LandingClosing({ onDemoClick, isDemoLoading }: LandingClosingProps) {
  return (
    <section className="pt-6 pb-20 sm:pt-8 sm:pb-28">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24">
        <div className="relative rounded-3xl bg-sb-mist-soft border border-sb-border p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xs">
          {/* Large 2x Pixel Arrow filling right side of CTA card */}
          <div
            className="absolute right-8 sm:right-16 lg:right-24 -bottom-6 pointer-events-none overflow-hidden hidden sm:block w-[200px] h-[260px]"
            aria-hidden="true"
          >
            <PixelArrow scale={2} delay="0s" className="right-4 bottom-0 opacity-85" />
          </div>

          <div className="max-w-xl space-y-5 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-sb-navy tracking-tight leading-tight">
              {UI_COPY.landing.closingTitle}
            </h2>
            <p className="text-sm sm:text-base text-sb-text-2 leading-relaxed">
              {UI_COPY.landing.closingSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register">
                <Button variant="primary" size="lg" className="px-8 shadow-xs">
                  {UI_COPY.landing.closingCtaPrimary}
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="px-7 bg-white/80 hover:bg-white border-sb-border text-sb-navy"
                onClick={onDemoClick}
                isLoading={isDemoLoading}
              >
                {UI_COPY.landing.closingCtaDemo}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
