import { cn } from "@/lib/utils";

interface SkillChipsProps {
  skills: string[];
  gapClass: string;
  chipClass: string;
  variant?: "default" | "missing";
}

/** Daftar skill sebagai chip; warna dan jarak ditentukan pemanggil. */
export function SkillChips({ skills, gapClass, chipClass, variant = "default" }: SkillChipsProps) {
  return (
    <div className={cn("flex flex-wrap", gapClass)}>
      {skills.map((skill) => (
        <span key={skill} className={cn("px-3 py-1 rounded-full border text-xs font-semibold", chipClass, variant === "missing" && "border-dashed border-sb-warning bg-sb-warning-soft text-sb-navy")}>
          {skill}
        </span>
      ))}
    </div>
  );
}
