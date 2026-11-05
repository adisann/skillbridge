import { Link2, Plus, ScanText, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  isSubmitting: boolean;
  onImportUrl: () => void;
  onImportOcr: () => void;
  onAddManual: () => void;
  onImportCsv: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AdminHeader({ isSubmitting, onImportUrl, onImportOcr, onAddManual, onImportCsv }: AdminHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-sb-navy tracking-tight">
          Dashboard Admin Import & Monitoring
        </h1>
        <p className="text-xs sm:text-sm text-sb-text-2 mt-1">
          Kelola katalog lowongan manual, taksonomi normalisasi skill, dan pantau log audit riwayat worker_runs.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={onImportUrl} leftIcon={<Link2 className="w-3.5 h-3.5 text-sb-blue" />}>
          Impor via Tautan (URL)
        </Button>
        <Button variant="outline" size="sm" onClick={onImportOcr} leftIcon={<ScanText className="w-3.5 h-3.5 text-sb-blue" />}>
          Impor via OCR (Flyer)
        </Button>
        <Button variant="primary" size="sm" onClick={onAddManual} leftIcon={<Plus className="w-4 h-4" />}>
          Tambah Manual
        </Button>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" onChange={onImportCsv} className="hidden" disabled={isSubmitting} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sb-border bg-white hover:bg-sb-mist-soft text-xs font-semibold text-sb-navy shadow-2xs transition-colors">
            <UploadCloud className="w-3.5 h-3.5 text-sb-text-2" />
            CSV
          </span>
        </label>
      </div>
    </div>
  );
}
