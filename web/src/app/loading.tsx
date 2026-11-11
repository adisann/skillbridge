import { SkeletonCard, SkeletonText } from "@/components/ui/loading";
// Setinggi layar supaya footer berada di bawah layar selama memuat; saat konten asli masuk,
// footer tidak terlihat "meloncat" ke bawah (layout shift).
export default function Loading() {
  return <div aria-busy="true" className="max-w-7xl mx-auto page-shell page-stack min-h-[100svh]"><span className="sr-only" role="status">Memuat halaman…</span><SkeletonText lines={2}/><div className="grid md:grid-cols-2 gap-stack-md"><SkeletonCard/><SkeletonCard/></div></div>;
}
