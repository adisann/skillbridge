import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillTrendsBannerProps {
  isGuest: boolean;
  sampleSizeN: number;
  lastUpdatedDate: string;
}

export function SkillTrendsBanner({ isGuest, sampleSizeN, lastUpdatedDate }: SkillTrendsBannerProps) {
  return (
    <div className="page-banner rounded-3xl p-6 sm:p-8 text-sb-navy relative overflow-hidden border border-sb-border shadow-2xs">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy">Skill yang Paling Dicari</h1>
          <p className="text-sb-text-2 text-sm leading-relaxed">
            {isGuest
              ? "Pantau frekuensi kebutuhan skill paling dicari dari lowongan kerja aktif."
              : "Pantau skill yang paling sering dibutuhkan di lowongan aktif dan bandingkan dengan CV-mu."}
          </p>
          <p className="text-xs text-sb-text-2 pt-0.5">
            Berdasarkan {sampleSizeN} lowongan aktif · diperbarui {lastUpdatedDate}. Dihitung dari sampel lowongan terkumpul, bukan seluruh pasar kerja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-white/70 border border-sb-border text-xs text-sb-navy font-semibold">
            <span className="font-mono-metric font-bold text-sb-blue">{sampleSizeN}</span> lowongan aktif
          </div>
          {isGuest ? (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/lowongan">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 ml-1" />}>
                  Lihat Lowongan
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/progress">
                <Button variant="secondary" size="sm">
                  Rencana Belajar
                </Button>
              </Link>
              <Link href="/cv">
                <Button variant="primary" size="sm">
                  Koreksi CV
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
