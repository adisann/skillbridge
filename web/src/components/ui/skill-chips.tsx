import { cn } from "@/lib/utils";

interface SkillChipsProps {
  skills: string[];
  gapClass: string;
  chipClass: string;
}

/** Daftar skill sebagai chip; warna dan jarak ditentukan pemanggil. */
export function SkillChips({ skills, gapClass, chipClass }: SkillChipsProps) {
  return (
    <div className={cn("flex flex-wrap", gapClass)}>
      {skills.map((skill) => (
        <span key={skill} className={cn("px-3 py-1 rounded-full border text-xs font-semibold", chipClass)}>
          {skill}
        </span>
      ))}
    </div>
  );
}
