import { Check } from "lucide-react";
import type { RequirementEvaluation } from "@/lib/matching";
import { requirementSummary } from "@/lib/matching-requirements";

/** Ringkasan yang sama untuk kartu dan pratinjau; gap tambahan tidak dilabeli wajib. */
export function SkillMatchSummary({ evaluations, matchedSkills = [], missingSkills = [] }: {
  evaluations?: RequirementEvaluation[];
  matchedSkills?: string[];
  missingSkills?: string[];
}) {
  const sections = [
    { label: "Persyaratan cocok di CV", skills: evaluations?.filter((r) => r.status === "cocok").map(requirementSummary) ?? matchedSkills, tone: "bg-emerald-50 text-sb-good border-emerald-200", matched: true },
    { label: "Tingkat kemampuan di bawah syarat wajib", skills: evaluations?.filter((r) => r.isMandatory && r.minimumNotMet).map(requirementSummary) ?? [], tone: "bg-amber-50 text-sb-warning border-amber-200" },
    { label: "Syarat wajib belum ditemukan di CV", skills: evaluations?.filter((r) => r.isMandatory && r.status === "belum_ditemukan" && !r.minimumNotMet).map(requirementSummary) ?? missingSkills, tone: "bg-amber-50 text-sb-warning border-amber-200" },
    { label: "Syarat wajib perlu ditinjau di CV", skills: evaluations?.filter((r) => r.isMandatory && r.status === "belum_cukup_bukti").map(requirementSummary) ?? [], tone: "bg-amber-50 text-sb-warning border-amber-200" },
    { label: "Tingkat kemampuan di bawah syarat tambahan", skills: evaluations?.filter((r) => !r.isMandatory && r.minimumNotMet).map(requirementSummary) ?? [], tone: "bg-sb-mist-faint text-sb-text-2 border-sb-border" },
    { label: "Skill tambahan belum ditemukan di CV", skills: evaluations?.filter((r) => !r.isMandatory && r.status === "belum_ditemukan" && !r.minimumNotMet).map(requirementSummary) ?? [], tone: "bg-sb-mist-faint text-sb-text-2 border-sb-border" },
    { label: "Skill tambahan perlu ditinjau di CV", skills: evaluations?.filter((r) => !r.isMandatory && r.status === "belum_cukup_bukti").map(requirementSummary) ?? [], tone: "bg-sb-mist-faint text-sb-text-2 border-sb-border" },
  ];
  return (
    <div className="space-y-stack-xs text-xs">
      {sections.filter((s) => s.skills.length).map((section) => (
        <div key={section.label} className="space-y-stack-2xs">
          <p className="font-bold text-sb-text-2">{section.label}:</p>
          <div className="flex flex-wrap gap-stack-2xs">
            {section.skills.map((skill) => (
              <span key={skill} className={`inline-flex items-center px-stack-xs py-stack-3xs rounded-full border font-medium text-[11px] ${section.tone}`}>
                {section.matched && <Check className="w-3 h-3 mr-stack-2xs shrink-0" aria-hidden="true" />}
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
