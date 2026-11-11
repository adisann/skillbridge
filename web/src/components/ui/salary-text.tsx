import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSalaryRange, SALARY_UNKNOWN_LABEL, type SalaryRange } from "@/lib/salary";

interface SalaryTextProps extends SalaryRange {
  className?: string;
  iconClassName?: string;
}

/** Kisaran gaji lowongan; bila sumber tidak mencantumkan, tampil redup "Gaji belum diinfokan". */
export function SalaryText({ className, iconClassName, ...range }: SalaryTextProps) {
  const label = formatSalaryRange(range);
  return (
    <span className={cn("flex items-center gap-stack-2xs", !label && "text-sb-text-2/70", className)}>
      <Banknote className={cn("w-3.5 h-3.5 shrink-0", label ? "text-sb-good" : "text-sb-text-2/60", iconClassName)} />
      <span className={cn(label && "font-semibold text-sb-navy")}>{label ?? SALARY_UNKNOWN_LABEL}</span>
    </span>
  );
}
