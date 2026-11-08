export function cvEvidence(value: string | null | undefined): string | null {
  if (!value?.trim() || /^(Hasil ekstraksi dokumen CV|Ditambahkan secara mandiri|Ditandai manual)/i.test(value)) return null;
  return value;
}
