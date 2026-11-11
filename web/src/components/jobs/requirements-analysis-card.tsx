import Link from "next/link";
import { LearningButton } from "@/components/learning-button";
import { CheckCircle2, MinusCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RequirementEvaluation } from "@/lib/matching";
import { requirementLabel } from "@/lib/matching-requirements";

const STATUS_BADGE_CLASS: Record<RequirementEvaluation["status"], string> = {
  cocok: "bg-emerald-50 text-sb-good border-emerald-200",
  belum_cukup_bukti: "bg-amber-50 text-sb-warning border-amber-200",
  belum_ditemukan: "bg-sb-mist-faint text-sb-text-2 border-sb-border",
};

function StatusIcon({ status }: { status: RequirementEvaluation["status"] }) {
  if (status === "cocok") return <CheckCircle2 className="w-3.5 h-3.5 text-sb-good" />;
  if (status === "belum_cukup_bukti") return <HelpCircle className="w-3.5 h-3.5 text-sb-warning" />;
  return <MinusCircle className="w-3.5 h-3.5 text-sb-text-2" />;
}

function RequirementRow({ req, jobId }: { req: RequirementEvaluation; jobId?: string }) {
  const hasDetails = req.evidence || req.status !== "cocok";
  return (
    <tr className="block sm:table-row py-stack-sm sm:py-0 hover:bg-sb-mist-faint/50 transition-colors">
      <td className="block sm:table-cell py-stack-xs sm:py-stack-sm px-stack-sm font-bold text-sb-navy">{requirementLabel(req)}</td>
      <td className="inline-block sm:table-cell py-stack-xs sm:py-stack-sm px-stack-sm">
        <span
          className={cn(
            "px-stack-xs py-stack-3xs rounded text-[11px] font-bold",
            req.isMandatory
              ? "bg-sb-mist-soft text-sb-navy border border-sb-border"
              : "bg-white text-sb-text-2 border border-sb-border"
          )}
        >
          {req.isMandatory ? "Wajib" : "Tambahan"}{req.exampleGroupLabel ? " · contoh alat" : req.alternatives?.length ? " · pilih salah satu" : ""}
        </span>
      </td>
      <td className="inline-block sm:table-cell py-stack-xs sm:py-stack-sm px-stack-sm">
        <span
          className={cn(
            "inline-flex items-center gap-stack-2xs px-stack-xs py-stack-3xs rounded-full font-semibold text-[11px] border",
            STATUS_BADGE_CLASS[req.status]
          )}
        >
          <StatusIcon status={req.status} />
          {req.statusLabel}
        </span>
        {req.addedByUser && <span className="mt-stack-3xs block text-[11px] font-medium text-sb-text-2">Ditambahkan oleh pengguna</span>}
      </td>
      <td className={cn(
        "space-y-stack-xs px-stack-sm py-stack-xs text-sb-text-2 sm:table-cell sm:py-stack-sm",
        hasDetails ? "block" : "hidden",
      )}>
        {req.evidence && <p className="wrap-anywhere">{req.evidence}</p>}
        {req.status === "belum_ditemukan" && (req.alternatives || [req.skill]).map((skill) => <LearningButton key={skill} size="chip" skillName={skill} sourceJobId={jobId} reason={req.alternatives ? "Salah satu pilihan untuk memenuhi persyaratan alternatif lowongan." : "Belum ditemukan di CV saat meninjau persyaratan lowongan."} />)}
        {req.status === "belum_cukup_bukti" && <Link className="text-[11px] font-semibold text-sb-blue underline" href={`/cv?skill=${encodeURIComponent(req.alternatives?.[0] || req.skill)}#review-skills`}>Tinjau skill</Link>}
      </td>
    </tr>
  );
}

/** Evaluasi persyaratan: cocok, belum ditemukan, atau belum cukup bukti. */
export function RequirementsAnalysisCard({ evaluations, jobId }: { evaluations: RequirementEvaluation[]; jobId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis Persyaratan Kualifikasi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-sb-border text-sb-text-2 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-stack-sm px-stack-sm">Kualifikasi</th>
                <th className="py-stack-sm px-stack-sm">Tipe</th>
                <th className="py-stack-sm px-stack-sm">Status CV</th>
                <th className="py-stack-sm px-stack-sm">Bukti &amp; Tindakan</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group divide-y divide-sb-border">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-stack-xl text-center text-sb-text-2">
                    Tidak ada persyaratan keahlian teknis spesifik yang terdaftar untuk posisi ini.
                  </td>
                </tr>
              ) : (
                evaluations.map((req) => <RequirementRow key={req.id} req={req} jobId={jobId} />)
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
