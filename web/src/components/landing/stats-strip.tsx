import { UI_COPY } from "@/lib/copy";

export function LandingStatsStrip({ total, fields, failed }: { total: number | null; fields: number; failed?: boolean }) {
  const c = UI_COPY.landing;
  const pending = failed ? c.statsUnavailable : c.statsPending;
  const items = [
    [total === null ? pending : total.toLocaleString("id-ID"), c.statsJobs],
    [total === null ? pending : String(fields), c.statsFields],
  ];
  return <section className="landing-stat-strip bg-sb-navy text-white py-8 sm:py-10">
    <dl className="max-w-[1380px] mx-auto px-6 sm:px-12 lg:px-20 xl:px-24 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
      {items.map(([value, label]) => <div key={label} className="border-l-2 border-sb-sky pl-5">
        <dd className="text-2xl sm:text-3xl font-extrabold tracking-tight">{value}</dd>
        <dt className="text-sm text-white mt-2">{label}</dt>
      </div>)}
    </dl>
  </section>;
}
