import { JOB_CATEGORIES } from "@/lib/job-categories";
import { JOB_LEVELS } from "@/lib/job-level";

export interface FilterState {
  role: string; // Bidang slug or 'all'
  workType: string;
  seniority: string;
  location?: string;
  postedDate?: string;
  employmentType?: string;
  experience?: string;
  salary?: string;
}

const WORK_TYPE_OPTIONS = [
  { label: "Semua Tipe", value: "all" },
  { label: "Remote", value: "Remote" },
  { label: "Hybrid", value: "Hybrid" },
  { label: "Onsite", value: "Onsite" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { label: "Semua Kontrak", value: "all" },
  { label: "Full-time", value: "full-time" },
  { label: "Kontrak", value: "contract" },
  { label: "Magang", value: "internship" },
  { label: "Part-time", value: "part-time" },
  { label: "Freelance", value: "freelance" },
];

const EXPERIENCE_OPTIONS = [
  { label: "Semua Pengalaman", value: "all" },
  { label: "Fresh Graduate (0 tahun)", value: "fresh" },
  { label: "1-3 tahun", value: "1-3" },
  { label: "3-5 tahun", value: "3-5" },
  { label: "5+ tahun", value: "5+" },
];

const SALARY_OPTIONS = [
  { label: "Semua Gaji", value: "all" },
  { label: "Gaji dicantumkan", value: "listed" },
  { label: "Di bawah Rp 3 jt", value: "lt3" },
  { label: "Rp 3 - 5 jt", value: "3-5" },
  { label: "Rp 5 - 10 jt", value: "5-10" },
  { label: "Di atas Rp 10 jt", value: "gt10" },
];

const SENIORITY_OPTIONS = [
  { label: "Semua Level", value: "all" },
  ...JOB_LEVELS.map(({ label, value }) => ({ label, value })),
];

const LOCATION_OPTIONS = [
  { label: "Semua Lokasi", value: "all" },
  { label: "Jakarta / Jabodetabek", value: "jakarta" },
  { label: "Bandung", value: "bandung" },
  { label: "Surabaya", value: "surabaya" },
  { label: "Yogyakarta", value: "yogyakarta" },
  { label: "Bali", value: "bali" },
  { label: "Remote / Fleksibel", value: "remote" },
  { label: "Luar Negeri", value: "overseas" },
];

const DATE_OPTIONS = [
  { label: "Semua Waktu", value: "all" },
  { label: "7 Hari Terakhir", value: "7d" },
  { label: "14 Hari Terakhir", value: "14d" },
  { label: "30 Hari Terakhir", value: "30d" },
];

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: keyof FilterState;
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
}

export interface ActiveFilter {
  key: keyof FilterState;
  label: string;
  valueLabel: string;
}

export function buildBidangOptions(
  selectedRole: string,
  categoryCounts?: Record<string, number>
): FilterOption[] {
  const visibleCategories = JOB_CATEGORIES.filter((c) => {
    // Sembunyikan bidang tanpa lowongan, kecuali sedang dipilih
    if (categoryCounts && selectedRole !== c.slug) {
      return (categoryCounts[c.slug] || 0) > 0;
    }
    return true;
  });

  return [
    { label: "Semua Bidang", value: "all" },
    ...visibleCategories.map((c) => {
      const count = categoryCounts ? categoryCounts[c.slug] : undefined;
      const countLabel = count !== undefined ? ` (${count})` : "";
      return { label: `${c.label}${countLabel}`, value: c.slug };
    }),
  ];
}

export function buildFilterFields(filters: FilterState, bidangOptions: FilterOption[]): FilterField[] {
  return [
    { key: "role", id: "filter-role", label: "Bidang", value: filters.role, options: bidangOptions },
    {
      key: "location",
      id: "filter-location",
      label: "Lokasi Kerja",
      value: filters.location || "all",
      options: LOCATION_OPTIONS,
    },
    {
      key: "workType",
      id: "filter-work-type",
      label: "Tipe Kerja",
      value: filters.workType,
      options: WORK_TYPE_OPTIONS,
    },
    {
      key: "employmentType",
      id: "filter-employment-type",
      label: "Jenis Kontrak",
      value: filters.employmentType || "all",
      options: EMPLOYMENT_TYPE_OPTIONS,
    },
    {
      key: "experience",
      id: "filter-experience",
      label: "Pengalaman",
      value: filters.experience || "all",
      options: EXPERIENCE_OPTIONS,
    },
    {
      key: "salary",
      id: "filter-salary",
      label: "Gaji per Bulan",
      value: filters.salary || "all",
      options: SALARY_OPTIONS,
    },
    {
      key: "seniority",
      id: "filter-seniority",
      label: "Senioritas",
      value: filters.seniority,
      options: SENIORITY_OPTIONS,
    },
    {
      key: "postedDate",
      id: "filter-posted-date",
      label: "Waktu Tayang",
      value: filters.postedDate || "all",
      options: DATE_OPTIONS,
    },
  ];
}

export function buildActiveFilters(filters: FilterState): ActiveFilter[] {
  const active: ActiveFilter[] = [];
  if (filters.role && filters.role !== "all") {
    const foundCat = JOB_CATEGORIES.find((c) => c.slug === filters.role);
    active.push({ key: "role", label: "Bidang", valueLabel: foundCat ? foundCat.label : filters.role });
  }
  if (filters.location && filters.location !== "all") {
    active.push({
      key: "location",
      label: "Lokasi",
      valueLabel: LOCATION_OPTIONS.find((o) => o.value === filters.location)?.label || filters.location,
    });
  }
  if (filters.workType && filters.workType !== "all") {
    active.push({
      key: "workType",
      label: "Tipe",
      valueLabel: WORK_TYPE_OPTIONS.find((o) => o.value === filters.workType)?.label || filters.workType,
    });
  }
  if (filters.employmentType && filters.employmentType !== "all") {
    active.push({
      key: "employmentType",
      label: "Kontrak",
      valueLabel:
        EMPLOYMENT_TYPE_OPTIONS.find((o) => o.value === filters.employmentType)?.label || filters.employmentType,
    });
  }
  if (filters.experience && filters.experience !== "all") {
    active.push({
      key: "experience",
      label: "Pengalaman",
      valueLabel: EXPERIENCE_OPTIONS.find((o) => o.value === filters.experience)?.label || filters.experience,
    });
  }
  if (filters.salary && filters.salary !== "all") {
    active.push({
      key: "salary",
      label: "Gaji",
      valueLabel: SALARY_OPTIONS.find((o) => o.value === filters.salary)?.label || filters.salary,
    });
  }
  if (filters.seniority && filters.seniority !== "all") {
    active.push({
      key: "seniority",
      label: "Level",
      valueLabel: SENIORITY_OPTIONS.find((o) => o.value === filters.seniority)?.label || filters.seniority,
    });
  }
  if (filters.postedDate && filters.postedDate !== "all") {
    active.push({
      key: "postedDate",
      label: "Waktu",
      valueLabel: DATE_OPTIONS.find((o) => o.value === filters.postedDate)?.label || filters.postedDate,
    });
  }
  return active;
}
