import { Database, History, Layers } from "lucide-react";
import type { AdminTab } from "@/types/admin";

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
  counts: Record<AdminTab, number>;
}

const TABS = [
  { id: "jobs", Icon: Database, label: "Katalog Lowongan" },
  { id: "skills", Icon: Layers, label: "Taksonomi Skill & Sumber" },
  { id: "runs", Icon: History, label: "Riwayat worker_runs" },
] as const;

export function AdminTabs({ activeTab, onChange, counts }: AdminTabsProps) {
  return (
    <div className="flex items-center gap-2 border-b border-sb-border">
      {TABS.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors duration-150 ${
            activeTab === id
              ? "border-sb-blue text-sb-blue"
              : "border-transparent text-sb-text-2 hover:text-sb-navy"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label} ({counts[id]})
        </button>
      ))}
    </div>
  );
}
