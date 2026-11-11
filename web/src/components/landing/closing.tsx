import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/lib/copy";
import { PixelArrow } from "./pixel-arrow";

export function LandingClosing() {
  return (
    <section className="relative z-10 pt-stack-5xl pb-stack-6xl sm:pt-stack-6xl sm:pb-stack-8xl">
      <div className="mx-auto max-w-[1380px] px-stack-xl sm:px-stack-4xl lg:px-stack-6xl xl:px-stack-7xl">
        <div className="relative rounded-3xl landing-grad-closing border border-sb-border p-stack-2xl sm:p-stack-4xl lg:p-stack-5xl overflow-hidden shadow-2xs">
          {/* Pixel Arrow di sisi kanan, diputar 90° sehingga menunjuk ke kanan (ke arah depan); disembunyikan di layar < 1024px */}
          <div
            className="absolute right-20 xl:right-28 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none hidden lg:flex items-center justify-center py-stack-4xl"
            style={{
              maskImage: "linear-gradient(to top, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to top, transparent, black 15%, black 85%, transparent)",
            }}
            aria-hidden="true"
          >
            <PixelArrow px={18} gap={5} delay="0s" />
          </div>

          <div className="max-w-xl space-y-stack-lg relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-sb-navy tracking-tight leading-tight">
              {UI_COPY.landing.closingTitle}
            </h2>
            <p className="text-sm sm:text-base text-sb-text-2 leading-relaxed">
              {UI_COPY.landing.closingSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-stack-sm pt-stack-xs">
              <Link href="/login">
                <Button variant="primary" size="lg" className="px-stack-2xl">
                  {UI_COPY.landing.closingCtaPrimary}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
