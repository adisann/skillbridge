export type RoleCategory =
  | 'Data Analyst'
  | 'BI Analyst'
  | 'Product Analyst'
  | 'UI/UX Designer';

export type WorkType = 'Hybrid' | 'Remote' | 'On-site';
export type SeniorityLevel = 'Entry-Level' | 'Junior' | 'Mid-Level' | 'Senior';

export type MatchStatus =
  | 'Match'
  | 'Underqualified'
  | 'Potentially Overqualified'
  | 'Insufficient Evidence';

export type EvidenceState = 'proven' | 'unverified' | 'self_claimed';

export interface SkillDictionaryEntry {
  id: string;
  canonicalName: string;
  category: 'Teknis Utama' | 'Visualisasi & BI' | 'Metode & Riset' | 'Soft Skill & Bisnis';
  synonyms: string[];
  description: string;
  estimatedStudyWeeks: number;
  recommendedProofAction: string;
  rolesRelevant: RoleCategory[];
}

export interface UserSkillItem {
  skillId: string;
  evidenceState: EvidenceState;
  cvExcerpt: string;
  yearsUsed?: number;
}

export interface CVProfile {
  id: string;
  personaBadge: string;
  fullName: string;
  headline: string;
  targetRole: RoleCategory;
  preferredLocation: string;
  preferredWorkType: string;
  yearsOfExperience: number;
  educationLevel: 'SMA/SMK' | 'D3' | 'S1 / D4' | 'S2';
  educationMajor: string;
  universityOrSchool: string;
  fileName: string;
  uploadedAt: string;
  summaryBio: string;
  skills: UserSkillItem[];
}

export interface JobSkillRequirement {
  skillId: string;
  rawMention: string;
  contextQuote: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  industry: string;
  location: string;
  workType: WorkType;
  seniority: SeniorityLevel;
  roleCategory: RoleCategory;
  minYearsExp: number;
  maxYearsExp: number;
  minEducation: 'SMA/SMK' | 'D3' | 'S1 / D4' | 'S2';
  salaryRange: string;
  postedDate: string;
  capturedDate: string;
  sourcePlatform: string;
  sourceUrl: string;
  isCuratedVerified: boolean;
  shortDescription: string;
  mandatorySkills: JobSkillRequirement[];
  optionalSkills: JobSkillRequirement[];
}

export interface ScoringWeights {
  mandatorySkills: number; // default 50
  optionalSkills: number; // default 20
  experience: number; // default 20
  education: number; // default 10
}

export interface RequirementEvaluation {
  skillId: string;
  canonicalName: string;
  importance: 'Wajib' | 'Tambahan';
  rawMention: string;
  contextQuote: string;
  status: 'matched' | 'missing' | 'insufficient';
  cvEvidenceText: string;
}

export interface JobMatchEvaluation {
  jobId: string;
  overallScore: number;
  status: MatchStatus;
  statusLabelId: string;
  statusSummary: string;
  componentBreakdown: {
    mandatoryScore: number;
    optionalScore: number;
    experienceScore: number;
    educationScore: number;
  };
  matchedRequirements: RequirementEvaluation[];
  missingRequirements: RequirementEvaluation[];
  insufficientRequirements: RequirementEvaluation[];
  supportingFactors: string[];
  reducingFactors: string[];
}

export interface LearningPlanItem {
  id: string;
  skillId: string;
  addedFromRole: RoleCategory;
  progress: 'Belum Mulai' | 'Sedang Dipelajari' | 'Siap Ditambahkan ke CV';
  targetNote: string;
  updatedAt: string;
}

export type JobTrackingStage =
  | 'Tersimpan'
  | 'Akan Dilamar'
  | 'Sudah Dilamar'
  | 'Wawancara'
  | 'Penawaran'
  | 'Diterima'
  | 'Ditolak';

export interface JobTrackingEntry {
  stage: JobTrackingStage;
  priority: 1 | 2 | 3 | 4 | 5;
}

