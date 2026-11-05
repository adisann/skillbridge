import Link from "next/link";
import { FileUp, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const VISIBLE_SKILLS = 10;

interface CvSkillsCardProps {
  cvSkills: string[];
  targetRole?: string;
}

export function CvSkillsCard({ cvSkills, targetRole }: CvSkillsCardProps) {
  const hasCv = cvSkills.length > 0;

  return (
    <div className="lg:col-span-7 glass-panel rounded-2xl p-5 sm:p-6 shadow-2xs lift-card flex flex-col justify-between space-y-4 border border-sb-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-sb-navy">
            Skill di CV&#8209;mu
          </h2>
          <span className="text-xs font-semibold text-sb-text-2">
            Target: {targetRole || "Semua Bidang"}
          </span>
        </div>

        {hasCv ? (
          <>
            <div className="space-y-1.5">
              <p className="text-xs text-sb-text-2 leading-relaxed">
                CV&#8209;mu mencakup {cvSkills.length} skill yang terdeteksi dan dibandingkan dengan kebutuhan lowongan.
              </p>
            </div>

            <div className="pt-2">
              <div className="flex flex-wrap gap-1.5">
                {cvSkills.slice(0, VISIBLE_SKILLS).map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30 text-xs font-semibold"
                  >
                    <Check className="w-3 h-3 text-sb-good" />
                    {s}
                  </span>
                ))}
                {cvSkills.length > VISIBLE_SKILLS && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-sb-mist-faint text-sb-text-2 text-xs font-medium border border-sb-border font-mono-metric">
                    +{cvSkills.length - VISIBLE_SKILLS} lainnya
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 rounded-xl bg-white/40 border border-dashed border-sb-border text-xs text-sb-text-2">
            Belum ada CV. Unggah untuk melihat skill yang terbaca.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-sb-border">
        <Link href="/cv">
          <Button variant="primary" size="sm" leftIcon={<FileUp className="w-3.5 h-3.5" />}>
            {hasCv ? "Koreksi CV" : "Unggah CV"}
          </Button>
        </Link>
        <Link href="/jobs">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Cari Lowongan
          </Button>
        </Link>
      </div>
    </div>
  );
}
