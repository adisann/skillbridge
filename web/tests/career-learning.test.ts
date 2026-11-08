import { test } from "node:test";
import { equal, deepEqual, ok, throws } from "node:assert/strict";
import { experienceParts, experienceInYears, formatExperience } from "../src/lib/experience.ts";
import { displayLearningPriority, normalizeSkillName, noteSegments } from "../src/lib/learning.ts";
import { cvEvidence } from "../src/lib/cv-evidence.ts";
import { calculateJobMatch } from "../src/lib/matching.ts";
import { fetchDeduped, clearDedupedCache } from "../src/lib/fetcher.ts";

test("Durasi pengalaman mempertahankan bulan, nol, dan nilai kosong", () => {
  equal(experienceInYears("0", "6"), 0.5);
  equal(experienceInYears("1", "3"), 1.25);
  equal(experienceInYears("", ""), null);
  equal(experienceInYears("0", "0"), 0);
  deepEqual(experienceParts(2), { years: "2", months: "0" });
  deepEqual(experienceParts(1/12), { years: "0", months: "1" });
  equal(formatExperience(0.5), "0 tahun 6 bulan");
  equal(formatExperience(null), "Belum diisi");
  throws(() => experienceInYears("1", "12"));
});

test("Matching menggunakan 6 bulan dan meredistribusi pengalaman yang belum diisi", () => {
  const job = { title: "Data Analyst", requiredSkills: ["SQL", "Python"], experienceYearsMin: 1 };
  const calc = (years: number | null) => calculateJobMatch({ skills: ["SQL", "Python"], experienceYears: years }, job);
  equal(calc(0.5).breakdown.find((b) => b.label === "Pengalaman Kerja")?.score, 50);
  equal(calc(1.25).breakdown.find((b) => b.label === "Pengalaman Kerja")?.score, 100);
  equal(calc(null).breakdown.find((b) => b.label === "Pengalaman Kerja")?.available, false);
  equal(calc(0).breakdown.find((b) => b.label === "Pengalaman Kerja")?.available, true);
  ok(calc(0.5).factorsLimiting.some((f) => f.includes("0 tahun 6 bulan")));
});

test("Klaim mandiri dan hasil ekstraksi belum ditinjau tidak dinyatakan sebagai bukti CV", () => {
  for (const source of ["claimedSkills", "reviewSkills"]) {
    const match = calculateJobMatch({ skills: ["SQL", "Python"], experienceYears: 1, [source]: ["SQL"] }, { title: "Analyst", requiredSkills: ["SQL"] });
    equal(match.requirementsEvaluation[0].status, "belum_cukup_bukti");
    ok(!match.matchedSkills.includes("SQL"));
    ok(!match.requirementsEvaluation[0].evidence.includes("Tercantum pada"));
  }
});

test("Identitas manual dan label prioritas lama dibaca tanpa menyatukan skill berbeda", () => {
  equal(normalizeSkillName("  TEAMwork  "), normalizeSkillName("teamwork"));
  equal(normalizeSkillName("  Power   BI "), "power bi");
  ok(normalizeSkillName("SQL") !== normalizeSkillName("PostgreSQL"));
  equal(displayLearningPriority("Menengah"), "Sedang");
  equal(displayLearningPriority("Dasar"), "Rendah");
});

test("Catatan tetap teks dan hanya URL HTTP/HTTPS menjadi tautan", () => {
  const parts = noteSegments('Bootcamp https://example.test/course.\n<script>alert(1)</script> javascript:alert(1) data:text/html,test');
  equal(parts.filter((p) => p.href).length, 1);
  equal(parts.find((p) => p.href)?.href, "https://example.test/course");
  ok(parts.map((p) => p.text).join("").includes("<script>"));
  equal(noteSegments("").length, 0);
});

test("GET lama tidak boleh mengisi cache setelah konteks berubah", async () => {
  const original = globalThis.fetch;
  let release: (value: Response) => void = () => {};
  let calls = 0;
  globalThis.fetch = (() => { calls++; return calls === 1 ? new Promise<Response>((resolve) => { release = resolve; }) : Promise.resolve(Response.json({ cv: "new" })); }) as typeof fetch;
  try {
    clearDedupedCache();
    const old = fetchDeduped("/api/jobs");
    clearDedupedCache();
    deepEqual(await fetchDeduped("/api/jobs"), { cv: "new" });
    release(Response.json({ cv: "old" })); await old;
    deepEqual(await fetchDeduped("/api/jobs"), { cv: "new" });
    equal(calls, 2);
  } finally { globalThis.fetch = original; clearDedupedCache(); }
});

test("Penanda ekstraksi generik lama bukan cuplikan bukti CV", () => {
  equal(cvEvidence("Hasil ekstraksi dokumen CV yang dikonfirmasi oleh pengguna."), null);
  equal(cvEvidence("Ditandai manual oleh pengguna (belum ditemukan di dokumen CV)."), null);
  equal(cvEvidence("Mengolah data menggunakan Python."), "Mengolah data menggunakan Python.");
});