export const SKILL_DICTIONARY: SkillDictionaryEntry[] = [
  {
    id: 'sql',
    canonicalName: 'SQL & Query Database',
    category: 'Teknis Utama',
    synonyms: ['SQL', 'PostgreSQL', 'MySQL', 'BigQuery SQL', 'T-SQL', 'Relational Database'],
    description: 'Kemampuan mengambil, menggabungkan (JOIN), dan mengagregasi data dari database relasional.',
    estimatedStudyWeeks: 2,
    recommendedProofAction: 'Tulis studi kasus analisis dataset publik menggunakan CTE & Window Functions di portofolio.',
    rolesRelevant: ['Data Analyst', 'BI Analyst', 'Product Analyst'],
  },
  {
    id: 'excel',
    canonicalName: 'Spreadsheet & Advanced Excel',
    category: 'Teknis Utama',
    synonyms: ['Microsoft Excel', 'Google Sheets', 'Pivot Table', 'VLOOKUP / XLOOKUP', 'Power Query'],
    description: 'Pengolahan data tabular, pembersihan data cepat, serta pemodelan laporan menggunakan rumus lanjutan.',
    estimatedStudyWeeks: 1,
    recommendedProofAction: 'Cantumkan contoh otomasi laporan atau dashboard Excel interaktif beserta ukuran baris data.',
    rolesRelevant: ['Data Analyst', 'BI Analyst', 'Product Analyst'],
  },
  {
    id: 'dataviz',
    canonicalName: 'Visualisasi Data & Dashboard BI',
    category: 'Visualisasi & BI',
    synonyms: ['Tableau', 'Power BI', 'Looker Studio', 'Google Data Studio', 'Metabase', 'Dashboarding'],
    description: 'Merancang visualisasi metrik dan dashboard interaktif untuk memantau KPI bisnis.',
    estimatedStudyWeeks: 3,
    recommendedProofAction: 'Publikasikan minimal 1 dashboard interaktif di Tableau Public atau Looker Studio dan tautkan di CV.',
    rolesRelevant: ['Data Analyst', 'BI Analyst', 'Product Analyst'],
  },
  {
    id: 'python',
    canonicalName: 'Python untuk Analisis Data',
    category: 'Teknis Utama',
    synonyms: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter Notebook'],
    description: 'Eksplorasi data skala besar, pembersihan data terprogram, dan analisis statistik menggunakan Python.',
    estimatedStudyWeeks: 4,
    recommendedProofAction: 'Sertakan repositori GitHub atau Google Colab yang menampilkan alur EDA (Exploratory Data Analysis).',
    rolesRelevant: ['Data Analyst', 'BI Analyst', 'Product Analyst'],
  },
  {
    id: 'stats',
    canonicalName: 'Analisis Statistik & Hipotesis',
    category: 'Metode & Riset',
    synonyms: ['Statistika', 'Uji Hipotesis', 'Regresi', 'Inferensi Statistik', 'Distribusi Data', 'R Studio'],
    description: 'Penerapan metode statistik deskriptif dan inferensial untuk menarik kesimpulan berbasis bukti.',
    estimatedStudyWeeks: 3,
    recommendedProofAction: 'Jelaskan metode uji statistik yang pernah dipakai pada skripsi, riset, atau proyek bisnis.',
    rolesRelevant: ['Data Analyst', 'Product Analyst'],
  },
  {
    id: 'communication',
    canonicalName: 'Komunikasi Bisnis & Data Storytelling',
    category: 'Soft Skill & Bisnis',
    synonyms: ['Data Storytelling', 'Presentasi Eksekutif', 'Stakeholder Communication', 'Business Acumen', 'Penyusunan Insight'],
    description: 'Menerjemahkan temuan angka menjadi rekomendasi bisnis yang mudah dipahami lintas divisi.',
    estimatedStudyWeeks: 2,
    recommendedProofAction: 'Tambahkan poin hasil nyata di CV, misalnya: "Mempresentasikan rekomendasi efisiensi biaya 12% ke tim produk".',
    rolesRelevant: ['Data Analyst', 'BI Analyst', 'Product Analyst', 'UI/UX Designer'],
  },
  {
    id: 'etl',
    canonicalName: 'Data Modeling & ETL Pipeline',
    category: 'Teknis Utama',
    synonyms: ['ETL', 'ELT', 'Data Warehouse', 'dbt', 'Data Modeling', 'Star Schema', 'Airflow'],
    description: 'Merancang struktur tabel analitik dan proses transformasi data terjadwal yang bersih.',
    estimatedStudyWeeks: 4,
    recommendedProofAction: 'Jelaskan arsitektur skema data (misal Star Schema) atau pipeline pembersihan data yang pernah dibuat.',
    rolesRelevant: ['BI Analyst', 'Data Analyst'],
  },
  {
    id: 'abtesting',
    canonicalName: 'Eksperimen Produk & A/B Testing',
    category: 'Metode & Riset',
    synonyms: ['A/B Testing', 'Product Experimentation', 'Funnel Analysis', 'Cohort Analysis', 'Retention Metrics'],
    description: 'Mengevaluasi perubahan fitur produk melalui metrik konversi, retensi, dan uji eksperimen.',
    estimatedStudyWeeks: 3,
    recommendedProofAction: 'Tuliskan studi kasus analisis funnel konversi atau evaluasi fitur pada aplikasi digital.',
    rolesRelevant: ['Product Analyst', 'Data Analyst', 'UI/UX Designer'],
  },
  {
    id: 'uidesign',
    canonicalName: 'Desain Antarmuka (UI) & Prototyping',
    category: 'Visualisasi & BI',
    synonyms: ['Figma', 'Wireframing', 'Interactive Prototyping', 'Visual Hierarchy', 'Responsive Web Design'],
    description: 'Merancang tata letak layar yang jelas, konsisten, dan interaktif untuk perangkat desktop maupun mobile.',
    estimatedStudyWeeks: 3,
    recommendedProofAction: 'Sertakan tautan prototipe Figma interaktif dengan penjelasan alur layar utama.',
    rolesRelevant: ['UI/UX Designer'],
  },
  {
    id: 'uxresearch',
    canonicalName: 'User Research & Usability Testing',
    category: 'Metode & Riset',
    synonyms: ['Usability Testing', 'User Interview', 'Persona', 'Customer Journey Map', 'Heuristic Evaluation'],
    description: 'Menggali kebutuhan pengguna dan menguji kemudahan penggunaan desain secara langsung.',
    estimatedStudyWeeks: 2,
    recommendedProofAction: 'Cantumkan jumlah partisipan uji coba dan peningkatan tingkat keberhasilan tugas (task success rate).',
    rolesRelevant: ['UI/UX Designer', 'Product Analyst'],
  },
  {
    id: 'designsystem',
    canonicalName: 'Design System & Aksesibilitas (WCAG)',
    category: 'Teknis Utama',
    synonyms: ['Design System', 'Component Library', 'WCAG Accessibility', 'Design Tokens', 'Auto Layout'],
    description: 'Membangun komponen desain standar yang mudah digunakan kembali dan ramah bagi semua kelompok usia.',
    estimatedStudyWeeks: 3,
    recommendedProofAction: 'Dokumentasikan komponen UI beserta aturan kontras warna dan skala tipografi di portofolio.',
    rolesRelevant: ['UI/UX Designer'],
  },
];

