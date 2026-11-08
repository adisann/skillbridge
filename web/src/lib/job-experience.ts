/** Hanya membaca syarat pengalaman dengan angka dan satuan yang eksplisit. */
export function jobExperienceYears(stored: number | null | undefined, description?: string | null): number | null {
  const text = (description || "").replace(/<[^>]*>/g, " ");
  const match = text.match(/(?:pengalaman|experience)[^.!?\n•]{0,90}?(?:min(?:imal|imum)?\.?|at least)\s*(\d+)\s*(tahun|thn?|years?)/i);
  if (match && (stored == null || stored === 0)) return Number(match[1]);
  return stored ?? null;
}
