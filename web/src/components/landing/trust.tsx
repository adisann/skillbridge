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
    <section className="py-stack-5xl sm:py-stack-6xl bg-white">
      <div className="mx-auto max-w-[1380px] px-stack-xl sm:px-stack-4xl lg:px-stack-6xl xl:px-stack-7xl space-y-stack-3xl">
        {/* 1 Row of 3 Points without big cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-stack-xl sm:gap-stack-3xl">
          {points.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div key={idx} className="flex items-start gap-stack-sm">
                <div className="w-10 h-10 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy shrink-0">
                  <Icon className="w-5 h-5 text-sb-blue" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-sb-navy">{point.title}</h3>
                  <p className="text-sm text-sb-text-2 mt-stack-2xs leading-relaxed">{point.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* SDG 8 & 10 statement */}
        <div className="pt-stack-2xl text-left border-t border-sb-border">
          <p className="max-w-4xl text-2xl sm:text-3xl font-bold leading-relaxed tracking-tight text-sb-navy pt-stack-md">
            {UI_COPY.landing.trustBottomLine}
          </p>
        </div>
      </div>
    </section>
  );
}