export const SAMPLE_CV_PROFILES: CVProfile[] = [
  {
    id: 'cv-freshgrad',
    personaBadge: 'Mahasiswa / Fresh Graduate',
    fullName: 'Sari Rahmawati, S.Stat.',
    headline: 'Fresh Graduate Statistika • Fokus Entry-Level Data Analyst',
    targetRole: 'Data Analyst',
    preferredLocation: 'Semua Lokasi',
    preferredWorkType: 'Semua Tipe',
    yearsOfExperience: 1,
    educationLevel: 'S1 / D4',
    educationMajor: 'Statistika Terapan',
    universityOrSchool: 'Universitas Negeri Semarang',
    fileName: 'CV_Sari_Rahmawati_DataAnalyst_2026.pdf',
    uploadedAt: '2 November 2026, 09:15 WIB',
    summaryBio:
      'Lulusan baru S1 Statistika dengan pengalaman magang 6 bulan dan proyek analisis data akademik. Terbiasa mengolah data menggunakan SQL dan Excel serta menyusun laporan statistik.',
    skills: [
      {
        skillId: 'sql',
        evidenceState: 'proven',
        cvExcerpt: 'Magang Analis Data: Menulis query PostgreSQL (JOIN, GROUP BY, CTE) untuk mengekstrak 120.000 baris transaksi harian.',
        yearsUsed: 1,
      },
      {
        skillId: 'excel',
        evidenceState: 'proven',
        cvExcerpt: 'Mengotomatisasi rekap mingguan divisi operasional menggunakan Pivot Table dan XLOOKUP, memangkas waktu laporan 40%.',
        yearsUsed: 2,
      },
      {
        skillId: 'stats',
        evidenceState: 'proven',
        cvExcerpt: 'Tugas Akhir: Menerapkan uji regresi logistik & uji hipotesis pada 3.400 sampel survei pelanggan.',
        yearsUsed: 2,
      },
      {
        skillId: 'communication',
        evidenceState: 'proven',
        cvExcerpt: 'Mempresentasikan ringkasan temuan survei kepuasan pengguna kepada kepala departemen setiap akhir bulan.',
        yearsUsed: 1,
      },
      {
        skillId: 'python',
        evidenceState: 'unverified',
        cvExcerpt: 'Tertulis kata "Python" pada daftar keahlian di sidebar CV, namun belum ditemukan rincian proyek atau pustaka yang digunakan.',
        yearsUsed: 0,
      },
    ],
  },
  {
    id: 'cv-senior',
    personaBadge: 'Pencari Kerja Berpengalaman',
    fullName: 'Budi Santoso, M.Kom.',
    headline: 'Senior Data & Business Intelligence Specialist (6 Tahun Pengalaman)',
    targetRole: 'Data Analyst',
    preferredLocation: 'Semua Lokasi',
    preferredWorkType: 'Semua Tipe',
    yearsOfExperience: 6,
    educationLevel: 'S2',
    educationMajor: 'Sistem Informasi & Analitik Bisnis',
    universityOrSchool: 'Institut Teknologi Bandung',
    fileName: 'CV_Budi_Santoso_SeniorBI_2026.pdf',
    uploadedAt: '2 November 2026, 09:20 WIB',
    summaryBio:
      'Praktisi analitik data dengan 6 tahun pengalaman memimpin arsitektur BI, pemodelan data warehouse, eksperimen produk, dan dashboard eksekutif di industri fintech dan e-commerce.',
    skills: [
      {
        skillId: 'sql',
        evidenceState: 'proven',
        cvExcerpt: 'Mengoptimalkan query BigQuery SQL & PostgreSQL skala jutaan baris untuk pelaporan keuangan real-time.',
        yearsUsed: 6,
      },
      {
        skillId: 'excel',
        evidenceState: 'proven',
        cvExcerpt: 'Menyusun pemodelan finansial dan template forecasting bisnis lintas unit usaha.',
        yearsUsed: 6,
      },
      {
        skillId: 'dataviz',
        evidenceState: 'proven',
        cvExcerpt: 'Merancang 35+ dashboard KPI eksekutif menggunakan Tableau dan Power BI untuk jajaran direksi.',
        yearsUsed: 5,
      },
      {
        skillId: 'python',
        evidenceState: 'proven',
        cvExcerpt: 'Membangun skrip otomatis pembersihan data dan segmentasi pelanggan menggunakan Python (Pandas & Scikit-learn).',
        yearsUsed: 5,
      },
      {
        skillId: 'stats',
        evidenceState: 'proven',
        cvExcerpt: 'Merancang metodologi evaluasi statistik dan pemodelan prediktif retensi pengguna.',
        yearsUsed: 5,
      },
      {
        skillId: 'communication',
        evidenceState: 'proven',
        cvExcerpt: 'Memimpin rapat tinjauan metrik mingguan bersama VP Product, Marketing, dan Operations.',
        yearsUsed: 6,
      },
      {
        skillId: 'etl',
        evidenceState: 'proven',
        cvExcerpt: 'Merancang pipeline ELT dengan dbt dan skema Star Schema pada Enterprise Data Warehouse.',
        yearsUsed: 4,
      },
      {
        skillId: 'abtesting',
        evidenceState: 'proven',
        cvExcerpt: 'Mengevaluasi 20+ eksperimen A/B testing fitur pembayaran yang meningkatkan konversi 8,4%.',
        yearsUsed: 4,
      },
    ],
  },
  {
    id: 'cv-minimal',
    personaBadge: 'CV Ringkas',
    fullName: 'Andi Pratama',
    headline: 'Kandidat Umum • CV Ringkas Tanpa Deskripsi Proyek',
    targetRole: 'Data Analyst',
    preferredLocation: 'Semua Lokasi',
    preferredWorkType: 'Semua Tipe',
    yearsOfExperience: 0,
    educationLevel: 'S1 / D4',
    educationMajor: 'Manajemen Umum',
    universityOrSchool: 'Universitas Diponegoro',
    fileName: 'CV_Andi_Pratama_Ringkas.docx',
    uploadedAt: '2 November 2026, 09:25 WIB',
    summaryBio:
      'CV hanya berisi biodata singkat dan daftar poin keterampilan tanpa penjelasan proyek, konteks tugas, maupun hasil kerja yang dapat diverifikasi.',
    skills: [
      {
        skillId: 'excel',
        evidenceState: 'unverified',
        cvExcerpt: 'Hanya tertulis "Microsoft Office / Excel" tanpa keterangan rumus atau pengolahan data yang pernah dikerjakan.',
      },
      {
        skillId: 'sql',
        evidenceState: 'unverified',
        cvExcerpt: 'Hanya tertulis "Dasar SQL" pada daftar minat tanpa bukti mata kuliah, sertifikat, atau proyek.',
      },
      {
        skillId: 'communication',
        evidenceState: 'unverified',
        cvExcerpt: 'Tertulis "Mampu berkomunikasi dengan baik" tanpa contoh pengalaman organisasi atau kerja.',
      },
    ],
  },
];

