import { Suspense } from "react";
import type { Metadata } from "next";
import { SkillTrends } from "@/components/insights/skill-trends";
import { SkeletonCard } from "@/components/ui/loading";

export const metadata: Metadata = {
  title: "Tren Kebutuhan Skill Pasar Kerja — SkillBridge",
  description:
    "Analisis frekuensi dan statistik kebutuhan skill paling dicari dari sampel lowongan kerja aktif.",
};

export default function PublicTrenSkillPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <SkeletonCard />
        </div>
      }
    >
      <SkillTrends mode="guest" />
    </Suspense>
  );
}

