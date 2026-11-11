import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobExplorerBannerProps {
  isGuest: boolean;
  isLoggedIn: boolean;
  role: string;
}

export function JobExplorerBanner({ isGuest, isLoggedIn, role }: JobExplorerBannerProps) {
  const subtitle =
    !isGuest && isLoggedIn
      ? "Lowongan dari berbagai situs kerja, diurutkan sesuai CV-mu."
      : "Lowongan dari berbagai situs kerja.";

  return (
    <div className="page-banner p-stack-lg sm:p-stack-xl space-y-stack-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-stack-xl">
        <div className="space-y-stack-xs max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy">
            Lowongan Pekerjaan
          </h1>
          <p className="text-xs sm:text-sm text-sb-text-2 leading-relaxed max-w-xl">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-stack-xs">
          {isGuest ? (
            <Link
              href={role !== "all" ? `/tren-skill?bidang=${role}` : "/tren-skill"}
              className="inline-flex items-center gap-stack-2xs text-xs font-bold text-sb-blue hover:underline"
            >
              <span>Tren skill di bidang ini</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/insights">
                <Button variant="secondary" size="sm" className="text-xs font-bold px-stack-lg">
                  Lihat Tren Skill
                </Button>
              </Link>
              <Link href="/cv">
                <Button variant="primary" size="sm" className="text-xs font-bold px-stack-lg">
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
