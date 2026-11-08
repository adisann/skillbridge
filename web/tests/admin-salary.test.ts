import test from "node:test";
import { parseAdminSalary } from "../src/lib/admin-salary.ts";
import { DEFAULT_JOB_FORM, buildCreatePayload, buildUpdatePayload, buildDuplicatePayload, formFromAdminJob } from "../src/lib/admin-jobs.ts";
import { formatSalaryRange, monthlySalaryEstimate } from "../src/lib/salary.ts";

test("Permintaan lama tidak menghapus gaji", () => {
  const result = parseAdminSalary({});
  if (result.error || Object.keys(result.data).length) throw new Error("Gaji lama harus dipertahankan");
});

test("Gaji kosong disimpan sebagai null", () => {
  const result = parseAdminSalary({ salaryMin: null, salaryMax: null });
  if (result.error || Object.values(result.data).some((value) => value !== null)) throw new Error("Gaji kosong bukan nol");
});

test("Rentang gaji dan mata uang tersimpan", () => {
  const result = parseAdminSalary({ salaryMin: 5000000, salaryMax: 8000000, salaryCurrency: "idr", salaryPeriod: "month" });
  if (result.error || result.data.salary_min !== 5000000 || result.data.salary_max !== 8000000 || result.data.salary_currency !== "IDR" || result.data.salary_period !== "month") throw new Error("Rentang gaji berubah");
});

test("Satu batas gaji tetap diperbolehkan", () => {
  const result = parseAdminSalary({ salaryMin: null, salaryMax: 8000000, salaryCurrency: "IDR", salaryPeriod: "month" });
  if (result.error || result.data.salary_min !== null || result.data.salary_max !== 8000000) throw new Error("Batas tunggal harus diterima");
});

test("Gaji tidak valid ditolak sebelum penyimpanan", () => {
  for (const input of [
    { salaryMin: -1 }, { salaryMin: 1.5 }, { salaryMin: "abc" },
    { salaryMin: 9000000, salaryMax: 5000000 },
    { salaryMin: 5000000, salaryCurrency: "rupiah", salaryPeriod: "month" },
    { salaryMin: 5000000, salaryCurrency: "IDR", salaryPeriod: "invalid" },
  ]) {
    if (!parseAdminSalary(input).error) throw new Error("Gaji tidak valid diterima");
  }
});

test("Tambah tanpa gaji tetap diperbolehkan", () => {
  const result = parseAdminSalary(buildCreatePayload(DEFAULT_JOB_FORM));
  if (result.error || result.data.salary_min !== null || result.data.salary_max !== null) throw new Error("Gaji opsional wajib tetap kosong");
});

test("Edit dan duplikasi mempertahankan gaji dari katalog", () => {
  const job = {
    id: "job-test", title: "Analyst", canonicalTitle: "Data Analyst", company: "Test", location: "Jakarta",
    employmentType: "Full-time", seniority: "Mid", sourceName: "glints", retrievalMethod: "public_page", requiredSkills: [],
    salaryMin: 5000000, salaryMax: 8000000, salaryCurrency: "IDR", salaryPeriod: "month",
  };
  const form = formFromAdminJob(job);
  for (const payload of [buildUpdatePayload(job.id, form), buildDuplicatePayload(job)]) {
    const result = parseAdminSalary(payload);
    if (result.error || result.data.salary_min !== 5000000 || result.data.salary_max !== 8000000) throw new Error("Gaji hilang saat edit/duplikasi");
  }
  const cleared = parseAdminSalary(buildUpdatePayload(job.id, { ...form, salaryMin: "", salaryMax: "" }));
  if (cleared.error || cleared.data.salary_min !== null || cleared.data.salary_max !== null) throw new Error("Gaji tidak dapat dikosongkan");
});

test("Gaji non-rupiah tidak diberi label atau dibandingkan sebagai rupiah", () => {
  const salary = { salaryMin: 5000, salaryMax: 8000, salaryCurrency: "USD", salaryPeriod: "month" };
  if (formatSalaryRange(salary) !== "USD 5 - 8 rb / bulan" || monthlySalaryEstimate(salary) !== null) throw new Error("Mata uang tercampur");
});


test("Form admin mempertahankan role lintas bidang dan pengalaman nol/kosong", () => {
  for (const years of [0, undefined]) {
    const job = { id: "local", title: "Petugas kebersihan", canonicalTitle: "Cleaning Service", company: "Fixture", location: "", employmentType: "", seniority: "", sourceName: "fixture", retrievalMethod: "seed", requiredSkills: [], experienceYearsMin: years };
    const form = formFromAdminJob(job);
    const payload = buildUpdatePayload(job.id, form);
    if (payload.canonicalTitle !== job.canonicalTitle || payload.experienceYearsMin !== (years ?? null) || payload.education !== null || payload.requiredSkills.length) throw new Error("Data berubah saat edit tanpa perubahan");
  }
});


test("Pengalaman eksplisit dari deskripsi tidak hilang karena nilai nol lama", async () => {
  const { jobExperienceYears } = await import("../src/lib/job-experience.ts");
  if (jobExperienceYears(0, "Memiliki pengalaman di bidang analisa data/ posisi yang sama min. 1 th") !== 1) throw new Error("Syarat satu tahun hilang");
  if (jobExperienceYears(0, "Fresh graduate dipersilakan") !== 0) throw new Error("Pengalaman nol berubah");
  if (jobExperienceYears(null, "Bekerja selama 2 tahun") !== null) throw new Error("Durasi bukan syarat pengalaman");
  if (jobExperienceYears(null, "Minimum education 4 years") !== null) throw new Error("Pendidikan dianggap pengalaman");
});
