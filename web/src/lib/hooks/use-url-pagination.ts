import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 10;

/** Paginasi yang disimpan di query string (?page=&pageSize=). */
export function useUrlPagination(totalItems: number) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const rawPageSize = parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = PAGE_SIZE_OPTIONS.includes(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);

  const updateUrl = (page: number, size: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("pageSize", String(size));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    isPending,
    resetToFirstPage: () => updateUrl(1, pageSize),
    changePage: (page: number) => startTransition(() => updateUrl(page, pageSize)),
    changePageSize: (size: number) => startTransition(() => updateUrl(1, size)),
  };
}
