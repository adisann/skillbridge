export const IS_MOCK_DATA = true;
export const MOCK_DISCLAIMER =
  "DATA SAMPEL DEMO (INVOFEST 2026) — Data lowongan dan profil ini dikurasi khusus untuk keperluan demonstrasi sistem.";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  targetRole: "Data Analyst" | "BI Analyst";
  activeResumeId: string;
}

export interface MockResume {
  id: string;
  candidateName: string;
  filename: string;
  uploadedAt: string;
  summary: string;
  education: string;
  experienceYears: number;
  skills: string[];
  type: "match" | "underqualified";
}

export interface ScoreComponent {
  label: string;
  weight: number; // e.g. 0.35
  score: number; // 0 - 100
  detail: string;
}

export interface RequirementItem {
  id: string;
  description: string;
  isMandatory: boolean;
  status: "cocok" | "belum_ditemukan" | "belum_cukup_bukti";
  evidenceInCV?: string;
  note?: string;
}

export interface MockJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  seniority: "Junior" | "Mid" | "Senior" | "Lead";
  role: "Data Analyst" | "BI Analyst";
  workType: "Remote" | "Hybrid" | "Onsite";
  sourceName: string;
  sourceUrl: string;
  retrievalMethod: "public_api" | "jobspy" | "admin_import" | "seed";
  retrievedAt: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  // Status Kecocokan terhadap CV aktif
  matchStatus: "match" | "underqualified" | "potentially_overqualified" | "insufficient_evidence";
  matchScore: number;
  scoreBreakdown: ScoreComponent[];
  requirementsList: RequirementItem[];
  factorsSupporting: string[];
  factorsLimiting: string[];
  matchedSkills: string[];
  missingSkills: string[];
  insufficientSkills: string[];
  isSaved?: boolean;
}

export interface MarketSkill {
  skillName: string;
  count: number; // n
  percentage: number;
  status: "found" | "missing" | "needs_verification";
  category: string;
  exampleRequirement: string;
}

export interface LearningItem {
  id: string;
  skillName: string;
  reason: string;
  resourceSuggestion: string;
  isDone: boolean;
  priority: "Tinggi" | "Menengah" | "Rendah";
}

export interface WorkerRun {
  id: string;
  sourceName: string;
  retrievalMethod: string;
  status: "success" | "failed";
  timestamp: string;
  fetchedCount: number;
  insertedCount: number;
  updatedCount: number;
  duplicateCount: number;
  failedCount: number;
  notes: string;
}

// -----------------------------------------------------------------------------
// Current Demo User
// -----------------------------------------------------------------------------
export const mockCurrentUser: MockUser = {
  id: "user-juri-01",
  name: "Budi Pratama (Akun Demo Juri)",
  email: "juri@skillbridge.demo",
  role: "Pelamar / Reviewer Lomba",
  targetRole: "Data Analyst",
  activeResumeId: "resume-match-01",
};

// -----------------------------------------------------------------------------
// Two Sample Resumes (AC-05: Match vs Underqualified)
// -----------------------------------------------------------------------------
export const mockResumes: Record<"match" | "underqualified", MockResume> = {
  match: {
    id: "resume-match-01",
    candidateName: "Budi Pratama",
    filename: "CV_Budi_Pratama_DataAnalyst.pdf",
    uploadedAt: "3 November 2026, 21:30 WIB",
    summary:
      "Lulusan Matematika & Statistika dengan 2 tahun pengalaman analisis data transaksi di industri perbankan digital. Terbiasa membangun data query di PostgreSQL, automasi script Python (Pandas), dan visualisasi data performa produk.",
    education: "S1 Matematika & Komputasi, Universitas Negeri",
    experienceYears: 2,
    skills: [
      "SQL",
      "PostgreSQL",
      "Python",
      "Pandas",
      "Microsoft Excel",
      "Data Visualization",
      "Statistics",
      "Data Modeling",
    ],
    type: "match",
  },
  underqualified: {
    id: "resume-underqualified-02",
    candidateName: "Rina Maharani",
    filename: "CV_Rina_FreshGraduate.pdf",
    uploadedAt: "3 November 2026, 22:00 WIB",
    summary:
      "Fresh graduate Manajemen Bisnis dengan ketertarikan pada pengolahan data spreadsheet dasar dan administrasi operasional. Berpengalaman magang menggunakan Microsoft Excel dan Google Sheets untuk pelaporan mingguan.",
    education: "S1 Manajemen Bisnis, Universitas Swasta",
    experienceYears: 0,
    skills: ["Microsoft Excel", "Google Sheets", "Komunikasi", "Administrasi"],
    type: "underqualified",
  },
};

