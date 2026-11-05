import React from "react";
import { ExternalLink, Shield, HeartHandshake } from "lucide-react";
import { UI_COPY } from "@/lib/copy";

export function LandingTrust() {
  const points = [
    {
      icon: ExternalLink,
      title: UI_COPY.landing.trustPoint1Title,
      desc: UI_COPY.landing.trustPoint1Desc,
    },
    {
      icon: Shield,
      title: UI_COPY.landing.trustPoint2Title,
      desc: UI_COPY.landing.trustPoint2Desc,
    },
    {
      icon: HeartHandshake,
      title: UI_COPY.landing.trustPoint3Title,
      desc: UI_COPY.landing.trustPoint3Desc,
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24 space-y-10">
        {/* 1 Row of 3 Points without big cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
          {points.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy shrink-0">
                  <Icon className="w-5 h-5 text-sb-blue" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-sb-navy">{point.title}</h3>
                  <p className="text-sm text-sb-text-2 mt-1 leading-relaxed">{point.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* SDG 8 & 10 statement */}
        <div className="pt-2 text-center border-t border-sb-border/60">
          <p className="text-base font-medium text-sb-blue pt-4">
            {UI_COPY.landing.trustBottomLine}
          </p>
        </div>
      </div>
    </section>
  );
}
