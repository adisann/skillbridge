/**
 * Kamus istilah terpusat dan fungsi formatting copy antarmuka SkillBridge.
 * Memastikan konsistensi gaya bahasa Indonesia yang hangat, bersahabat ("kamu"),
 * dan bebas dari jargon statistik (misal: "Sampel N = ...").
 */

export const UI_COPY = {
  // Label Navigasi & Sidebar
  nav: {
    dashboard: "Dashboard",
    cv: "CV Saya",
    insights: "Tren Skill",
    jobs: "Lowongan",
    tracker: "Lamaran Saya",
    progress: "Rencana Belajar",
    profile: "Profil Saya",
    admin: "Admin Panel",
    designSystem: "Design System",
  },

  // Judul Utama Halaman
  titles: {
    jobs: "Cari Lowongan",
    insights: "Skill yang Paling Dicari",
    cv: "Koreksi CV & Kualifikasi",
    dashboard: "Dashboard",
    tracker: "Lamaran Saya",
    progress: "Rencana Belajar & Simpanan Lowongan",
    profile: "Profil Saya",
  },

  // Disclaimer Resmi Transparan (Cukup 1 kalimat per halaman, tanpa banner berlebihan)
  disclaimers: {
    score: "Skor menunjukkan kecocokan CV dengan persyaratan, bukan peluang diterima.",
    insights: "Dihitung dari lowongan yang kami kumpulkan, bukan seluruh pasar kerja.",
  },

  // Label Status Kecocokan & Autentikasi
  status: {
    insufficientEvidence: "Belum ada skor",
    insufficientEvidencePrompt: "Belum ada skor · Unggah CV",
    protectedPage: "Masuk dulu untuk melihat halaman ini",
    demoLoginButton: "Coba dengan akun demo",
  },

  // Hero Landing Page
  landing: {
    heroBadge: "Pencocokan CV dengan lowongan nyata",
    heroHeading: "Ketahui Posisi CV-mu di Hadapan Lowongan Kerja Nyata",
    heroSubheading:
      "SkillBridge menganalisis kualifikasi CV-mu terhadap puluhan lowongan kerja aktif secara transparan. Temukan keahlian yang sudah cocok, keahlian yang belum ditemukan, serta rekomendasi langkah belajar yang terarah.",
  },
} as const;

/**
 * Format jumlah lowongan aktif untuk dashboard
 * Contoh: "45 lowongan aktif untuk Data Analyst"
 */
export function formatDashboardActiveJobs(count: number, role?: string | null): string {
  if (role && role !== "all" && role !== "semua bidang") {
    return `${count} lowongan aktif untuk ${role}`;
  }
  return `${count} lowongan aktif`;
}

/**
 * Format ringkasan data pasar di halaman insights
 * Contoh: "Berdasarkan 23 lowongan aktif · diperbarui 4 Nov 2026"
 */
export function formatInsightsDataSummary(count: number, dateStr: string): string {
  return `Berdasarkan ${count} lowongan aktif · diperbarui ${dateStr}`;
}

/**
 * Format jumlah hasil pencarian lowongan
 * Contoh: "45 lowongan ditemukan"
 */
export function formatJobsFound(count: number): string {
  return `${count} lowongan ditemukan`;
}

/**
 * Format frekuensi kebutuhan skill
 * Contoh: "Diminta di 8 dari 23 lowongan"
 */
export function formatSkillDemand(
  count: number,
  totalN: number,
  percentage?: number
): { text: string; percentageText?: string } {
  const text = `Diminta di ${count} dari ${totalN} lowongan`;
  const percentageText = percentage !== undefined ? `${percentage}%` : undefined;
  return { text, percentageText };
}

