import { CheckCircle2, MinusCircle, HelpCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RequirementEvaluation } from "@/lib/matching";

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

function RequirementRow({ req }: { req: RequirementEvaluation }) {
  return (
    <tr className="hover:bg-sb-mist-faint/50 transition-colors">
      <td className="py-3 px-3 font-bold text-sb-navy">{req.skill}</td>
      <td className="py-3 px-3">
        <span
          className={cn(
            "px-2 py-0.5 rounded text-[11px] font-bold",
            req.isMandatory
              ? "bg-sb-mist-soft text-sb-navy border border-sb-border"
              : "bg-white text-sb-text-2 border border-sb-border"
          )}
        >
          {req.isMandatory ? "Wajib" : "Tambahan"}
        </span>
      </td>
      <td className="py-3 px-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border",
            STATUS_BADGE_CLASS[req.status]
          )}
        >
          <StatusIcon status={req.status} />
          {req.statusLabel}
        </span>
      </td>
      <td className="py-3 px-3 text-sb-text-2 italic">{req.evidence}</td>
    </tr>
  );
}

/** Evaluasi persyaratan: cocok, belum ditemukan, atau belum cukup bukti. */
export function RequirementsAnalysisCard({ evaluations }: { evaluations: RequirementEvaluation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis Persyaratan Kualifikasi</CardTitle>
        <CardDescription>
          Evaluasi otomatis kesesuaian antara kualifikasi lowongan dengan isi CV aktifmu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-sb-border text-sb-text-2 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Kualifikasi</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Status CV</th>
                <th className="py-3 px-3">Bukti dari Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sb-border">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sb-text-2">
                    Tidak ada persyaratan keahlian teknis spesifik yang terdaftar untuk posisi ini.
                  </td>
                </tr>
              ) : (
                evaluations.map((req) => <RequirementRow key={req.id} req={req} />)
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
