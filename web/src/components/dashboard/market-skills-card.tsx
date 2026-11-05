import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/copy";
import type { MarketSkill } from "@/lib/dashboard";

interface MarketSkillsCardProps {
  totalJobsCount: number;
  topMarketSkills: MarketSkill[];
  targetRole?: string;
}

export function MarketSkillsCard({ totalJobsCount, topMarketSkills, targetRole }: MarketSkillsCardProps) {
  return (
    <div className="lg:col-span-5 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card flex flex-col justify-between space-y-4 border border-sb-border">
      <div className="space-y-3">
        <div>
          <p className="text-3xl font-extrabold text-sb-navy tracking-tight font-mono-metric">
            {totalJobsCount}
          </p>
          <p className="text-xs text-sb-text-2 font-medium mt-0.5">
            lowongan aktif untuk {targetRole || "Semua Bidang"}
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-bold text-sb-text-2">
            Skill paling dicari
          </p>
          {topMarketSkills.length > 0 ? (
            <div className="space-y-2.5 text-xs">
              {topMarketSkills.map((item, idx) => (
                <div key={item.skillName} className="space-y-1">
                  <div className="flex items-center justify-between text-sb-navy font-semibold">
                    <span>#{idx + 1} {item.skillName}</span>
                    <span className="text-sb-blue font-bold font-mono-metric">{formatPercent(item.percentage)}% lowongan</span>
                  </div>
                  <div className="w-full bg-sb-mist-soft rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-sb-sky h-full rounded-full transition-all"
                      style={{ width: `${formatPercent(item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-xs text-sb-text-2 italic">
              Memuat data skill pasar...
            </div>
          )}
        </div>
      </div>

      <Link href="/insights" className="block pt-2 border-t border-sb-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          rightIcon={<TrendingUp className="w-3.5 h-3.5 text-sb-blue" />}
        >
          <span>Lihat Tren Skill Lengkap</span>
        </Button>
      </Link>
    </div>
  );
}
