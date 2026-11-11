import { test } from "node:test";
import { equal, ok } from "node:assert/strict";
import { detectSkills, extractExperienceYears, monthsFromDateRanges } from "../src/lib/cv-extraction.ts";

const NOW = new Date(2026, 10, 10); // 10 Nov 2026

test("CV mengekstrak terjemahan sebagai satu skill dan mempertahankan JLPT", () => {
  const skills = detectSkills("Statistika, Statistik, Statistics. Analisis Data, Data Analisis, Data Analysis. Bahasa Jepang: JLPT N5.");
  equal(skills.filter((s) => s === "Statistics").length, 1);
  equal(skills.filter((s) => s === "Data Analysis").length, 1);
  ok(skills.includes("Jepang (JLPT N5)"));
  ok(!skills.includes("Jepang"));
});

test("Big Query dan Google Big Query dinormalisasi sebagai BigQuery", () => {
  for (const name of ["BigQuery", "Big Query", "Google Big Query"]) ok(detectSkills(`Skills: ${name}`).includes("BigQuery"));
  ok(detectSkills("IBM SPSS").includes("SPSS"));
});

test("CV mendeteksi bahasa dan level HSK tanpa mengarang level atau menggandakan Mandarin", () => {
  equal(JSON.stringify(detectSkills("Bahasa: Mandarin, sertifikat HSK Level 5.")), JSON.stringify(["Mandarin (HSK 5)"]));
  equal(JSON.stringify(detectSkills("Bahasa Mandarin aktif.")), JSON.stringify(["Mandarin"]));
  ok(detectSkills("Sertifikat HSK 6").includes("Mandarin (HSK 6)"));
});

// CV sintetis mirip kasus auditor: 2 tahun pengalaman, ditulis sebagai rentang tanggal DAN durasi teks
const AUDITOR_CV = `Rina Putri
Data Analyst
Ringkasan
Data analyst dengan 2 tahun pengalaman di e-commerce. Lulus S1 Statistika (4 tahun).
Pengalaman Kerja
Data Analyst — PT Contoh Niaga
Jan 2023 – Des 2024 (2 tahun)
- Data Analysis penjualan harian dengan SQL dan Python
- Membuat dashboard Tableau dan Power BI
Pendidikan
S1 Statistika, Universitas Contoh, 2018 - 2022
Keahlian
SQL, Python, Microsoft Excel, Tableau, Power BI, Data Analysis, Data Visualization, Statistics, Git, Looker`;

test("Pengalaman 2 tahun tidak dihitung ganda dari rentang tanggal + durasi teks + masa kuliah", () => {
  equal(extractExperienceYears(AUDITOR_CV, NOW), 2);
});

test("Semua skill eksplisit CV auditor terdeteksi, termasuk Data Analysis", () => {
  const skills = detectSkills(AUDITOR_CV);
  for (const s of ["SQL", "Python", "Microsoft Excel", "Tableau", "Power BI", "Data Analysis", "Data Visualization", "Statistics", "Git", "Looker"]) {
    ok(skills.includes(s), `${s} harus terdeteksi`);
  }
  ok(!skills.includes("R"), "huruf R tunggal tidak boleh jadi skill");
  ok(!skills.includes("Machine Learning"), "skill yang tidak tertulis tidak ditambahkan");
});

test("Pengalaman paralel yang tumpang tindih digabung", () => {
  const cv = `Pengalaman
Analyst Intern, A — Jan 2022 - Jun 2022
Freelance Data Entry, B — Mar 2022 - Des 2022
Pendidikan
2018 - 2022`;
  equal(monthsFromDateRanges(cv.split("Pendidikan")[0], NOW), 12);
  equal(extractExperienceYears(cv, NOW), 1);
});

test("Pengalaman tanpa tanggal akhir dihitung sampai sekarang", () => {
  const cv = `Work Experience
Data Analyst, Company X
March 2025 - Present
Education
B.Sc. Statistics`;
  equal(extractExperienceYears(cv, NOW), 1.75);
});

test("Durasi eksplisit tanpa rentang tanggal: tahun dan bulan dalam satu frasa", () => {
  equal(extractExperienceYears("Pengalaman Kerja\nAdmin data selama 1 tahun 6 bulan\nPendidikan\nSMA", NOW), 1.5);
  equal(extractExperienceYears("Memiliki 3 years of experience in reporting.", NOW), 3);
});

test("Fresh graduate tanpa pengalaman = 0, CV tanpa info = null", () => {
  equal(extractExperienceYears("Fresh graduate S1 Informatika", NOW), 0);
  equal(extractExperienceYears("Nama: Budi\nKeahlian: SQL", NOW), null);
});

test("Durasi yang sama ditulis dua cara (2 tahun / 24 bulan) tidak dijumlahkan", () => {
  // Logika lama menjumlahkan angka 'tahun' pertama + angka 'bulan' pertama di seluruh CV -> 4 tahun
  const cv = "Ringkasan\nPengalaman 2 tahun sebagai data analyst (24 bulan) di startup.\nKeahlian\nSQL";
  equal(extractExperienceYears(cv, NOW), 2);
});
