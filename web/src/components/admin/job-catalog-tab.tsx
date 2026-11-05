import { Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { AdminJob } from "@/types/admin";

const VISIBLE_SKILLS = 4;

interface JobCatalogTabProps {
  jobs: AdminJob[];
  onEdit: (job: AdminJob) => void;
  onDuplicate: (job: AdminJob) => void;
  onDelete: (job: AdminJob) => void;
}

export function JobCatalogTab({ jobs, onEdit, onDuplicate, onDelete }: JobCatalogTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-sb-mist-faint text-sb-navy font-semibold">
                    {job.sourceName}
                  </span>
                  <CardTitle className="text-base font-bold text-sb-navy mt-1 line-clamp-1">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-sb-text-2">
                    {job.company} • {job.location}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
              <div className="flex flex-wrap gap-1">
                {(job.requiredSkills || []).slice(0, VISIBLE_SKILLS).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded bg-sb-mist-soft text-xs text-sb-navy font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </CardContent>
            <div className="px-4 py-2.5 bg-sb-mist-soft border-t border-sb-border flex flex-col gap-1.5 text-xs rounded-b-xl">
              <span className="w-full truncate text-sb-text-2 font-mono text-[11px]" title={job.canonicalTitle}>
                {job.canonicalTitle}
              </span>
              <div className="flex flex-wrap items-center justify-end gap-1 whitespace-nowrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(job)}
                  leftIcon={<Pencil className="w-3.5 h-3.5" />}
                  className="text-xs text-sb-text-2 hover:text-sb-blue px-2 py-1 h-auto"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDuplicate(job)}
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  className="text-xs text-sb-text-2 hover:text-sb-blue px-2 py-1 h-auto"
                >
                  Duplikasi
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(job)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 h-auto"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
