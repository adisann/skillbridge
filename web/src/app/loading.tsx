import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
export default function Loading() {
  return <div aria-busy="true" className="max-w-7xl mx-auto p-6 space-y-6"><span className="sr-only" role="status">Memuat halaman…</span><SkeletonText lines={2}/><div className="grid md:grid-cols-2 gap-4"><SkeletonCard/><SkeletonCard/></div></div>;
}
