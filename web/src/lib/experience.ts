export function experienceParts(years: number | null) {
  if (years == null) return { years: "", months: "" };
  const total = Math.round(years * 12);
  return { years: String(Math.floor(total / 12)), months: String(total % 12) };
}

export function experienceInYears(years: string, months: string): number | null {
  if (years === "" && months === "") return null;
  const y = Number(years), m = Number(months);
  if (!Number.isInteger(y) || !Number.isInteger(m) || y < 0 || y > 80 || m < 0 || m > 11) {
    throw new Error("Isi pengalaman 0–80 tahun dan 0–11 bulan, atau kosongkan keduanya.");
  }
  return y + m / 12;
}

export function formatExperience(years: number | null): string {
  if (years == null) return "Belum diisi";
  const p = experienceParts(years);
  return `${p.years} tahun ${p.months} bulan`;
}
