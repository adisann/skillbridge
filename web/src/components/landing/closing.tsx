import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/lib/copy";
import { PixelArrow } from "./pixel-arrow";

export function LandingClosing() {
  return (
    <section className="pt-6 pb-20 sm:pt-8 sm:pb-28">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24">
        <div className="relative rounded-3xl bg-sb-mist-soft border border-sb-border p-8 sm:p-14 lg:p-16 overflow-hidden shadow-2xs">
          {/* Pixel Arrow di sisi kanan: terpusat vertikal, jarak kanan minimal 64px, sembunyikan di layar < 768px */}
          <div
            className="absolute right-16 lg:right-20 xl:right-24 top-1/2 -translate-y-1/2 pointer-events-none hidden md:flex items-center justify-center py-12"
            style={{
              maskImage: "linear-gradient(to top, transparent, black 15%, black 85%, transparent)",
              WebkitMaskImage: "linear-gradient(to top, transparent, black 15%, black 85%, transparent)",
            }}
            aria-hidden="true"
          >
            <PixelArrow px={18} gap={5} delay="0s" className="opacity-85" />
          </div>

          <div className="max-w-xl space-y-5 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-sb-navy tracking-tight leading-tight">
              {UI_COPY.landing.closingTitle}
            </h2>
            <p className="text-sm sm:text-base text-sb-text-2 leading-relaxed">
              {UI_COPY.landing.closingSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/login">
                <Button variant="primary" size="lg" className="px-8">
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
