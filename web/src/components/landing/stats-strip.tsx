import { UI_COPY } from "@/lib/copy";

export function LandingStatsStrip({ total, fields, failed }: { total: number | null; fields: number; failed?: boolean }) {
  const c = UI_COPY.landing;
  const pending = failed ? c.statsUnavailable : c.statsPending;
  const items = [
    [total === null ? pending : total.toLocaleString("id-ID"), c.statsJobs],
    [total === null ? pending : String(fields), c.statsFields],
  ];
  return <section className="landing-stat-strip relative z-10 text-white pt-stack-xl sm:pt-stack-2xl pb-stack-2xl sm:pb-stack-3xl">
    <dl className="max-w-[1380px] mx-auto px-stack-xl sm:px-stack-4xl lg:px-stack-6xl xl:px-stack-7xl grid grid-cols-1 sm:grid-cols-2 gap-stack-xl sm:gap-stack-3xl">
      {items.map(([value, label]) => <div key={label} className="border-l-2 border-[#7B98E6] pl-stack-lg">
        <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</dd>
        <dt className="text-sm font-semibold text-[#C3D1F4] mt-stack-xs">{label}</dt>
      </div>)}
    </dl>
  </section>;
}
