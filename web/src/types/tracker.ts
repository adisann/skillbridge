export type JobStage =
  | "bookmarked"
  | "applying"
  | "applied"
  | "interviewing"
  | "offered"
  | "accepted"
  | "rejected";

export interface TrackedJob {
  id: string; // Job ID (UUID)
  title: string;
  company: string;
  location: string;
  employmentType: string;
  canonicalTitle?: string;
  seniority?: string;
  sourceName: string;
  sourceUrl?: string;
  matchScore: number;
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchedSkills: string[];
  missingSkills: string[];
  stage: JobStage;
  priority: number; // 1 to 5 stars (1 = Rendah, 5 = Impian / Prioritas Tertinggi)
  salaryExpectation?: string;
  dateSaved: string; // ISO date string (YYYY-MM-DD)
  dateApplied?: string; // ISO date string
  interviewDate?: string; // ISO date / datetime string
  notes?: string;
}

export const STAGE_CONFIG: Record<
  JobStage,
  { label: string; description: string; color: string; bg: string; border: string; badgeClass: string }
> = {
  bookmarked: {
    label: "Tersimpan",
    description: "Wishlist lowongan untuk ditinjau",
    color: "text-sb-text",
    bg: "bg-sb-mist-faint",
    border: "border-sb-border",
    badgeClass: "bg-sb-mist-faint text-sb-text-2 border-sb-border",
  },
  applying: {
    label: "Siapkan Berkas",
    description: "Sedang menyesuaikan CV & dokumen",
    color: "text-sb-blue",
    bg: "bg-sb-mist-faint",
    border: "border-sb-border",
    badgeClass: "bg-sb-mist-faint text-sb-blue border-sb-border",
  },
  applied: {
    label: "Sudah Melamar",
    description: "Lamaran telah terkirim ke perusahaan",
    color: "text-sb-blue",
    bg: "bg-sb-mist-soft",
    border: "border-sb-border",
    badgeClass: "bg-sb-mist-soft text-sb-blue border-sb-border",
  },
  interviewing: {
    label: "Wawancara",
    description: "Tahap wawancara HR / user / tes teknis",
    color: "text-sb-warning",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeClass: "bg-amber-50 text-sb-warning border-amber-200",
  },
  offered: {
    label: "Negosiasi / Offer",
    description: "Penawaran kerja & pembahasan kompensasi",
    color: "text-sb-blue",
    bg: "bg-sb-mist-soft",
    border: "border-sb-mist",
    badgeClass: "bg-sb-mist-soft text-sb-blue border-sb-mist",
  },
  accepted: {
    label: "Diterima (Offer Accepted)",
    description: "Tawaran diterima resmi",
    color: "text-sb-good",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeClass: "bg-emerald-50 text-sb-good border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    description: "Lamaran belum berhasil atau posisi telah ditutup",
    color: "text-sb-critical",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badgeClass: "bg-rose-50 text-sb-critical border-rose-200",
  },
};
