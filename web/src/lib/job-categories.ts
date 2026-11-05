/**
 * Single source of truth untuk taksonomi bidang pekerjaan di SkillBridge.
 * Digunakan untuk kategorisasi otomatis server-side, filter multi-bidang,
 * dan preferensi target karier pengguna.
 */

export interface JobCategory {
  slug: string;
  label: string;
  examples: string;
  iconName: string;
  keywords: string[];
}

export const JOB_CATEGORIES: JobCategory[] = [
  {
    slug: "data-analitik",
    label: "Data & Analitik",
    examples: "Data Analyst, BI Analyst, Data Scientist",
    iconName: "BarChart3",
    keywords: [
      "data analyst",
      "bi analyst",
      "business intelligence",
      "data scientist",
      "data science",
      "analytics",
      "data engineer",
      "database",
      "big data",
      "sql developer",
      "data",
    ],
  },
  {
    slug: "bisnis-strategi",
    label: "Bisnis & Strategi",
    examples: "Business Analyst, Product Analyst, Corporate Strategy",
    iconName: "TrendingUp",
    keywords: [
      "business analyst",
      "product analyst",
      "corporate strategy",
      "business development",
      "bizdev",
      "strategy",
      "strategist",
      "consultant",
      "analis bisnis",
      "growth",
    ],
  },
  {
    slug: "produk-desain",
    label: "Produk & Desain",
    examples: "Product Manager, UI/UX Designer, UX Researcher",
    iconName: "Palette",
    keywords: [
      "product manager",
      "associate product manager",
      "ui/ux",
      "ui ux",
      "ui designer",
      "ux designer",
      "ux researcher",
      "product design",
      "graphic design",
      "desain produk",
      "designer",
      "design",
    ],
  },
  {
    slug: "software",
    label: "Software Engineering",
    examples: "Frontend, Full Stack, Backend",
    iconName: "Code2",
    keywords: [
      "software engineer",
      "frontend",
      "front-end",
      "front end",
      "backend",
      "back-end",
      "back end",
      "fullstack",
      "full-stack",
      "full stack",
      "web developer",
      "mobile developer",
      "android",
      "ios",
      "react",
      "node",
      "developer",
      "programmer",
      "software",
    ],
  },
  {
    slug: "keamanan-jaringan",
    label: "Keamanan Siber & Jaringan",
    examples: "Cyber Security, Network Engineer, Cloud Engineer",
    iconName: "ShieldCheck",
    keywords: [
      "cyber security",
      "cybersecurity",
      "security engineer",
      "keamanan",
      "network engineer",
      "network",
      "infrastructure",
      "devops",
      "cloud engineer",
      "cloud",
      "sysadmin",
      "system administrator",
    ],
  },
  {
    slug: "pemasaran",
    label: "Pemasaran Digital",
    examples: "Digital Marketing, SEO, Content",
    iconName: "Megaphone",
    keywords: [
      "digital marketing",
      "marketing",
      "pemasaran",
      "seo",
      "sem",
      "social media",
      "content writer",
      "copywriter",
      "brand specialist",
      "media buyer",
    ],
  },
  {
    slug: "keuangan",
    label: "Keuangan & Akuntansi",
    examples: "Financial Analyst, Pricing Analyst, Auditor",
    iconName: "Coins",
    keywords: [
      "financial analyst",
      "finance",
      "keuangan",
      "accounting",
      "akuntansi",
      "auditor",
      "pricing analyst",
      "pricing",
      "tax",
      "pajak",
      "treasury",
    ],
  },
  {
    slug: "operasional",
    label: "Operasional & Supply Chain",
    examples: "PPIC, Logistics, Quality Analyst",
    iconName: "Boxes",
    keywords: [
      "operasional",
      "operations",
      "operation",
      "supply chain",
      "logistics",
      "logistik",
      "ppic",
      "procurement",
      "quality assurance",
      "qa",
      "quality control",
      "warehouse",
      "gudang",
    ],
  },
  {
    slug: "lainnya",
    label: "Lainnya",
    examples: "Posisi Umum & Lintas Bidang",
    iconName: "Briefcase",
    keywords: [],
  },
];

/**
 * Tentukan kategori suatu pekerjaan dari judul atau canonical title.
 * Pengecekan dilakukan secara case-insensitive dengan prioritas spesifik ke umum.
 */
export function getCategoryFromTitle(
  title?: string | null,
  canonicalTitle?: string | null
): JobCategory {
  const text = `${canonicalTitle || ""} ${title || ""}`.toLowerCase();

  if (!text.trim()) {
    return JOB_CATEGORIES[JOB_CATEGORIES.length - 1]; // "lainnya"
  }

  // Cek kategori 0 sampai N-2 (sebelum "lainnya")
  for (let i = 0; i < JOB_CATEGORIES.length - 1; i++) {
    const category = JOB_CATEGORIES[i];
    for (const kw of category.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }

  return JOB_CATEGORIES[JOB_CATEGORIES.length - 1]; // "lainnya"
}

/**
 * Dapatkan kategori berdasarkan slug
 */
export function getCategoryBySlug(slug?: string | null): JobCategory | undefined {
  if (!slug) return undefined;
  return JOB_CATEGORIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
}

