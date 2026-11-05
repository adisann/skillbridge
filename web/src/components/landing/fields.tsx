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
  jobCounts: Record<string, number>;
}

export function LandingFields({ jobCounts }: LandingFieldsProps) {
  const visibleCategories = JOB_CATEGORIES.filter((c) => {
    if (c.slug === "lainnya") return false;
    // Sembunyikan bidang tanpa lowongan jika data sudah dimuat
    if (Object.keys(jobCounts).length > 0) {
      return (jobCounts[c.slug] || 0) > 0;
    }
    return true;
  });

  return (
    <section className="py-20 sm:py-28 bg-sb-mist-faint/40 border-y border-sb-border">
      <div className="mx-auto max-w-[1380px] px-6 sm:px-12 lg:px-20 xl:px-24 space-y-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-sb-navy">
            {UI_COPY.landing.fieldsTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {visibleCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.iconName] || Briefcase;
            const count = jobCounts[cat.slug];

            return (
              <Link
                key={cat.slug}
                href={`/lowongan?bidang=${cat.slug}`}
                className="p-5 rounded-2xl border border-sb-border bg-white hover:border-sb-blue/30 hover:shadow-2xs transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-sb-mist-soft flex items-center justify-center text-sb-navy group-hover:bg-sb-sky group-hover:text-sb-navy transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-sb-navy group-hover:text-sb-blue transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-[15px] text-sb-text-2 mt-1.5 leading-relaxed">
                      {cat.examples}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-sb-border flex items-center justify-between text-xs">
                  {typeof count === "number" && count > 0 ? (
                    <span className="font-semibold text-sb-blue font-mono-metric">
                      {count} {UI_COPY.landing.fieldsJobsSuffix}
                    </span>
                  ) : (
                    <span className="text-sb-text-2">{UI_COPY.landing.fieldsViewPositions}</span>
                  )}
                  <ArrowRight className="w-4 h-4 text-sb-text-2 group-hover:text-sb-blue group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
