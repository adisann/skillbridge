import { CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ui/table";
import type { WorkerRunRecord } from "@/types/admin";

const WORKER_TRIGGERS = [
  { source: "greenhouse", label: "Picu Greenhouse (Binance / Cloudflare)", variant: "primary" },
  { source: "lever", label: "Picu Lever (Everseen / Kwalee)", variant: "outline" },
  { source: "jobstreet", label: "Picu JobStreet Indonesia", variant: "outline" },
  { source: "linkedin", label: "Picu LinkedIn (Guest Scraper)", variant: "outline" },
] as const;

const RUN_COLUMNS: Column<WorkerRunRecord>[] = [
  {
    key: "source_name",
    header: "Sumber Data",
    render: (row) => <span className="font-mono font-bold text-sb-navy">{row.source_name}</span>,
  },
  {
    key: "retrieval_method",
    header: "Metode",
    render: (row) => (
      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sb-mist-soft text-sb-navy">
        {row.retrieval_method}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sb-good/10 text-sb-good border border-sb-good/30">
        <CheckCircle2 className="w-3 h-3 text-sb-good" />
        {row.status}
      </span>
    ),
  },
  {
    key: "fetched_count",
    header: "Hasil (Fetch / Insert / Duplikat)",
    render: (row) => (
      <span className="font-mono text-xs">
        {row.fetched_count} ambil / <strong className="text-sb-good">{row.inserted_count} baru</strong> /{" "}
        <span className="text-amber-600">{row.duplicate_count} lewati</span>
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Waktu Eksekusi",
    render: (row) => (
      <span className="text-sb-text-2 font-mono text-xs">
        {new Date(row.created_at).toLocaleString("id-ID")}
      </span>
    ),
  },
];

interface WorkerRunsTabProps {
  runs: WorkerRunRecord[];
  isSubmitting: boolean;
  onTrigger: (sourceName: string) => void;
}

export function WorkerRunsTab({ runs, isSubmitting, onTrigger }: WorkerRunsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pemicu Sinkronisasi Worker (GitHub Actions & Live Crawler)</CardTitle>
          <CardDescription>
            Pipeline otomatis terjadwal via GitHub Actions (<code className="font-mono text-[11px] bg-sb-mist-soft px-1 py-0.5 rounded">.github/workflows/worker.yml</code>) setiap hari pukul 02:00 UTC dan mendukung pemicu manual <code className="font-mono text-[11px] bg-sb-mist-soft px-1 py-0.5 rounded">workflow_dispatch</code>. Kamu juga dapat memicu sinkronisasi langsung di bawah ini untuk pengujian data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {WORKER_TRIGGERS.map((trigger) => (
              <Button
                key={trigger.source}
                variant={trigger.variant}
                size="sm"
                onClick={() => onTrigger(trigger.source)}
                disabled={isSubmitting}
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                {trigger.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Audit Riwayat Eksekusi (worker_runs)</CardTitle>
          <CardDescription>
            Mencatat data riwayat crawler: jumlah fetch, data baru, deduplikasi, dan isolasi error.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable data={runs} columns={RUN_COLUMNS} keyExtractor={(row) => row.id} />
        </CardContent>
      </Card>
    </div>
  );
}