// -----------------------------------------------------------------------------
// Mock Job Postings (Curated and Verified Specs)
// -----------------------------------------------------------------------------
export const mockJobs: MockJob[] = [
  {
    id: "job-001",
    title: "Junior Data Analyst",
    company: "PT Nusantara FinTech",
    location: "Jakarta, Indonesia (Hybrid)",
    employmentType: "Full-time",
    seniority: "Junior",
    role: "Data Analyst",
    workType: "Hybrid",
    sourceName: "Greenhouse",
    sourceUrl: "https://boards.greenhouse.io/nusantarafintech/jobs/40112",
    retrievalMethod: "public_api",
    retrievedAt: "2026-11-03 18:00:00 WIB",
    description:
      "Kami mencari Junior Data Analyst untuk tim Growth Analytics kami. Bertanggung jawab mengekstrak data dari data warehouse, menyiapkan dashboard performa fitur fintech, dan berkolaborasi erat dengan product manager.",
    responsibilities: [
      "Melakukan query data transaksi pengguna menggunakan SQL di BigQuery.",
      "Membangun dashboard visualisasi matriks retensi dan konversi.",
      "Membersihkan dan memvalidasi dataset ad-hoc menggunakan Python.",
      "Menyajikan ringkasan temuan kepada tim bisnis.",
    ],
    requiredSkills: ["SQL", "Microsoft Excel", "Data Visualization"],
    preferredSkills: ["Python", "Tableau", "A/B Testing"],
    matchStatus: "match",
    matchScore: 88,
    scoreBreakdown: [
      { label: "Skill Wajib (35%)", weight: 0.35, score: 95, detail: "SQL, Excel, Visualisasi Data terbukti ada di CV" },
      { label: "Skill Tambahan (20%)", weight: 0.20, score: 80, detail: "Python terbukti ada; Tableau belum ditemukan" },
      { label: "Pengalaman (15%)", weight: 0.15, score: 90, detail: "2 tahun pengalaman memenuhi syarat 1+ tahun" },
      { label: "Senioritas & Pendidikan (10%)", weight: 0.10, score: 90, detail: "S1 bidang kuantitatif sesuai kualifikasi" },
      { label: "Kesesuaian Semantik (20%)", weight: 0.20, score: 85, detail: "Latar belakang fintech & data transaksi relevan" },
    ],
    requirementsList: [
      { id: "r1", description: "Mahir SQL untuk query multi-table dan agregasi data", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'PostgreSQL & BigQuery query di CV'" },
      { id: "r2", description: "Kemampuan analisis spreadsheet dengan Microsoft Excel", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Microsoft Excel (Pivot & VLOOKUP)'" },
      { id: "r3", description: "Visualisasi data analitis dan pelaporan performa", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Data Visualization portofolio'" },
      { id: "r4", description: "Pengalaman dasar pemrograman Python (Pandas/NumPy)", isMandatory: false, status: "cocok", evidenceInCV: "Tercantum: 'Python (Pandas) di CV'" },
      { id: "r5", description: "Pengalaman dengan Tableau Desktop", isMandatory: false, status: "belum_ditemukan", note: "Tidak ditemukan bukti penggunaan Tableau di CV" },
      { id: "r6", description: "Pemahaman eksperimentasi A/B testing produk", isMandatory: false, status: "belum_cukup_bukti", note: "Disebutkan statistik dasar namun tidak eksplisit A/B testing" },
    ],
    factorsSupporting: [
      "Semua persyaratan skill wajib (SQL, Excel, Data Visualization) terbukti ada di CV.",
      "Keahlian tambahan Python (Pandas) memberikan nilai tambah teknis yang kuat.",
      "Pengalaman kerja 2 tahun melampaui batas minimum junior (1 tahun).",
    ],
    factorsLimiting: [
      "Keahlian Tableau belum ditemukan di CV (disarankan menambah portofolio dashboard).",
    ],
    matchedSkills: ["SQL", "Microsoft Excel", "Data Visualization", "Python"],
    missingSkills: ["Tableau"],
    insufficientSkills: ["A/B Testing"],
    isSaved: true,
  },
  {
    id: "job-002",
    title: "Business Intelligence (BI) Analyst",
    company: "Karya Logistik Express",
    location: "Bandung, Indonesia (Onsite)",
    employmentType: "Full-time",
    seniority: "Mid",
    role: "BI Analyst",
    workType: "Onsite",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/412988102",
    retrievalMethod: "jobspy",
    retrievedAt: "2026-11-03 19:15:00 WIB",
    description:
      "Dibutuhkan BI Analyst berpengalaman untuk mengoptimasi rute armada dan efisiensi rantai pasok. Bertanggung jawab penuh memodelkan data gudang dan menyusun dashboard Power BI interaktif untuk level manajerial.",
    responsibilities: [
      "Membuat data model bintang (star schema) di data warehouse.",
      "Mendesain laporan real-time operational KPI menggunakan Power BI dan DAX.",
      "Menjalankan query SQL tingkat lanjut untuk audit SLA pengiriman paket.",
    ],
    requiredSkills: ["SQL", "Power BI", "Data Modeling"],
    preferredSkills: ["Data Warehousing", "Snowflake", "Python"],
    matchStatus: "underqualified",
    matchScore: 52,
    scoreBreakdown: [
      { label: "Skill Wajib (35%)", weight: 0.35, score: 45, detail: "SQL terbukti ada; Power BI & Data Modeling belum ditemukan" },
      { label: "Skill Tambahan (20%)", weight: 0.20, score: 60, detail: "Python ada; Snowflake & Data Warehousing belum terverifikasi" },
      { label: "Pengalaman (15%)", weight: 0.15, score: 70, detail: "2 tahun pengalaman (syarat: minimal 2-3 tahun)" },
      { label: "Senioritas & Pendidikan (10%)", weight: 0.10, score: 80, detail: "Gelar S1 Kuantitatif relevan" },
      { label: "Kesesuaian Semantik (20%)", weight: 0.20, score: 50, detail: "Fokus logistik berbeda dengan pengalaman fintech" },
    ],
    requirementsList: [
      { id: "r1", description: "Mahir SQL tingkat lanjut (Window Functions, CTE)", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'PostgreSQL Query di CV'" },
      { id: "r2", description: "Keahlian pembuatan dashboard Power BI dan kalkulasi DAX", isMandatory: true, status: "belum_ditemukan", note: "Keahlian Power BI belum ditemukan di CV" },
      { id: "r3", description: "Pemodelan data relasional dan star schema", isMandatory: true, status: "belum_ditemukan", note: "Pengalaman pemodelan data dimensional belum terbukti" },
      { id: "r4", description: "Pemahaman arsitektur data warehouse (Snowflake / BigQuery)", isMandatory: false, status: "belum_cukup_bukti", note: "Hanya disebutkan BigQuery dasar di CV" },
      { id: "r5", description: "Pengalaman scripting Python untuk otomatisasi pipeline", isMandatory: false, status: "cocok", evidenceInCV: "Tercantum: 'Python Pandas script'" },
    ],
    factorsSupporting: [
      "Fondasi SQL sangat solid untuk analisis data relasional.",
      "Gelar S1 Matematika memenuhi kualifikasi kuantitatif.",
    ],
    factorsLimiting: [
      "Persyaratan wajib Power BI dan DAX belum ditemukan di CV.",
      "Pemodelan data dimensional (Data Modeling) belum terlihat pada riwayat proyek.",
    ],
    matchedSkills: ["SQL", "Python"],
    missingSkills: ["Power BI", "Data Modeling"],
    insufficientSkills: ["Snowflake"],
    isSaved: false,
  },
  {
    id: "job-003",
    title: "Commercial Data Analyst",
    company: "PT Asia E-Commerce Global",
    location: "Jakarta, Indonesia (Remote)",
    employmentType: "Full-time",
    seniority: "Junior",
    role: "Data Analyst",
    workType: "Remote",
    sourceName: "Lever",
    sourceUrl: "https://jobs.lever.co/asiaecommerce/88a2e1",
    retrievalMethod: "public_api",
    retrievedAt: "2026-11-03 16:45:00 WIB",
    description:
      "Membantu tim merchant dan marketing menganalisis tren promosi bulanan dan customer lifetime value di platform e-commerce kami.",
    responsibilities: [
      "Menganalisis efektivitas promosi voucher merchant.",
      "Melakukan segmentasi cohort pelanggan.",
      "Menyajikan laporan performa mingguan kepada VP of Commerce.",
    ],
    requiredSkills: ["SQL", "Python", "Microsoft Excel"],
    preferredSkills: ["Metabase", "Statistics", "Google Analytics"],
    matchStatus: "match",
    matchScore: 91,
    scoreBreakdown: [
      { label: "Skill Wajib (35%)", weight: 0.35, score: 100, detail: "SQL, Python, Excel seluruhnya terbukti ada di CV" },
      { label: "Skill Tambahan (20%)", weight: 0.20, score: 85, detail: "Statistika & visualisasi cocok; Metabase belum ditemukan" },
      { label: "Pengalaman (15%)", weight: 0.15, score: 95, detail: "2 tahun pengalaman relevan di data transaksi" },
      { label: "Senioritas & Pendidikan (10%)", weight: 0.10, score: 90, detail: "S1 sesuai persyaratan" },
      { label: "Kesesuaian Semantik (20%)", weight: 0.20, score: 85, detail: "Analisis transaksi e-commerce dekat dengan perbankan" },
    ],
    requirementsList: [
      { id: "r1", description: "Kemampuan query SQL untuk dataset transaksi besar", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Query database transaksi harian'" },
      { id: "r2", description: "Pengolahan data dengan Python (Pandas/NumPy)", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Python data manipulation di CV'" },
      { id: "r3", description: "Kemampuan advanced Microsoft Excel", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Microsoft Excel Pivot & VLOOKUP'" },
      { id: "r4", description: "Pemahaman statistika deskriptif dan analisis cohort", isMandatory: false, status: "cocok", evidenceInCV: "Tercantum: 'Statistics & Math background'" },
      { id: "r5", description: "Pengalaman tools BI open-source seperti Metabase", isMandatory: false, status: "belum_ditemukan", note: "Belum tercantum di CV" },
    ],
    factorsSupporting: [
      "Seluruh persyaratan wajib (SQL, Python, Excel) terpenuhi dengan bukti kuat.",
      "Kombinasi kemampuan statistika matematika mendukung analisis cohort pelanggan.",
    ],
    factorsLimiting: [
      "Tools Metabase belum tertera di CV.",
    ],
    matchedSkills: ["SQL", "Python", "Microsoft Excel", "Statistics"],
    missingSkills: ["Metabase"],
    insufficientSkills: [],
    isSaved: true,
  },
  {
    id: "job-004",
    title: "Mid Data Analyst - Growth & Risk",
    company: "PT Solusi Digital Asia",
    location: "Surabaya, Indonesia (Hybrid)",
    employmentType: "Full-time",
    seniority: "Mid",
    role: "Data Analyst",
    workType: "Hybrid",
    sourceName: "Greenhouse",
    sourceUrl: "https://boards.greenhouse.io/solusidigital/jobs/5501",
    retrievalMethod: "public_api",
    retrievedAt: "2026-11-03 17:20:00 WIB",
    description:
      "Bergabung dengan squad Risk & Growth untuk mendeteksi anomali fraud transaksi dan mengoptimalkan funnel registrasi.",
    responsibilities: [
      "Mengembangkan query deteksi anomali pada data transaksi.",
      "Mendesain laporan risiko fraud mingguan.",
      "Bekerja sama dengan tim data engineering untuk validasi pipeline.",
    ],
    requiredSkills: ["SQL", "Python", "Statistics"],
    preferredSkills: ["Machine Learning", "Tableau", "Git"],
    matchStatus: "match",
    matchScore: 82,
    scoreBreakdown: [
      { label: "Skill Wajib (35%)", weight: 0.35, score: 95, detail: "SQL, Python, Statistics terbukti ada di CV" },
      { label: "Skill Tambahan (20%)", weight: 0.20, score: 65, detail: "Machine learning belum ditemukan di CV" },
      { label: "Pengalaman (15%)", weight: 0.15, score: 80, detail: "2 tahun pengalaman cocok untuk level Mid awal" },
      { label: "Senioritas & Pendidikan (10%)", weight: 0.10, score: 90, detail: "S1 Matematika sesuai" },
      { label: "Kesesuaian Semantik (20%)", weight: 0.20, score: 85, detail: "Fokus deteksi anomali sesuai profil perbankan" },
    ],
    requirementsList: [
      { id: "r1", description: "Pengalaman query SQL di PostgreSQL / Redshift", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'PostgreSQL di CV'" },
      { id: "r2", description: "Pemrograman Python untuk data analytics", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Python Pandas di CV'" },
      { id: "r3", description: "Dasar teori statistika dan probabilitas", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'S1 Matematika & Statistika'" },
      { id: "r4", description: "Dasar Machine Learning terawasi (Scikit-Learn)", isMandatory: false, status: "belum_ditemukan", note: "Belum tercantum di CV" },
    ],
    factorsSupporting: [
      "Persyaratan wajib terpenuhi dengan latar belakang kuantitatif yang solid.",
    ],
    factorsLimiting: [
      "Keahlian Machine Learning belum ditemukan di CV.",
    ],
    matchedSkills: ["SQL", "Python", "Statistics"],
    missingSkills: ["Machine Learning"],
    insufficientSkills: [],
    isSaved: false,
  },
  {
    id: "job-005",
    title: "Senior Business Intelligence Specialist",
    company: "Bank Digital Mandiri Nusantara",
    location: "Jakarta, Indonesia (Onsite)",
    employmentType: "Full-time",
    seniority: "Senior",
    role: "BI Analyst",
    workType: "Onsite",
    sourceName: "Lever",
    sourceUrl: "https://jobs.lever.co/bankdigitalmandiri/7710a",
    retrievalMethod: "public_api",
    retrievedAt: "2026-11-03 14:10:00 WIB",
    description:
      "Memimpin perancangan data warehouse analitis dan tata kelola pelaporan enterprise BI untuk produk simpanan dan pinjaman digital.",
    responsibilities: [
      "Memimpin inisiatif modern data stack enterprise.",
      "Mengarsiteki pipeline analitis dan semantik layer di Looker/Power BI.",
      "Membina tim analis data junior.",
    ],
    requiredSkills: ["SQL", "Power BI", "Data Modeling", "Data Warehousing"],
    preferredSkills: ["DBT", "Cloud Computing", "Team Leadership"],
    matchStatus: "underqualified",
    matchScore: 42,
    scoreBreakdown: [
      { label: "Skill Wajib (35%)", weight: 0.35, score: 35, detail: "Hanya SQL yang cocok; Power BI & Arsitektur DWH belum ditemukan" },
      { label: "Skill Tambahan (20%)", weight: 0.20, score: 30, detail: "DBT & Leadership belum ditemukan" },
      { label: "Pengalaman (15%)", weight: 0.15, score: 40, detail: "2 tahun pengalaman tidak mencukupi syarat senior 5+ tahun" },
      { label: "Senioritas & Pendidikan (10%)", weight: 0.10, score: 65, detail: "S1 ada, level senioritas belum tercapai" },
      { label: "Kesesuaian Semantik (20%)", weight: 0.20, score: 55, detail: "Domain perbankan cocok, namun skala pekerjaan berbeda" },
    ],
    requirementsList: [
      { id: "r1", description: "Minimal 5 tahun pengalaman di bidang Business Intelligence", isMandatory: true, status: "belum_cukup_bukti", note: "CV memiliki 2 tahun pengalaman (syarat: 5+ tahun)" },
      { id: "r2", description: "Pengalaman enterprise deployment Power BI / Looker", isMandatory: true, status: "belum_ditemukan", note: "Tidak ditemukan di CV" },
      { id: "r3", description: "Arsitektur Data Modeling dan Data Warehouse enterprise", isMandatory: true, status: "belum_ditemukan", note: "Tidak ditemukan di CV" },
      { id: "r4", description: "Keahlian SQL kompleks tingkat lanjut", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'SQL query di CV'" },
    ],
    factorsSupporting: [
      "Keahlian teknis SQL dasar tersedia.",
    ],
    factorsLimiting: [
      "Pengalaman kerja 2 tahun jauh di bawah kualifikasi Senior (5+ tahun).",
      "Power BI dan Data Warehousing enterprise belum ditemukan di CV.",
    ],
    matchedSkills: ["SQL"],
    missingSkills: ["Power BI", "Data Modeling", "Data Warehousing", "DBT"],
    insufficientSkills: ["Pengalaman 5+ Tahun"],
    isSaved: false,
  },
  {
    id: "job-006",
    title: "Data Operations Associate",
    company: "PT Retail Modern Nusantara",
    location: "Tangerang, Indonesia (Onsite)",
    employmentType: "Full-time",
    seniority: "Junior",
    role: "Data Analyst",
    workType: "Onsite",
    sourceName: "LinkedIn",
    sourceUrl: "https://www.linkedin.com/jobs/view/41982101",
    retrievalMethod: "jobspy",
    retrievedAt: "2026-11-03 15:30:00 WIB",
    description:
      "Membantu pencatatan inventaris dan rekonsiliasi data stok toko fisik harian menggunakan spreadsheet dan sistem ERP.",
    responsibilities: [
      "Menginput dan memverifikasi mutasi stok barang.",
      "Membuat rekapitulasi data penjualan harian di Excel.",
      "Melaporkan selisih stok ke supervisor gudang.",
    ],
    requiredSkills: ["Microsoft Excel", "Administrasi"],
    preferredSkills: ["Google Sheets", "Komunikasi"],
    matchStatus: "potentially_overqualified",
    matchScore: 85,
    scoreBreakdown: [
      { label: "Skill Wajib (35%)", weight: 0.35, score: 100, detail: "Excel terpenuhi sepenuhnya" },
      { label: "Skill Tambahan (20%)", weight: 0.20, score: 85, detail: "Kemampuan komputasi pelamar melampaui kebutuhan entry-level" },
      { label: "Pengalaman (15%)", weight: 0.15, score: 90, detail: "Pengalaman data analytics pelamar tampak melebihi posisi data entry" },
      { label: "Senioritas & Pendidikan (10%)", weight: 0.10, score: 90, detail: "S1 melampaui syarat SMA/Diploma" },
      { label: "Kesesuaian Semantik (20%)", weight: 0.20, score: 70, detail: "Posisi bersifat data entry administratif" },
    ],
    requirementsList: [
      { id: "r1", description: "Mahir Microsoft Excel dasar untuk pencatatan tabel", isMandatory: true, status: "cocok", evidenceInCV: "Tercantum: 'Excel advanced di CV'" },
      { id: "r2", description: "Pendidikan minimal SMK / Diploma administrasi", isMandatory: true, status: "cocok", evidenceInCV: "Pelamar lulusan S1 Matematika" },
    ],
    factorsSupporting: [
      "Seluruh persyaratan teknis administratif terpenuhi dengan sangat mudah.",
    ],
    factorsLimiting: [
      "Indikasi Potentially Overqualified: Keahlian pelamar (SQL, Python, data modeling) melampaui kebutuhan operasional posisi ini.",
    ],
    matchedSkills: ["Microsoft Excel"],
    missingSkills: [],
    insufficientSkills: [],
    isSaved: false,
  },
];

// -----------------------------------------------------------------------------
// Market Skill Insights Dataset (Dynamic by Role)
// -----------------------------------------------------------------------------
export const mockMarketInsightsByRole: Record<
  "Data Analyst" | "BI Analyst",
  { totalSampleN: number; skills: MarketSkill[] }
> = {
  "Data Analyst": {
    totalSampleN: 26,
    skills: [
      {
        skillName: "SQL (PostgreSQL / BigQuery)",
        count: 24,
        percentage: 92,
        status: "found",
        category: "Database & Query",
        exampleRequirement: "Menguasai query kompleks, CTE, window functions, dan optimasi agregasi data transaksi.",
      },
      {
        skillName: "Python (Pandas & NumPy)",
        count: 20,
        percentage: 77,
        status: "found",
        category: "Programming & Wrangling",
        exampleRequirement: "Membersihkan dataset kotor dan mengotomatiskan laporan berkala menggunakan Pandas.",
      },
      {
        skillName: "Tableau / Power BI",
        count: 18,
        percentage: 69,
        status: "missing",
        category: "Data Visualization",
        exampleRequirement: "Mendesain dashboard eksekutif interaktif yang mudah dipahami oleh stakeholder bisnis.",
      },
      {
        skillName: "Microsoft Excel (Advanced)",
        count: 17,
        percentage: 65,
        status: "found",
        category: "Spreadsheet",
        exampleRequirement: "Mahir VLOOKUP, INDEX-MATCH, Pivot Tables, dan conditional aggregation.",
      },
      {
        skillName: "A/B Testing & Statistics",
        count: 12,
        percentage: 46,
        status: "missing",
        category: "Methodology",
        exampleRequirement: "Menghitung signifikansi statistik (p-value, confidence interval) untuk pengujian fitur produk.",
      },
      {
        skillName: "Data Warehousing (BigQuery / Snowflake)",
        count: 9,
        percentage: 35,
        status: "needs_verification",
        category: "Infrastructure",
        exampleRequirement: "Memahami struktur star-schema dan pipeline ELT analitis.",
      },
      {
        skillName: "Git & Version Control",
        count: 8,
        percentage: 31,
        status: "needs_verification",
        category: "Engineering Tools",
        exampleRequirement: "Menyimpan script analisis dan pipeline SQL secara kolaboratif menggunakan Git/GitHub.",
      },
    ],
  },
  "BI Analyst": {
    totalSampleN: 18,
    skills: [
      {
        skillName: "SQL (Advanced Window & CTE)",
        count: 17,
        percentage: 94,
        status: "found",
        category: "Database & Query",
        exampleRequirement: "Optimasi query performa tinggi pada data mart transaksi enterprise.",
      },
      {
        skillName: "Power BI & DAX",
        count: 16,
        percentage: 89,
        status: "missing",
        category: "BI Platform",
        exampleRequirement: "Membuat data model relasional kompleks, kalkulasi DAX lanjutan, dan manajemen dashboard.",
      },
      {
        skillName: "Tableau Enterprise",
        count: 12,
        percentage: 67,
        status: "missing",
        category: "BI Platform",
        exampleRequirement: "Deployment dashboard interaktif dengan Row-Level Security di Tableau Server.",
      },
      {
        skillName: "Data Warehousing (Snowflake / BigQuery)",
        count: 10,
        percentage: 56,
        status: "needs_verification",
        category: "Infrastructure",
        exampleRequirement: "Mendesain arsitektur data mart dan dimensi fakta pada data warehouse.",
      },
      {
        skillName: "Microsoft Excel",
        count: 9,
        percentage: 50,
        status: "found",
        category: "Spreadsheet",
        exampleRequirement: "Pemodelan keuangan dan rekapitulasi data ad-hoc.",
      },
      {
        skillName: "Data Modeling (Star / Snowflake Schema)",
        count: 8,
        percentage: 44,
        status: "missing",
        category: "Methodology",
        exampleRequirement: "Normalisasi dan denormalisasi tabel analitis untuk kemudahan query bisnis.",
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// Learning Roadmap Items
// -----------------------------------------------------------------------------
export const mockLearningItems: LearningItem[] = [
  {
    id: "learn-01",
    skillName: "Power BI & DAX",
    reason: "Diminta oleh 89% lowongan BI Analyst dan 69% lowongan Data Analyst. Belum ditemukan di CV aktif Anda.",
    resourceSuggestion: "Modul Praktis Power BI Desktop & DAX: Visualisasi Data Rantai Pasok",
    isDone: false,
    priority: "Tinggi",
  },
  {
    id: "learn-02",
    skillName: "Tableau Desktop Fundamental",
    reason: "Skill visualisasi data paling dicari kedua setelah Power BI. Menambah portofolio ini menaikkan skor kecocokan hingga 15 poin.",
    resourceSuggestion: "Tutorial Membuat Executive KPI Dashboard di Tableau Public",
    isDone: false,
    priority: "Tinggi",
  },
  {
    id: "learn-03",
    skillName: "A/B Testing & Signifikansi Statistik",
    reason: "Kualifikasi yang membedakan analis junior dengan spesialis growth produk.",
    resourceSuggestion: "Panduan Praktis Hipotesis Testing & P-Value di Python Scipy",
    isDone: true,
    priority: "Menengah",
  },
  {
    id: "learn-04",
    skillName: "SQL Window Functions (ROW_NUMBER, DENSE_RANK)",
    reason: "Fondasi query mutlak untuk analisis data peringkat dan partisi pergerakan transaksi.",
    resourceSuggestion: "Latihan Interaktif SQL Window Functions di LeetCode & Mode Analytics",
    isDone: true,
    priority: "Menengah",
  },
];

// -----------------------------------------------------------------------------
// Worker Crawling Audit History
// -----------------------------------------------------------------------------
export const mockWorkerRuns: WorkerRun[] = [
  {
    id: "run-001",
    sourceName: "greenhouse",
    retrievalMethod: "public_api",
    status: "success",
    timestamp: "2026-11-03 23:54:49 UTC",
    fetchedCount: 15,
    insertedCount: 12,
    updatedCount: 0,
    duplicateCount: 3,
    failedCount: 0,
    notes: "Boards: gitlab, canonical. Kategori: Data Analytics.",
  },
  {
    id: "run-002",
    sourceName: "lever",
    retrievalMethod: "public_api",
    status: "success",
    timestamp: "2026-11-03 20:10:12 UTC",
    fetchedCount: 10,
    insertedCount: 8,
    updatedCount: 0,
    duplicateCount: 2,
    failedCount: 0,
    notes: "Sites: atlassian, spotify. Kategori: Analytics.",
  },
  {
    id: "run-003",
    sourceName: "linkedin",
    retrievalMethod: "jobspy",
    status: "success",
    timestamp: "2026-11-03 14:00:00 UTC",
    fetchedCount: 8,
    insertedCount: 6,
    updatedCount: 0,
    duplicateCount: 2,
    failedCount: 0,
    notes: "Guest anonymous scrape. Query: Data Analyst Indonesia. Data pribadi recruiter dibuang.",
  },
  {
    id: "run-004",
    sourceName: "seed",
    retrievalMethod: "seed",
    status: "success",
    timestamp: "2026-11-03 08:30:15 UTC",
    fetchedCount: 3,
    insertedCount: 3,
    updatedCount: 0,
    duplicateCount: 0,
    failedCount: 0,
    notes: "Offline demo seed fallback.",
  },
];

