/** Utilitas gaji lowongan: format tampilan dan konversi ke estimasi per bulan untuk filter. */

type SalaryPeriod = "hour" | "day" | "week" | "month" | "year";

export interface SalaryRange {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: string | null;
  salaryCurrency?: string | null;
}

const PERIOD_LABEL: Record<SalaryPeriod, string> = {
  hour: "jam",
  day: "hari",
  week: "minggu",
  month: "bulan",
  year: "tahun",
};

// Estimasi kasar untuk membandingkan gaji lintas periode pada filter
const MONTHLY_FACTOR: Record<SalaryPeriod, number> = {
  hour: 173,
  day: 22,
  week: 4,
  month: 1,
  year: 1 / 12,
};

export const SALARY_UNKNOWN_LABEL = "Gaji belum diinfokan";

const isPeriod = (value: string | null | undefined): value is SalaryPeriod =>
  Boolean(value) && value! in PERIOD_LABEL;

function formatAmount(value: number): { number: string; unit: string } {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const number = Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(/\.0$/, "").replace(".", ",");
    return { number, unit: "jt" };
  }
  if (value >= 1_000) return { number: String(Math.round(value / 1_000)), unit: "rb" };
  return { number: String(value), unit: "" };
}

const joinAmount = ({ number, unit }: { number: string; unit: string }) => (unit ? `${number} ${unit}` : number);

export function hasSalary({ salaryMin, salaryMax }: SalaryRange): boolean {
  return Boolean(salaryMin || salaryMax);
}

/** Contoh: "Rp 2,4 - 3,6 jt / bulan". Mengembalikan null bila gaji tidak diinfokan. */
export function formatSalaryRange(range: SalaryRange): string | null {
  const { salaryMin, salaryMax, salaryPeriod } = range;
  if (!hasSalary(range)) return null;
  const period = isPeriod(salaryPeriod) ? PERIOD_LABEL[salaryPeriod] : "bulan";
  const low = salaryMin ? formatAmount(salaryMin) : null;
  const high = salaryMax ? formatAmount(salaryMax) : null;
  let body: string;
  if (low && high && joinAmount(low) !== joinAmount(high)) {
    // Satuan sama -> tulis sekali: "2,4 - 3,6 jt"
    body = low.unit === high.unit ? `${low.number} - ${joinAmount(high)}` : `${joinAmount(low)} - ${joinAmount(high)}`;
  } else {
    body = joinAmount((low || high) as { number: string; unit: string });
  }
  const currency = range.salaryCurrency?.toUpperCase() || "IDR";
  return `${currency === "IDR" ? "Rp" : currency} ${body} / ${period}`;
}

/** Estimasi gaji per bulan (nilai tengah rentang), null bila tidak ada data. */
export function monthlySalaryEstimate(range: SalaryRange): number | null {
  const { salaryMin, salaryMax, salaryPeriod } = range;
  if (!hasSalary(range) || (range.salaryCurrency && range.salaryCurrency.toUpperCase() !== "IDR")) return null;
  const values = [salaryMin, salaryMax].filter((v): v is number => typeof v === "number" && v > 0);
  const mid = values.reduce((sum, v) => sum + v, 0) / values.length;
  const factor = isPeriod(salaryPeriod) ? MONTHLY_FACTOR[salaryPeriod] : 1;
  return Math.round(mid * factor);
}
