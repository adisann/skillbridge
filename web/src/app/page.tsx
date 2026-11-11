import { getCachedPublicJobs } from "@/lib/public-jobs";
import { countJobsPerCategory } from "@/lib/job-list-format";
import { LandingStatsStrip } from "@/components/landing/stats-strip";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblem } from "@/components/landing/problem";
import { LandingSolution } from "@/components/landing/solution";
import { LandingAppCatalog } from "@/components/landing/app-catalog";
import { LandingPixelBand } from "@/components/landing/pixel-band";
import { LandingTopWave } from "@/components/landing/top-wave";
import { LandingFields } from "@/components/landing/fields";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingTrust } from "@/components/landing/trust";
import { LandingClosing } from "@/components/landing/closing";

// Statistik lowongan dihitung di server dan ikut di HTML; diperbarui paling lama tiap 15 menit
export const revalidate = 900;

export default async function HomePage() {
  const jobs = await getCachedPublicJobs();
  const jobCounts = countJobsPerCategory(jobs);
  const stats = jobs.length;
  const statsFailed = jobs.length === 0;

  return (
    <div className="overflow-hidden text-sb-navy relative">
      {/* Scroll sentinel 8px for landing navbar transition */}
      <div
        id="landing-sentinel"
        className="absolute top-0 left-0 right-0 h-2 pointer-events-none -z-50"
        aria-hidden="true"
      />

      {/* Hero + statistik berbagi satu latar gradient bergelombang, lalu ditutup pita piksel */}
      <div className="landing-top">
        <LandingTopWave />
        <LandingHero />
        <LandingStatsStrip total={statsFailed ? null : stats} fields={Object.keys(jobCounts).length} failed={statsFailed} />
      </div>
      <LandingPixelBand />
      <LandingProblem />
      {/* Solusi + katalog layar aplikasi dalam satu latar gradient */}
      <div className="landing-grad-solution">
        <LandingSolution />
        <LandingAppCatalog />
      </div>
      <LandingHowItWorks />
      <LandingFields jobCounts={statsFailed ? null : jobCounts} />
      <LandingTrust />
      {/* Kebalikan blok atas: piksel naik ke biru gelap, lalu terang perlahan lewat gelombang ke footer */}
      <LandingPixelBand direction="up" />
      <div className="landing-bottom">
        <LandingTopWave flip />
        <LandingClosing />
      </div>
    </div>
  );
}
