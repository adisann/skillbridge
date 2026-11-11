import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SkillChips } from "@/components/ui/skill-chips";
import type { JobDetailData } from "@/types/job";

interface GuestLoginPromptProps {
  jobId: string;
}

/** Ajakan masuk atau coba akun demo untuk pengunjung tanpa login. */
export function GuestLoginPrompt({ jobId }: GuestLoginPromptProps) {
  return (
    <div className="glass-panel p-stack-lg sm:p-stack-xl rounded-2xl border border-sb-border bg-sb-mist-soft space-y-stack-sm">
      <h3 className="text-base font-extrabold text-sb-navy">Masuk untuk melihat skill mana yang sudah ada di CV-mu</h3>
      <p className="text-xs sm:text-sm text-sb-text-2 leading-relaxed max-w-2xl">
        Masuk dan unggah CV untuk membandingkan kualifikasi secara otomatis dengan lowongan ini, melihat skor kecocokan, dan mendapatkan rekomendasi gap kompetensi.
      </p>
      <div className="flex flex-wrap items-center gap-stack-sm pt-stack-xs">
        <Link href={`/login?next=${encodeURIComponent(`/lowongan/${jobId}`)}`}>
          <Button variant="primary" size="md">
            Masuk
          </Button>
        </Link>
      </div>
    </div>
  );
}

/** Kualifikasi skill sebagai chip netral (tanpa perbandingan CV). */
export function GuestRequirementsCard({ job }: { job: JobDetailData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Persyaratan Kualifikasi</CardTitle>
        <CardDescription>
          Daftar keahlian teknis dan kemampuan pendukung yang dipersyaratkan oleh perusahaan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-stack-xl">
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="space-y-stack-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-navy">
              Skill Wajib ({job.requiredSkills.length})
            </h4>
            <SkillChips
              skills={job.requiredSkills}
              gapClass="gap-stack-xs"
              chipClass="bg-sb-mist-soft text-sb-navy border-sb-border"
            />
          </div>
        )}

        {job.preferredSkills && job.preferredSkills.length > 0 && (
          <div className="space-y-stack-xs pt-stack-xs border-t border-sb-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sb-text-2">
              Skill Tambahan ({job.preferredSkills.length})
            </h4>
            <SkillChips
              skills={job.preferredSkills}
              gapClass="gap-stack-xs"
              chipClass="bg-sb-mist-faint text-sb-navy border-sb-border"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
