import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Palette,
  Code2,
  ShieldCheck,
  Megaphone,
  Coins,
  Boxes,
  Briefcase,
} from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/job-categories";
import { UI_COPY } from "@/lib/copy";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  TrendingUp,
  Palette,
  Code2,
  ShieldCheck,
  Megaphone,
  Coins,
  Boxes,
};

interface LandingFieldsProps {
  jobCounts: Record<string, number> | null;
}

export function LandingFields({ jobCounts }: LandingFieldsProps) {
  const visibleCategories = JOB_CATEGORIES.filter((category) => category.slug !== "lainnya");

  return (
    <section className="py-stack-6xl sm:py-stack-8xl landing-grad-fields border-y border-sb-border">
      <div className="mx-auto max-w-[1380px] px-stack-xl sm:px-stack-4xl lg:px-stack-6xl xl:px-stack-7xl space-y-stack-4xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">
            {UI_COPY.landing.fieldsTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md sm:gap-stack-lg">
          {visibleCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.iconName] || Briefcase;
            const count = jobCounts?.[cat.slug] ?? 0;

            return (
              <Link
                key={cat.slug}
                href={`/lowongan?bidang=${cat.slug}`}
                className="p-stack-lg rounded-2xl border border-sb-border bg-white landing-card-shadow hover:border-sb-blue/40 transition-ui flex flex-col justify-between space-y-stack-md group"
              >
                <div className="space-y-stack-sm">
                  <div className="w-11 h-11 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy group-hover:bg-sb-sky group-hover:text-sb-navy transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-sb-navy group-hover:text-sb-blue transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-[15px] text-sb-text-2 mt-stack-2xs leading-relaxed">
                      {cat.examples}
                    </p>
                  </div>
                </div>

                <div className="pt-stack-xs border-t border-sb-border flex items-center justify-between text-xs">
                  <span className="font-semibold text-sb-blue font-mono-metric">
                    {jobCounts === null
                      ? UI_COPY.landing.statsUnavailable
                      : `${count.toLocaleString("id-ID")} ${UI_COPY.landing.fieldsJobsSuffix}`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-sb-text-2 group-hover:text-sb-blue group-hover:translate-x-0.5 transition-ui" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
