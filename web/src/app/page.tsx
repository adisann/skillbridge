"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { fetchDeduped } from "@/lib/fetcher";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblem } from "@/components/landing/problem";
import { LandingSolution } from "@/components/landing/solution";
import { LandingFields } from "@/components/landing/fields";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingTrust } from "@/components/landing/trust";
import { LandingClosing } from "@/components/landing/closing";

export default function HomePage() {
  const { loginDemoJuri } = useAuth();
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [isDemoLoading, setIsDemoLoading] = useState(false);

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
        }
      } catch {
        // Fallback silently if offline
      }
    };

    fetchCategoryCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDemoClick = async () => {
    setIsDemoLoading(true);
    await loginDemoJuri();
    setIsDemoLoading(false);
  };

  return (
    <div className="overflow-hidden text-sb-navy relative">
      {/* Scroll sentinel 8px for landing navbar transition */}
      <div
        id="landing-sentinel"
        className="absolute top-0 left-0 right-0 h-2 pointer-events-none -z-50"
        aria-hidden="true"
      />

      <LandingHero />
      <LandingProblem />
      <LandingSolution />
      <LandingHowItWorks />
      <LandingFields jobCounts={jobCounts} />
      <LandingTrust />
      <LandingClosing onDemoClick={handleDemoClick} isDemoLoading={isDemoLoading} />
    </div>
  );
}
