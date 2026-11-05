import { getCategoryFromTitle } from "@/lib/job-categories";
import { isOverseasLocation } from "@/lib/utils";
import type { FilterState } from "@/lib/job-filters";
import { hasSalary, monthlySalaryEstimate } from "@/lib/salary";
import type { JobListItem } from "@/types/job";

const DAY_MS = 24 * 60 * 60 * 1000;
const POSTED_DATE_DAYS: Record<string, number> = { "7d": 7, "14d": 14 };
const DEFAULT_POSTED_DAYS = 30;

function matchesLocation(job: JobListItem, location: string | undefined): boolean {
  if (location === "overseas") return isOverseasLocation(job.location);
  if (location && location !== "all") {
    return (job.location || "").toLowerCase().includes(location.toLowerCase());
  }
  // Default daftar (semua lokasi): lowongan di luar Indonesia tidak masuk
  return !isOverseasLocation(job.location);
}

function matchesWorkType(job: JobListItem, workType: string): boolean {
  if (workType === "all") return true;
  const loc = (job.location || "").toLowerCase();
  const emp = (job.employmentType || "").toLowerCase();
  const isRemote = loc.includes("remote") || emp.includes("remote");
  const isHybrid = loc.includes("hybrid") || emp.includes("hybrid");

  const target = workType.toLowerCase();
  if (target === "remote") return isRemote;
  if (target === "hybrid") return isHybrid;
  if (target === "onsite") return !isRemote && !isHybrid;
  return true;
}

function matchesEmploymentType(job: JobListItem, employmentType: string | undefined): boolean {
  if (!employmentType || employmentType === "all") return true;
  const normalize = (v: string) => v.toLowerCase().replace(/[\s_]+/g, "-");
  const emp = normalize(job.employmentType || "");
  if (employmentType === "contract") return emp.includes("contract") || emp.includes("kontrak");
  if (employmentType === "internship") return emp.includes("intern") || emp.includes("magang");
  return emp.includes(employmentType);
}

/** Lowongan tanpa data pengalaman tidak ikut saat filter pengalaman aktif. */
function matchesExperience(job: JobListItem, experience: string | undefined): boolean {
  if (!experience || experience === "all") return true;
  const years = job.experienceYearsMin;
  if (years == null) return false;
  if (experience === "fresh") return years === 0;
  if (experience === "1-3") return years >= 1 && years <= 3;
  if (experience === "3-5") return years >= 3 && years <= 5;
  if (experience === "5+") return years >= 5;
  return true;
}

const MILLION = 1_000_000;

/** Filter gaji memakai estimasi per bulan; lowongan tanpa gaji hanya lolos pada "Semua Gaji". */
function matchesSalary(job: JobListItem, salary: string | undefined): boolean {
  if (!salary || salary === "all") return true;
  if (salary === "listed") return hasSalary(job);
  const monthly = monthlySalaryEstimate(job);
  if (monthly === null) return false;
  if (salary === "lt3") return monthly < 3 * MILLION;
  if (salary === "3-5") return monthly >= 3 * MILLION && monthly < 5 * MILLION;
  if (salary === "5-10") return monthly >= 5 * MILLION && monthly < 10 * MILLION;
  if (salary === "gt10") return monthly >= 10 * MILLION;
  return true;
}

function matchesSeniority(job: JobListItem, seniority: string): boolean {
  if (seniority === "all") return true;
  return (job.seniority || "").toLowerCase().includes(seniority.toLowerCase());
}

function matchesPostedDate(job: JobListItem, postedDate: string | undefined, referenceTime: number): boolean {
  if (!postedDate || postedDate === "all") return true;
  const maxAgeMs = (POSTED_DATE_DAYS[postedDate] ?? DEFAULT_POSTED_DAYS) * DAY_MS;
  const retrievedAt = job.retrievedAt ? new Date(job.retrievedAt).getTime() : 0;
  return !(referenceTime > 0 && retrievedAt > 0 && referenceTime - retrievedAt > maxAgeMs);
}

export function filterJobs(jobs: JobListItem[], filters: FilterState, referenceTime: number): JobListItem[] {
  return jobs.filter(
    (job) =>
      matchesLocation(job, filters.location) &&
      matchesWorkType(job, filters.workType) &&
      matchesEmploymentType(job, filters.employmentType) &&
      matchesExperience(job, filters.experience) &&
      matchesSalary(job, filters.salary) &&
      matchesSeniority(job, filters.seniority) &&
      matchesPostedDate(job, filters.postedDate, referenceTime)
  );
}

function matchesTargetRole(job: JobListItem, target: string): boolean {
  const category = (job.category || "").toLowerCase();
  return category.includes(target) || target.includes(category);
}

/** Urutkan untuk pengguna login: bidang target diutamakan bila filter bidang "all", lalu skor match tertinggi. */
export function sortByTargetFit(jobs: JobListItem[], roleFilter: string, targetRole?: string): JobListItem[] {
  const target = targetRole ? targetRole.toLowerCase() : "";
  return [...jobs].sort((a, b) => {
    if (roleFilter === "all" && target) {
      const aFits = matchesTargetRole(a, target);
      const bFits = matchesTargetRole(b, target);
      if (aFits && !bFits) return -1;
      if (!aFits && bFits) return 1;
    }
    return (b.matchScore ?? -1) - (a.matchScore ?? -1);
  });
}

export function countJobsByCategory(jobs: JobListItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    const slug = job.category || getCategoryFromTitle(job.title, job.canonicalTitle).slug;
    counts[slug] = (counts[slug] || 0) + 1;
  }
  return counts;
}