export const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job-da-01',
    title: 'Junior Data Analyst (Fresh Graduate Welcome)',
    company: 'Nusantara Retail Tech',
    industry: 'E-Commerce & Ritel',
    location: 'Jakarta Selatan',
    workType: 'Hybrid',
    seniority: 'Entry-Level',
    roleCategory: 'Data Analyst',
    minYearsExp: 0,
    maxYearsExp: 2,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 7.500.000 – Rp 10.000.000',
    postedDate: '30 Oktober 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Portal Karir Resmi NusantaraTech (Dataset Terkurasi)',
    sourceUrl: 'https://careers.nusantararetail.example.id/jobs/jr-data-analyst',
    isCuratedVerified: true,
    shortDescription:
      'Mendukung tim komersial dalam mengekstrak data transaksi harian, menyusun rekapitulasi performa kampanye, dan menyajikan insight mingguan.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'SQL (PostgreSQL / BigQuery)',
        contextQuote: 'Wajib menguasai query SQL dasar hingga menengah (JOIN, agregasi, filtering) untuk penarikan data transaksi.',
      },
      {
        skillId: 'excel',
        rawMention: 'Microsoft Excel / Google Sheets',
        contextQuote: 'Mahir mengolah data menggunakan Pivot Table, XLOOKUP, dan formula logika untuk laporan operasional.',
      },
      {
        skillId: 'stats',
        rawMention: 'Dasar Analisis Statistik',
        contextQuote: 'Memahami konsep statistik deskriptif, tren pertumbuhan, dan pembacaan distribusi data penjualan.',
      },
      {
        skillId: 'communication',
        rawMention: 'Komunikasi & Presentasi Insight',
        contextQuote: 'Mampu menjelaskan temuan data secara runtut kepada tim bisnis non-teknis.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'dataviz',
        rawMention: 'Looker Studio / Tableau Dasar',
        contextQuote: 'Nilai tambah jika pernah membuat grafik atau dashboard di Looker Studio atau Tableau.',
      },
      {
        skillId: 'python',
        rawMention: 'Python (Pandas)',
        contextQuote: 'Nilai tambah jika familiar dengan penggunaan Python untuk pembersihan data.',
      },
    ],
  },
  {
    id: 'job-da-02',
    title: 'Data Analyst — Commercial & Growth',
    company: ' SinarFin Digital Indonesia',
    industry: 'Fintech & Pembayaran',
    location: 'Jakarta Pusat',
    workType: 'Hybrid',
    seniority: 'Junior',
    roleCategory: 'Data Analyst',
    minYearsExp: 1,
    maxYearsExp: 3,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 9.500.000 – Rp 13.500.000',
    postedDate: '29 Oktober 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Katalog Mitra Kampus Merdeka (Dataset Legal)',
    sourceUrl: 'https://talent.sinarfin.example.id/openings/da-growth-2026',
    isCuratedVerified: true,
    shortDescription:
      'Menganalisis perilaku transaksi pengguna aplikasi pembayaran, merancang dashboard pemantauan KPI, serta mengidentifikasi peluang pertumbuhan.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'PostgreSQL / SQL',
        contextQuote: 'Wajib mahir menulis query SQL kompleks untuk analisis transaksi pengguna.',
      },
      {
        skillId: 'dataviz',
        rawMention: 'Tableau atau Power BI',
        contextQuote: 'Wajib memiliki pengalaman membangun dashboard interaktif menggunakan Tableau atau Power BI.',
      },
      {
        skillId: 'python',
        rawMention: 'Python (Pandas & NumPy)',
        contextQuote: 'Wajib mampu melakukan eksplorasi dan pembersihan data menggunakan Python.',
      },
      {
        skillId: 'communication',
        rawMention: 'Data Storytelling',
        contextQuote: 'Dapat menyusun narasi rekomendasi bisnis yang jelas bagi manajer produk.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'abtesting',
        rawMention: 'Evaluasi Kampanye / A/B Testing',
        contextQuote: 'Diutamakan yang memahami evaluasi eksperimen promo atau A/B testing.',
      },
      {
        skillId: 'excel',
        rawMention: 'Advanced Spreadsheet',
        contextQuote: 'Terbiasa menyajikan simulasi angka cepat di Google Sheets / Excel.',
      },
    ],
  },
  {
    id: 'job-da-03',
    title: 'Supply Chain & Operations Data Analyst',
    company: 'Logistik Cepat Nusantara',
    industry: 'Logistik & Rantai Pasok',
    location: 'Bandung',
    workType: 'Remote',
    seniority: 'Entry-Level',
    roleCategory: 'Data Analyst',
    minYearsExp: 0,
    maxYearsExp: 2,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 7.000.000 – Rp 9.500.000',
    postedDate: '31 Oktober 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Bursa Kerja Digital Jawa Barat (Izin Terbuka)',
    sourceUrl: 'https://karir.logistikcepat.example.id/ops-data-analyst',
    isCuratedVerified: true,
    shortDescription:
      'Memantau ketepatan waktu pengiriman (SLA), menganalisis rute gudang, dan memvisualisasikan performa armada harian.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'SQL Querying',
        contextQuote: 'Menguasai SQL untuk menarik log pengiriman dari database operasional.',
      },
      {
        skillId: 'excel',
        rawMention: 'Excel & Power Query',
        contextQuote: 'Wajib menguasai Excel tingkat lanjut untuk rekapitulasi SLA harian.',
      },
      {
        skillId: 'dataviz',
        rawMention: 'Power BI / Looker Studio',
        contextQuote: 'Mampu membuat visualisasi metrik operasional gudang secara berkala.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'stats',
        rawMention: 'Peramalan Permintaan (Forecasting)',
        contextQuote: 'Nilai tambah apabila memahami dasar statistik untuk estimasi volume paket.',
      },
      {
        skillId: 'communication',
        rawMention: 'Koordinasi Tim Operasional',
        contextQuote: 'Komunikatif dalam menyampaikan anomali data ke kepala gudang.',
      },
    ],
  },
  {
    id: 'job-da-04',
    title: 'Mid-Level Risk & Credit Data Analyst',
    company: 'Bank Mandiri Sejahtera Digital',
    industry: 'Perbankan Digital',
    location: 'Jakarta Selatan',
    workType: 'On-site',
    seniority: 'Mid-Level',
    roleCategory: 'Data Analyst',
    minYearsExp: 3,
    maxYearsExp: 5,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 14.000.000 – Rp 19.000.000',
    postedDate: '28 Oktober 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Portal Rekrutmen Perbankan (Kurasi Admin)',
    sourceUrl: 'https://karir.bmsdigital.example.id/risk-data-analyst',
    isCuratedVerified: true,
    shortDescription:
      'Mengembangkan pemodelan analisis risiko kredit, memantau portofolio pinjaman, dan membangun pipeline pelaporan regulasi.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'Advanced SQL & T-SQL',
        contextQuote: 'Pengalaman minimal 3 tahun mengolah data portofolio kredit dengan SQL.',
      },
      {
        skillId: 'python',
        rawMention: 'Python untuk Pemodelan Risiko',
        contextQuote: 'Wajib menguasai Python untuk analisis kohort gagal bayar dan pengolahan statistik.',
      },
      {
        skillId: 'stats',
        rawMention: 'Statistika Inferensial & Skor Kredit',
        contextQuote: 'Memahami regresi, distribusi probabilitas, dan validasi matriks risiko.',
      },
      {
        skillId: 'dataviz',
        rawMention: 'Tableau Enterprise',
        contextQuote: 'Membangun dashboard pemantauan kredit macet (NPL) untuk komite risiko.',
      },
      {
        skillId: 'etl',
        rawMention: 'Data Mart & ETL Workflow',
        contextQuote: 'Memahami proses penyiapan tabel agregasi risiko di data warehouse.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'communication',
        rawMention: 'Presentasi Komite Eksekutif',
        contextQuote: 'Mampu mempresentasikan temuan risiko secara tajam kepada manajemen.',
      },
    ],
  },
  {
    id: 'job-da-05',
    title: 'Healthcare & Public Policy Data Analyst',
    company: 'SehatTerpadu Initiative',
    industry: 'Kesehatan & Sociopreneurship',
    location: 'Yogyakarta',
    workType: 'Remote',
    seniority: 'Entry-Level',
    roleCategory: 'Data Analyst',
    minYearsExp: 0,
    maxYearsExp: 2,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 6.800.000 – Rp 9.200.000',
    postedDate: '1 November 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Jejaring Talenta Dampak Sosial',
    sourceUrl: 'https://sehatterpadu.example.org/careers/data-analyst',
    isCuratedVerified: true,
    shortDescription:
      'Mengolah data distribusi layanan kesehatan daerah, mengevaluasi program inklusi layanan medis, dan menyusun laporan publik yang transparan.',
    mandatorySkills: [
      {
        skillId: 'excel',
        rawMention: 'Spreadsheet & Pembersihan Data Survei',
        contextQuote: 'Terampil menstandarkan data survei lapangan menggunakan Excel / Google Sheets.',
      },
      {
        skillId: 'stats',
        rawMention: 'Metode Statistik & Evaluasi Dampak',
        contextQuote: 'Kuat dalam analisis statistik deskriptif, uji beda, dan pemetaan indikator demografi.',
      },
      {
        skillId: 'communication',
        rawMention: 'Penulisan Laporan & Visualisasi Kebijakan',
        contextQuote: 'Mampu menyusun ringkasan eksekutif yang mudah dipahami pemangku kepentingan daerah.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'sql',
        rawMention: 'SQL Database',
        contextQuote: 'Nilai tambah jika dapat melakukan query pada basis data rekam layanan.',
      },
      {
        skillId: 'dataviz',
        rawMention: 'Dashboard Publik (Looker Studio / Tableau)',
        contextQuote: 'Dapat memvisualisasikan peta sebaran layanan kesehatan.',
      },
    ],
  },
  {
    id: 'job-bi-01',
    title: 'Business Intelligence (BI) Analyst',
    company: 'Karya Pangan Makmur Tbk',
    industry: 'FMCG & Manufaktur',
    location: 'Surabaya',
    workType: 'Hybrid',
    seniority: 'Junior',
    roleCategory: 'BI Analyst',
    minYearsExp: 1,
    maxYearsExp: 3,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 9.000.000 – Rp 12.500.000',
    postedDate: '27 Oktober 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Portal Karir Industri Nasional (Kurasi Legal)',
    sourceUrl: 'https://karir.karyapangan.example.id/bi-analyst-surabaya',
    isCuratedVerified: true,
    shortDescription:
      'Merancang dan memelihara dashboard penjualan regional, menstandarkan definisi metrik bisnis, serta mengotomasi pipeline data mingguan.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'SQL & Stored Procedure',
        contextQuote: 'Wajib menguasai SQL untuk menggabungkan data distributor dari berbagai cabang.',
      },
      {
        skillId: 'dataviz',
        rawMention: 'Microsoft Power BI (DAX)',
        contextQuote: 'Wajib mahir membuat dashboard interaktif dan formula DAX di Power BI.',
      },
      {
        skillId: 'etl',
        rawMention: 'Data Modeling & Star Schema',
        contextQuote: 'Memahami perancangan model data dimensional (Fact & Dimension tables).',
      },
      {
        skillId: 'communication',
        rawMention: 'Kolaborasi Stakeholder Bisnis',
        contextQuote: 'Mampu menerjemahkan kebutuhan kepala penjualan wilayah menjadi metrik dashboard.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'excel',
        rawMention: 'Excel Power Pivot',
        contextQuote: 'Terbiasa mendampingi pengguna bisnis yang masih menggunakan Excel.',
      },
      {
        skillId: 'python',
        rawMention: 'Python Automation',
        contextQuote: 'Nilai tambah jika mampu menulis skrip otomasi validasi data.',
      },
    ],
  },
  {
    id: 'job-bi-02',
    title: 'Junior BI Developer & Reporting Analyst',
    company: 'EduPintar Nusantara',
    industry: 'EdTech & Pendidikan',
    location: 'Jakarta Selatan',
    workType: 'Remote',
    seniority: 'Entry-Level',
    roleCategory: 'BI Analyst',
    minYearsExp: 0,
    maxYearsExp: 2,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 8.000.000 – Rp 11.000.000',
    postedDate: '1 November 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Dataset Terbuka Asosiasi EdTech Indonesia',
    sourceUrl: 'https://edupintar.example.id/jobs/junior-bi-analyst',
    isCuratedVerified: true,
    shortDescription:
      'Membangun dashboard keterlibatan belajar siswa, menjaga konsistensi tabel pelaporan, dan mempercepat akses data bagi tim kurikulum.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'SQL (BigQuery / PostgreSQL)',
        contextQuote: 'Kuat dalam penulisan query SQL yang rapi dan terdokumentasi.',
      },
      {
        skillId: 'dataviz',
        rawMention: 'Tableau / Metabase / Looker Studio',
        contextQuote: 'Wajib memiliki portofolio pembuatan dashboard visualisasi data.',
      },
      {
        skillId: 'excel',
        rawMention: 'Google Sheets & Formula Analitik',
        contextQuote: 'Mampu membangun laporan cepat terhubung database di Google Sheets.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'etl',
        rawMention: 'Dasar dbt / Transformasi Data',
        contextQuote: 'Nilai tambah besar jika memahami konsep transformasi data terjadwal.',
      },
      {
        skillId: 'communication',
        rawMention: 'Presentasi Insight Pendidikan',
        contextQuote: 'Komunikatif dalam berdiskusi dengan tim riset pembelajaran.',
      },
    ],
  },
  {
    id: 'job-pa-01',
    title: 'Associate Product Analyst',
    company: 'PasarKreasi Digital',
    industry: 'Marketplace UMKM',
    location: 'Bandung',
    workType: 'Hybrid',
    seniority: 'Entry-Level',
    roleCategory: 'Product Analyst',
    minYearsExp: 0,
    maxYearsExp: 2,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 8.500.000 – Rp 12.000.000',
    postedDate: '30 Oktober 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Katalog Karir Startup Digital (Kurasi Admin)',
    sourceUrl: 'https://pasarkreasi.example.id/careers/associate-product-analyst',
    isCuratedVerified: true,
    shortDescription:
      'Menganalisis perjalanan pengguna (user funnel) penjual UMKM di aplikasi, merancang evaluasi eksperimen fitur, dan memberikan rekomendasi peningkatan konversi.',
    mandatorySkills: [
      {
        skillId: 'sql',
        rawMention: 'SQL untuk Event Tracking Data',
        contextQuote: 'Wajib menguasai SQL untuk menganalisis log klik dan funnel pengguna.',
      },
      {
        skillId: 'abtesting',
        rawMention: 'Funnel Analysis & A/B Testing',
        contextQuote: 'Memahami cara mengukur konversi fitur, retensi kohort, dan evaluasi A/B test.',
      },
      {
        skillId: 'stats',
        rawMention: 'Uji Signifikansi Statistik',
        contextQuote: 'Memahami p-value, confidence interval, dan ukuran sampel eksperimen.',
      },
      {
        skillId: 'communication',
        rawMention: 'Product Storytelling',
        contextQuote: 'Mampu bekerja berdampingan dengan Product Manager dan UI/UX Designer.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'dataviz',
        rawMention: 'Amplitude / Mixpanel / Tableau',
        contextQuote: 'Nilai tambah jika pernah menyusun dashboard produk.',
      },
      {
        skillId: 'python',
        rawMention: 'Python untuk Analisis Perilaku',
        contextQuote: 'Diutamakan yang dapat mengolah data eksperimen menggunakan Python.',
      },
    ],
  },
  {
    id: 'job-ux-01',
    title: 'Junior UI/UX Designer (Inclusive Digital Product)',
    company: 'AksesBersama Teknologi',
    industry: 'Teknologi Inklusif & Layanan Publik',
    location: 'Yogyakarta',
    workType: 'Hybrid',
    seniority: 'Entry-Level',
    roleCategory: 'UI/UX Designer',
    minYearsExp: 0,
    maxYearsExp: 2,
    minEducation: 'S1 / D4',
    salaryRange: 'Rp 7.200.000 – Rp 10.000.000',
    postedDate: '1 November 2026',
    capturedDate: '2 November 2026',
    sourcePlatform: 'Komunitas Desain Inklusif Indonesia (Dataset Legal)',
    sourceUrl: 'https://aksesbersama.example.id/karir/jr-uiux-designer',
    isCuratedVerified: true,
    shortDescription:
      'Merancang antarmuka aplikasi layanan publik yang jernih, kontras tinggi, dan mudah digunakan oleh semua kelompok usia dari pelajar hingga lansia.',
    mandatorySkills: [
      {
        skillId: 'uidesign',
        rawMention: 'Figma & Interactive Prototyping',
        contextQuote: 'Wajib menguasai pembuatan wireframe hingga prototipe interaktif di Figma.',
      },
      {
        skillId: 'uxresearch',
        rawMention: 'User Research & Usability Testing',
        contextQuote: 'Mampu merancang skenario uji pakai dan mewawancarai pengguna lintas usia.',
      },
      {
        skillId: 'designsystem',
        rawMention: 'Design System & Standar Aksesibilitas',
        contextQuote: 'Memahami aturan kontras warna, ukuran sentuh tombol, dan keterbacaan tipografi.',
      },
      {
        skillId: 'communication',
        rawMention: 'Presentasi Keputusan Desain',
        contextQuote: 'Dapat menjelaskan alasan di balik alur UX kepada tim pengembang dan klien.',
      },
    ],
    optionalSkills: [
      {
        skillId: 'abtesting',
        rawMention: 'Evaluasi Metrik UX & Funnel',
        contextQuote: 'Nilai tambah apabila memahami analisis konversi layar dan drop-off pengguna.',
      },
    ],
  },
];

