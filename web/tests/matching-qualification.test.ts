import { test } from "node:test";
import { equal, ok, deepEqual } from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateJobMatch, getDisplayScore } from "../src/lib/matching.ts";
import { loadCandidateProfile } from "../src/lib/candidate-profile.ts";
import { mergeServerAndLocalJobs } from "../src/lib/tracker-storage.ts";

const job = { title: "Data Analyst", requiredSkills: ["SQL", "Python"], experienceYearsMin: 2, seniority: "Junior" };
const candidate = { skills: ["SQL", "Python"], experienceYears: 2 };

test("Klaim mandiri dan ekstraksi belum ditinjau menurunkan nilai serta tidak memenuhi syarat wajib", () => {
  const proven = calculateJobMatch(candidate, job);
  for (const field of ["claimedSkills", "reviewSkills"]) {
    const result = calculateJobMatch({ ...candidate, [field]: ["SQL"] }, job);
    ok(result.score < proven.score);
    equal(result.matchStatus, "underqualified");
    equal(result.breakdown.find((part) => part.label === "Skill Wajib")?.notes, "1/2 terpenuhi");
  }
  const claimedOnly = calculateJobMatch({ ...candidate, claimedSkills: candidate.skills }, job);
  equal(claimedOnly.matchStatus, "insufficient_evidence");
  equal(getDisplayScore(claimedOnly), null);
});

test("Kekurangan pengalaman, pendidikan, dan IPK tidak ditutupi skor skill", () => {
  equal(calculateJobMatch({ ...candidate, experienceYears: 1 }, job).matchStatus, "underqualified");
  equal(calculateJobMatch({ ...candidate, education: "S1", gpa: 3.5 }, { ...job, education: "S2", minGpa: 3 }).matchStatus, "underqualified");
  equal(calculateJobMatch({ ...candidate, education: "S1", gpa: 2.5 }, { ...job, education: "S1", minGpa: 3 }).matchStatus, "underqualified");
});

test("Overkualifikasi memerlukan kecocokan wajib dan bukti posisi junior", () => {
  equal(calculateJobMatch({ ...candidate, experienceYears: 8 }, job).matchStatus, "potentially_overqualified");
  equal(calculateJobMatch({ skills: ["SQL"], experienceYears: 8 }, job).matchStatus, "underqualified");
  equal(calculateJobMatch({ ...candidate, experienceYears: 8 }, { ...job, seniority: "Senior" }).matchStatus, "match");
  equal(calculateJobMatch({ ...candidate, experienceYears: 8 }, { ...job, seniority: null }).matchStatus, "match");
});

test("Data kosong tidak diasumsikan S1 atau diberi nilai semantik rekaan", () => {
  const result = calculateJobMatch({ skills: ["SQL"], experienceYears: null }, { title: "SQL Analyst", requiredSkills: ["SQL"], education: "S1" });
  equal(result.breakdown.find((part) => part.label === "Pendidikan & Level")?.available, false);
  equal(result.breakdown.find((part) => part.label === "Kesesuaian Semantik")?.available, false);
  equal(result.score, 100);
  const withSemantic = calculateJobMatch(candidate, { ...job, semanticSimilarity: 0.4 });
  equal(withSemantic.breakdown.find((part) => part.label === "Kesesuaian Semantik")?.score, 40);
});

test("Perhitungan tidak memberi bonus khusus pada skill bidang data", () => {
  const data = calculateJobMatch({ skills: ["SQL"], experienceYears: 2 }, { title: "Data Analyst", requiredSkills: ["SQL"] });
  const marketing = calculateJobMatch({ skills: ["SEO"], experienceYears: 2 }, { title: "SEO Specialist", requiredSkills: ["SEO"] });
  equal(data.score, marketing.score);
  equal(data.matchStatus, marketing.matchStatus);
});

test("Guest tidak memuat profil; user dan admin hanya menerima CV milik akun sendiri", async () => {
  const scopes: string[] = [];
  const db = {
    from(table: string) {
      let id = "";
      return {
        select() { return this; },
        eq(key: string, value: string) { if (key === "id" || key === "user_id") id = value; return this; },
        async single() { return { data: { target_role: "Data Analyst" }, error: null }; },
        async maybeSingle() {
          scopes.push(`${table}:${id}`);
          return { data: id === "admin" ? null : { id: `cv-${id}`, experience_years: 2, education: "S1", resume_skills: [{ skills: { name: id === "user-a" ? "SQL" : "Python" }, is_claimed_by_user: false, needs_review: false, evidence: "Cuplikan CV." }] }, error: null };
        },
      };
    },
  } as unknown as SupabaseClient;
  const guest = await loadCandidateProfile(db, null);
  equal(guest.activeResume, null);
  deepEqual(scopes, []);
  const [a, b, admin] = await Promise.all([loadCandidateProfile(db, "user-a"), loadCandidateProfile(db, "user-b"), loadCandidateProfile(db, "admin")]);
  deepEqual(a.skills, ["SQL"]);
  deepEqual(b.skills, ["Python"]);
  equal(admin.activeResume, null);
  deepEqual(admin.skills, []);
  deepEqual(scopes.sort(), ["resumes:admin", "resumes:user-a", "resumes:user-b"]);
});

test("Tracker tanpa nilai dari server tidak membuat skor atau skill bawaan", () => {
  const [result] = mergeServerAndLocalJobs([{ id: "job-1", title: "Data Analyst", company: "Contoh", location: "Jakarta", matchScore: null }], "user-a");
  equal(result.matchStatus, "insufficient_evidence");
  equal(result.matchScore, 0);
  deepEqual(result.matchedSkills, []);
});
