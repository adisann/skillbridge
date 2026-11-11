import Link from "next/link";
import { FileUp, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardBannerProps {
  fullName?: string;
  targetRole?: string;
}

export function DashboardBanner({ fullName, targetRole }: DashboardBannerProps) {
  return (
    <div className="page-banner rounded-3xl p-stack-lg sm:p-stack-xl text-sb-navy relative overflow-hidden border border-sb-border shadow-2xs">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-stack-xl">
        <div className="space-y-stack-xs max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-sb-navy flex flex-wrap items-center gap-stack-sm">
            <span>Halo, {fullName || "Kawan SkillBridge"}</span>
            <span className="px-stack-sm py-stack-3xs rounded-full text-xs font-semibold bg-sb-mist-soft text-sb-navy border border-sb-border">
              {targetRole || "Semua Bidang"}
            </span>
          </h1>
          <p className="text-sb-text-2 text-sm leading-relaxed">
            Ringkasan CV, lowongan, dan lamaranmu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-stack-sm">
          <Link href="/cv">
            <Button variant="secondary" size="sm" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
              Koreksi CV
            </Button>
          </Link>
          <Link href="/tracker">
            <Button variant="primary" size="sm" leftIcon={<ClipboardList className="w-3.5 h-3.5" />}>
              Lamaran Saya
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