export const DEFAULT_WEIGHTS: ScoringWeights = {
  mandatorySkills: 55,
  optionalSkills: 15,
  experience: 20,
  education: 10,
};

const EDUCATION_RANK: Record<CVProfile['educationLevel'], number> = {
  'SMA/SMK': 1,
  D3: 2,
  'S1 / D4': 3,
  S2: 4,
};

export function getSkillById(skillId: string): SkillDictionaryEntry | undefined {
  return SKILL_DICTIONARY.find((s) => s.id === skillId);
}

export function evaluateJobMatch(
  cv: CVProfile,
  job: JobListing,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): JobMatchEvaluation {
  const totalWeight =
    weights.mandatorySkills + weights.optionalSkills + weights.experience + weights.education || 100;

  const matchedRequirements: RequirementEvaluation[] = [];
  const missingRequirements: RequirementEvaluation[] = [];
  const insufficientRequirements: RequirementEvaluation[] = [];

  // Evaluate mandatory skills
  let mandatoryEarnedPoints = 0;
  for (const req of job.mandatorySkills) {
    const dict = getSkillById(req.skillId);
    const canonicalName = dict ? dict.canonicalName : req.rawMention;
    const userSkill = cv.skills.find((s) => s.skillId === req.skillId);

    if (!userSkill) {
      missingRequirements.push({
        skillId: req.skillId,
        canonicalName,
        importance: 'Wajib',
        rawMention: req.rawMention,
        contextQuote: req.contextQuote,
        status: 'missing',
        cvEvidenceText: 'Belum ditemukan pada dokumen CV yang diunggah.',
      });
    } else if (userSkill.evidenceState === 'proven') {
      mandatoryEarnedPoints += 1;
      matchedRequirements.push({
        skillId: req.skillId,
        canonicalName,
        importance: 'Wajib',
        rawMention: req.rawMention,
        contextQuote: req.contextQuote,
        status: 'matched',
        cvEvidenceText: userSkill.cvExcerpt,
      });
    } else {
      // unverified or self_claimed -> Insufficient evidence on CV (partial credit 0.45, flagged transparently)
      mandatoryEarnedPoints += 0.45;
      insufficientRequirements.push({
        skillId: req.skillId,
        canonicalName,
        importance: 'Wajib',
        rawMention: req.rawMention,
        contextQuote: req.contextQuote,
        status: 'insufficient',
        cvEvidenceText:
          userSkill.evidenceState === 'self_claimed'
            ? 'Ditandai dikuasai oleh Anda, namun belum tertulis bukti proyeknya di CV.'
            : userSkill.cvExcerpt,
      });
    }
  }

  // Evaluate optional skills
  let optionalEarnedPoints = 0;
  for (const req of job.optionalSkills) {
    const dict = getSkillById(req.skillId);
    const canonicalName = dict ? dict.canonicalName : req.rawMention;
    const userSkill = cv.skills.find((s) => s.skillId === req.skillId);

    if (!userSkill) {
      missingRequirements.push({
        skillId: req.skillId,
        canonicalName,
        importance: 'Tambahan',
        rawMention: req.rawMention,
        contextQuote: req.contextQuote,
        status: 'missing',
        cvEvidenceText: 'Belum ditemukan di CV (bersifat nilai tambah / opsional).',
      });
    } else if (userSkill.evidenceState === 'proven') {
      optionalEarnedPoints += 1;
      matchedRequirements.push({
        skillId: req.skillId,
        canonicalName,
        importance: 'Tambahan',
        rawMention: req.rawMention,
        contextQuote: req.contextQuote,
        status: 'matched',
        cvEvidenceText: userSkill.cvExcerpt,
      });
    } else {
      optionalEarnedPoints += 0.5;
      insufficientRequirements.push({
        skillId: req.skillId,
        canonicalName,
        importance: 'Tambahan',
        rawMention: req.rawMention,
        contextQuote: req.contextQuote,
        status: 'insufficient',
        cvEvidenceText:
          userSkill.evidenceState === 'self_claimed'
            ? 'Ditandai dikuasai oleh Anda, namun belum tertulis bukti proyeknya di CV.'
            : userSkill.cvExcerpt,
      });
    }
  }

  const mandatoryRatio =
    job.mandatorySkills.length > 0 ? mandatoryEarnedPoints / job.mandatorySkills.length : 1;
  const optionalRatio =
    job.optionalSkills.length > 0 ? optionalEarnedPoints / job.optionalSkills.length : 1;

  // Experience ratio
  let experienceRatio = 1;
  if (cv.yearsOfExperience < job.minYearsExp) {
    const gap = job.minYearsExp - cv.yearsOfExperience;
    experienceRatio = Math.max(0.25, 1 - gap * 0.3);
  }

  // Education ratio
  const userEduRank = EDUCATION_RANK[cv.educationLevel] ?? 3;
  const reqEduRank = EDUCATION_RANK[job.minEducation] ?? 3;
  const educationRatio = userEduRank >= reqEduRank ? 1 : 0.5;

  const mandatoryScore = Math.round(mandatoryRatio * weights.mandatorySkills);
  const optionalScore = Math.round(optionalRatio * weights.optionalSkills);
  const experienceScore = Math.round(experienceRatio * weights.experience);
  const educationScore = Math.round(educationRatio * weights.education);

  const rawTotal = mandatoryScore + optionalScore + experienceScore + educationScore;
  const overallScore = Math.min(100, Math.max(0, Math.round((rawTotal / totalWeight) * 100)));

  // Determine Operational Status according to Section 6 & AC-05
  const provenCount = cv.skills.filter((s) => s.evidenceState === 'proven').length;
  const mandatoryMatchedProvenCount = matchedRequirements.filter(
    (r) => r.importance === 'Wajib'
  ).length;
  const mandatoryMissingCount = missingRequirements.filter((r) => r.importance === 'Wajib').length;
  const mandatoryInsufficientCount = insufficientRequirements.filter(
    (r) => r.importance === 'Wajib'
  ).length;

  let status: MatchStatus = 'Match';
  let statusLabelId = 'Cocok (Match)';
  let statusSummary =
    'Sebagian besar persyaratan utama lowongan ini terbukti terpenuhi berdasarkan rincian di CV Anda.';

  if (
    provenCount === 0 ||
    (mandatoryInsufficientCount >= 2 && mandatoryMatchedProvenCount === 0)
  ) {
    status = 'Insufficient Evidence';
    statusLabelId = 'Bukti CV Belum Cukup (Insufficient Evidence)';
    statusSummary =
      'CV Anda mencantumkan nama keahlian, namun belum memuat rincian proyek atau konteks kerja yang memadai untuk disimpulkan.';
  } else if (
    cv.yearsOfExperience >= job.maxYearsExp + 3 &&
    mandatoryRatio >= 0.85 &&
    (job.seniority === 'Entry-Level' || job.seniority === 'Junior')
  ) {
    status = 'Potentially Overqualified';
    statusLabelId = 'Indikasi Melampaui Level (Potentially Overqualified)';
    statusSummary = `Pengalaman Anda (${cv.yearsOfExperience} tahun) dan kelengkapan kompetensi melampaui rentang level ${job.seniority} (${job.minYearsExp}–${job.maxYearsExp} tahun). Ini bukan penilaian negatif otomatis, melainkan indikasi bagi Anda untuk mempertimbangkan negosiasi peran.`;
  } else if (
    mandatoryMissingCount >= 1 ||
    cv.yearsOfExperience + 1 < job.minYearsExp ||
    overallScore < 72
  ) {
    status = 'Underqualified';
    statusLabelId = 'Perlu Penguatan Kompetensi (Underqualified)';
    statusSummary =
      'Masih terdapat persyaratan wajib atau durasi pengalaman yang belum ditemukan di CV Anda. Lihat rincian gap di bawah untuk menyusun prioritas belajar.';
  }

  const supportingFactors: string[] = [];
  const reducingFactors: string[] = [];

  if (mandatoryMatchedProvenCount > 0) {
    supportingFactors.push(
      `${mandatoryMatchedProvenCount} dari ${job.mandatorySkills.length} skill wajib terbukti kuat melalui deskripsi pengalaman/proyek di CV.`
    );
  }
  if (cv.yearsOfExperience >= job.minYearsExp) {
    supportingFactors.push(
      `Pengalaman kerja Anda (${cv.yearsOfExperience} tahun) memenuhi syarat minimum lowongan (${job.minYearsExp} tahun).`
    );
  }
  if (userEduRank >= reqEduRank) {
    supportingFactors.push(
      `Kualifikasi pendidikan (${cv.educationLevel} ${cv.educationMajor}) sesuai dengan persyaratan (${job.minEducation}).`
    );
  }

  if (mandatoryMissingCount > 0) {
    const missingNames = missingRequirements
      .filter((r) => r.importance === 'Wajib')
      .map((r) => r.canonicalName)
      .join(', ');
    reducingFactors.push(
      `${mandatoryMissingCount} skill wajib belum ditemukan di CV: ${missingNames}.`
    );
  }
  if (mandatoryInsufficientCount > 0) {
    const insuffNames = insufficientRequirements
      .filter((r) => r.importance === 'Wajib')
      .map((r) => r.canonicalName)
      .join(', ');
    reducingFactors.push(
      `${mandatoryInsufficientCount} skill wajib perlu bukti deskripsi lebih spesifik di CV: ${insuffNames}.`
    );
  }
  if (cv.yearsOfExperience < job.minYearsExp) {
    reducingFactors.push(
      `Durasi pengalaman di CV (${cv.yearsOfExperience} tahun) masih di bawah syarat minimum (${job.minYearsExp} tahun).`
    );
  }
  if (status === 'Potentially Overqualified') {
    reducingFactors.push(
      `Senioritas Anda (${cv.yearsOfExperience} tahun) jauh di atas target lowongan (${job.minYearsExp}–${job.maxYearsExp} tahun); pastikan ekspektasi kompensasi sesuai.`
    );
  }

  return {
    jobId: job.id,
    overallScore,
    status,
    statusLabelId,
    statusSummary,
    componentBreakdown: {
      mandatoryScore,
      optionalScore,
      experienceScore,
      educationScore,
    },
    matchedRequirements,
    missingRequirements,
    insufficientRequirements,
    supportingFactors,
    reducingFactors,
  };
}

