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
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  applying: {
    label: "Siapkan Berkas",
    description: "Sedang menyesuaikan CV & dokumen",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  applied: {
    label: "Sudah Melamar",
    description: "Lamaran telah terkirim ke perusahaan",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  interviewing: {
    label: "Wawancara",
    description: "Tahap wawancara HR / user / tes teknis",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  offered: {
    label: "Negosiasi / Offer",
    description: "Penawaran kerja & pembahasan kompensasi",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  accepted: {
    label: "Diterima (Offer Accepted)",
    description: "Tawaran diterima resmi",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    description: "Lamaran belum berhasil atau posisi telah ditutup",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

