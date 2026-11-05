import { useMemo, useState } from "react";
import { getCategoryBySlug, getCategoryFromTitle } from "@/lib/job-categories";
import type { FilterState } from "@/lib/job-filters";

interface UseExplorerFiltersOptions {
  isGuest: boolean;
  isLoggedIn: boolean;
  /** Bidang dari query string (?bidang= atau ?role=), jika ada. */
  urlBidang: string | null;
  userTargetRole?: string;
}

export const DEFAULT_FILTERS: FilterState = {
  role: "all",
  workType: "all",
  seniority: "all",
  location: "all",
  postedDate: "all",
  employmentType: "all",
  experience: "all",
};

/** State filter Job Explorer, termasuk bidang default dari profil pengguna dan sinkronisasi URL. */
export function useExplorerFilters({ isGuest, isLoggedIn, urlBidang, userTargetRole }: UseExplorerFiltersOptions) {
  // Kategori bidang default dari profil pengguna login jika tidak ada param URL
  const userCategory = useMemo(() => {
    if (!userTargetRole) return undefined;
    const bySlug = getCategoryBySlug(userTargetRole);
    if (bySlug) return bySlug;
    return getCategoryFromTitle(userTargetRole, userTargetRole);
  }, [userTargetRole]);

  const fallbackRole = !isGuest && isLoggedIn ? userCategory?.slug || "all" : "all";
  const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS, role: urlBidang || fallbackRole });

  // Sinkronkan param URL jika berubah dari luar (pola render-time adjustment)
  const [prevUrlBidang, setPrevUrlBidang] = useState(urlBidang);
  if (prevUrlBidang !== urlBidang) {
    setPrevUrlBidang(urlBidang);
    setFilters((prev) => ({ ...prev, role: urlBidang || fallbackRole }));
  }

  // Jika targetRole user termuat dan tidak ada param di URL (pola render-time adjustment)
  const [prevUserTargetRole, setPrevUserTargetRole] = useState(userTargetRole);
  if (prevUserTargetRole !== userTargetRole) {
    setPrevUserTargetRole(userTargetRole);
    if (!isGuest && !urlBidang && userCategory && filters.role === "all") {
      setFilters((prev) => ({ ...prev, role: userCategory.slug }));
    }
  }

  return { filters, setFilters, userCategory };
}