export interface MarketSkillInsightItem {
  skillId: string;
  canonicalName: string;
  category: SkillDictionaryEntry['category'];
  synonyms: string[];
  postingCount: number; // n unique job postings
  mandatoryCount: number;
  optionalCount: number;
  totalSampleJobs: number; // N total filtered job postings
  percentage: number; // (n / N) * 100
  cvStatus: 'matched' | 'missing' | 'insufficient';
  priorityLevel: 'Prioritas Utama' | 'Prioritas Menengah' | 'Sudah Terbukti di CV' | 'Perlu Bukti Tambahan';
  sampleQuotes: { jobTitle: string; company: string; quote: string }[];
  estimatedStudyWeeks: number;
  recommendedProofAction: string;
}

/**
 * Menghitung frekuensi kemunculan skill pada level posting lowongan unik (bukan kata berulang di satu posting)
 * sesuai Bagian 7 & 8 dokumen User Requirements serta AC-03 & AC-04.
 */
export function calculateMarketSkillInsights(
  filteredJobs: JobListing[],
  cv: CVProfile
): MarketSkillInsightItem[] {
  const totalSampleJobs = filteredJobs.length;
  if (totalSampleJobs === 0) return [];

  const map = new Map<
    string,
    {
      postingIds: Set<string>;
      mandatoryIds: Set<string>;
      optionalIds: Set<string>;
      quotes: { jobTitle: string; company: string; quote: string }[];
    }
  >();

  for (const job of filteredJobs) {
    // Deduplicate skills within the same job posting (Section 8)
    const seenInThisJob = new Set<string>();

    for (const req of job.mandatorySkills) {
      if (!map.has(req.skillId)) {
        map.set(req.skillId, {
          postingIds: new Set(),
          mandatoryIds: new Set(),
          optionalIds: new Set(),
          quotes: [],
        });
      }
      const entry = map.get(req.skillId)!;
      if (!seenInThisJob.has(req.skillId)) {
        entry.postingIds.add(job.id);
        seenInThisJob.add(req.skillId);
      }
      entry.mandatoryIds.add(job.id);
      if (entry.quotes.length < 3) {
        entry.quotes.push({
          jobTitle: job.title,
          company: job.company,
          quote: req.contextQuote,
        });
      }
    }

    for (const req of job.optionalSkills) {
      if (!map.has(req.skillId)) {
        map.set(req.skillId, {
          postingIds: new Set(),
          mandatoryIds: new Set(),
          optionalIds: new Set(),
          quotes: [],
        });
      }
      const entry = map.get(req.skillId)!;
      if (!seenInThisJob.has(req.skillId)) {
        entry.postingIds.add(job.id);
        seenInThisJob.add(req.skillId);
      }
      entry.optionalIds.add(job.id);
      if (entry.quotes.length < 3) {
        entry.quotes.push({
          jobTitle: job.title,
          company: job.company,
          quote: req.contextQuote,
        });
      }
    }
  }

  const results: MarketSkillInsightItem[] = [];

  for (const [skillId, stats] of map.entries()) {
    const dict = getSkillById(skillId);
    if (!dict) continue;

    const postingCount = stats.postingIds.size;
    const mandatoryCount = stats.mandatoryIds.size;
    const optionalCount = stats.optionalIds.size;
    const percentage = Math.round((postingCount / totalSampleJobs) * 100);

    const userSkill = cv.skills.find((s) => s.skillId === skillId);
    let cvStatus: 'matched' | 'missing' | 'insufficient' = 'missing';
    if (userSkill) {
      cvStatus = userSkill.evidenceState === 'proven' ? 'matched' : 'insufficient';
    }

    let priorityLevel: MarketSkillInsightItem['priorityLevel'] = 'Sudah Terbukti di CV';
    if (cvStatus === 'missing') {
      priorityLevel =
        mandatoryCount > 0 || percentage >= 50 ? 'Prioritas Utama' : 'Prioritas Menengah';
    } else if (cvStatus === 'insufficient') {
      priorityLevel = 'Perlu Bukti Tambahan';
    }

    results.push({
      skillId,
      canonicalName: dict.canonicalName,
      category: dict.category,
      synonyms: dict.synonyms,
      postingCount,
      mandatoryCount,
      optionalCount,
      totalSampleJobs,
      percentage,
      cvStatus,
      priorityLevel,
      sampleQuotes: stats.quotes,
      estimatedStudyWeeks: dict.estimatedStudyWeeks,
      recommendedProofAction: dict.recommendedProofAction,
    });
  }

  return results.sort((a, b) => {
    if (b.postingCount !== a.postingCount) return b.postingCount - a.postingCount;
    return b.mandatoryCount - a.mandatoryCount;
  });
}
