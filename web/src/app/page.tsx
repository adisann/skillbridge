"use client";

import React, { useState, useEffect } from "react";
import { fetchDeduped } from "@/lib/fetcher";
import { LandingStatsStrip } from "@/components/landing/stats-strip";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblem } from "@/components/landing/problem";
import { LandingSolution } from "@/components/landing/solution";
import { LandingFields } from "@/components/landing/fields";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingTrust } from "@/components/landing/trust";
import { LandingClosing } from "@/components/landing/closing";

export default function HomePage() {
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});

  const [statsFailed, setStatsFailed] = useState(false);
  const [stats, setStats] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchCategoryCounts = async () => {
      try {
        const data = await fetchDeduped<{
          jobs?: Array<{ category?: string }>;
        }>("/api/jobs");

        if (isMounted && data.jobs) {
          const counts: Record<string, number> = {};
          data.jobs.forEach((job) => {
            const cat = job.category || "lainnya";
            counts[cat] = (counts[cat] || 0) + 1;
          });
          setJobCounts(counts);
          setStats(data.jobs.length);
        }
      } catch {
        if (isMounted) setStatsFailed(true);
      }
    };

    fetchCategoryCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="overflow-hidden text-sb-navy relative">
      {/* Scroll sentinel 8px for landing navbar transition */}
      <div
        id="landing-sentinel"
        className="absolute top-0 left-0 right-0 h-2 pointer-events-none -z-50"
        aria-hidden="true"
      />

      <LandingHero />
      <LandingStatsStrip total={stats} fields={Object.keys(jobCounts).length} failed={statsFailed} />
      <LandingProblem />
      <LandingSolution />
      <LandingHowItWorks />
      <LandingFields jobCounts={jobCounts} />
      <LandingTrust />
      <LandingClosing />
    </div>
  );
}
