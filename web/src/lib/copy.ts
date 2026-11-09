/**
 * Kamus istilah terpusat dan fungsi formatting copy antarmuka SkillBridge.
 * Memastikan konsistensi gaya bahasa Indonesia yang hangat, bersahabat ("kamu"),
 * dan bebas dari jargon teknis.
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
    jobs: "Lowongan",
    insights: "Skill yang Paling Dicari",
    cv: "CV Saya",
    dashboard: "Dashboard",
    tracker: "Lamaran Saya",
    progress: "Rencana Belajar",
    profile: "Profil Saya",
  },

  // Disclaimer Resmi (Cukup 1 kalimat per halaman, tanpa banner)
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

  // Landing Page Copy
  landing: {
    statsJobs: "Lowongan aktif",
    statsFields: "Bidang dengan lowongan",
    statsPending: "Memuat data",
    previewTitle: "Hasil analisis CV",
    previewRoleLabel: "Posisi yang dituju",
    previewFound: ["SQL", "Python", "Excel", "Statistics"],
    previewMissing: ["Power BI", "Tableau", "R", "BigQuery"],
    demoUploadTitle: "Unggah CV",
    demoProcessTitle: "Membaca CV",
    demoDropHint: "Tarik CV ke sini",
    demoDropFormats: "PDF atau DOCX",
    demoFileName: "CV_Rina_Putri.pdf",
    demoFileSize: "248 KB",
    demoUploading: "Mengunggah…",
    demoUploaded: "Terunggah",
    demoReading: "Mencari skill di CV…",
    demoMatching: "Mencocokkan dengan 8 skill wajib Data Analyst",
    demoA11y: "Contoh alur: unggah CV, CV dibaca, lalu muncul hasil analisis. 4 dari 8 skill wajib Data Analyst sudah tercantum.",
    previewNext: "Tahu apa yang perlu disiapkan",
    previewNextDesc: "Simpan skill yang belum ditemukan ke rencana belajar, lalu perbarui CV-mu.",
    sceneExample: "Contoh",
    sceneCv: "CV kamu",
    sceneRole: "Data Analyst",
    sceneSkills: ["SQL", "Python", "Power BI"],
    sceneCvSkills: ["SQL", "Python", "Excel"],
    statsUnavailable: "Data belum tersedia",
    sceneFound: "Sudah tercantum",
    sceneMissing: "Belum ditemukan",
    sceneConnected: "Terhubung",
    sceneResult: "Contoh hasil",
    sceneCount: "4 dari 8 skill wajib sudah tercantum",
    sceneGap: "Power BI",
    sceneCvRead: "CV terbaca",
    sceneLearning: "Rencana belajar",
    sceneCourse: "Pelajari Power BI",
    // 1. Hero
    heroHeadingLine1: "Melamar bukan",
    heroHeadingLine2: "tebak-tebakan.",
    heroSubheading:
      "Lihat skill dan kriteria dari banyak lowongan di bidangmu dalam satu tempat, lalu cek mana yang sudah ada di CV\u2011mu sebelum melamar.",
    heroCtaPrimary: "Mulai gratis",
    heroCtaSecondary: "Lihat lowongan",
    heroFieldDataTitle: "Data & Analitik",
    heroFieldDataChips: ["SQL", "Python", "Power BI", "Excel"] as const,
    heroFieldEngineeringTitle: "Software Engineering",
    heroFieldEngineeringChips: ["React", "TypeScript", "Node.js", "Go"] as const,
    heroFieldDesignTitle: "Produk & Desain",
    heroFieldDesignChips: ["UI/UX", "Figma", "Research", "Wireframe"] as const,

    // 2. Masalah
    problemTitle: "Cari kerja seharusnya tidak semelelahkan ini.",
    problemCard1Title: "Satu lowongan, satu kali baca",
    problemCard1Desc:
      "Kamu harus membuka lowongan satu per satu hanya untuk tahu skill dan kriteria yang diminta.",
    problemCard2Title: "Layak atau belum?",
    problemCard2Desc:
      "Daftar persyaratannya panjang. Sulit menilai sendiri apakah CV-mu sudah cukup.",
    problemCard3Title: "Ditolak tanpa kabar",
    problemCard3Desc:
      "Lamaran tidak dibalas, dan kamu tidak tahu apa yang perlu diperbaiki.",
    problemPunchline:
      "Bukan kamu yang kurang berusaha. Informasinya saja yang tidak pernah sampai.",

    // 3. Solusi (SkillBridge sebagai pemandu)
    solutionTitle: "SkillBridge merangkumnya untukmu.",
    solutionItem1Before: "Membuka lowongan satu per satu",
    solutionItem1After: "Skill dan kriteria dari banyak lowongan dirangkum per bidang.",
    solutionItem2Before: "Menebak apakah CV-mu cukup",
    solutionItem2After: "Unggah CV, lalu lihat skill mana yang sudah ada dan mana yang belum.",
    solutionItem3Before: "Menunggu kabar yang tidak datang",
    solutionItem3After: "Tanpa menunggu kabar, kamu sudah tahu apa yang bisa disiapkan.",
    solutionCardJob1: "Data Analyst",
    solutionCardJob1Chips: ["SQL", "Excel", "Python"] as const,
    solutionCardJob2: "Business Intelligence",
    solutionCardJob2Chips: ["Power BI", "Tableau", "SQL"] as const,
    solutionCardJob3: "Analytics Engineer",
    solutionCardJob3Chips: ["Python", "Data Modeling", "Git"] as const,
    solutionSummaryTitle: "Keahlian Terangkum",
    solutionSummarySkills: [
      "SQL",
      "Python",
      "Tableau",
      "Power BI",
      "Excel",
      "Data Modeling",
    ] as const,

    // 4. Bidang Kerja
    fieldsTitle: "Mulai dari bidang yang kamu tuju.",
    fieldsJobsSuffix: "lowongan",
    fieldsViewPositions: "Lihat posisi",

    // 5. Cara Kerja
    howItWorksTitle: "Tiga langkah, lalu kamu tahu harus mulai dari mana.",
    howItWorksStep1Number: "1",
    howItWorksStep1Title: "Unggah CV",
    howItWorksStep1Desc: "PDF atau Word. Periksa dan koreksi skill yang terbaca.",
    howItWorksStep2Number: "2",
    howItWorksStep2Title: "Lihat skill yang diminta",
    howItWorksStep2Desc:
      "Bandingkan dengan lowongan asli di bidang yang kamu tuju.",
    howItWorksStep3Number: "3",
    howItWorksStep3Title: "Siapkan yang masih kurang",
    howItWorksStep3Desc:
      "Simpan skill yang perlu dipelajari dan pantau lamaranmu.",

    // 6. Bisa Dipercaya
    trustPoint1Title: "Lowongan asli",
    trustPoint1Desc: "Setiap lowongan menaut ke sumbernya.",
    trustPoint2Title: "CV-mu privat",
    trustPoint2Desc: "Disimpan aman dan bisa kamu hapus kapan saja.",
    trustPoint3Title: "Gratis",
    trustPoint3Desc: "Tanpa biaya untuk pencari kerja.",
    trustBottomLine:
      "Informasi soal skill yang dicari seharusnya bisa didapat siapa pun, bukan hanya yang punya orang dalam.",

    // 7. Penutup / Closing
    closingTitle: "Jadi kandidat yang tahu apa yang kamu tawarkan.",
    closingSubtitle: "Mulai dari CV yang kamu punya sekarang.",
    closingCtaPrimary: "Mulai gratis",
  },
} as const;

/**
 * Normalisasi dan formatting nilai persentase agar selalu aman dalam rentang 0 - 100%.
 * Menangani format desimal/rasio (0.35 -> 35), persen normal (35 -> 35),
 * maupun nilai yang terlanjur terkalikan ganda (4100 -> 41, 10000 -> 100).
 */
export function formatPercent(val?: number | null): number {
  if (val == null || isNaN(val) || val <= 0) return 0;
  // Rasio 0 < val <= 1 (misal 0.35 -> 35)
  if (val <= 1) return Math.min(100, Math.round(val * 100));
  // Nilai persen standar 1 < val <= 100 (misal 41 -> 41)
  if (val <= 100) return Math.min(100, Math.round(val));
  // Nilai terkalikan dua kali (misal 4100 -> 41, 10000 -> 100, 2400 -> 24)
  if (val <= 10000) return Math.min(100, Math.round(val / 100));
  return 100;
}
