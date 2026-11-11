import { Database, History, Layers } from "lucide-react";
import type { AdminTab } from "@/types/admin";

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (tab: AdminTab) => void;
  counts: Record<AdminTab, number | null>;
}

const TABS = [
  { id: "jobs", Icon: Database, label: "Lowongan" },
  { id: "skills", Icon: Layers, label: "Skill & Sumber" },
  { id: "runs", Icon: History, label: "Riwayat" },
] as const;

export function AdminTabs({ activeTab, onChange, counts }: AdminTabsProps) {
  return (
    <nav aria-label="Pengelolaan admin" className="grid grid-cols-3 border-b border-sb-border">
      {TABS.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-current={activeTab === id ? "page" : undefined}
          onClick={() => onChange(id)}
          className={`flex items-center justify-center gap-stack-2xs min-w-0 px-stack-2xs py-stack-xs text-xs font-bold border-b-2 transition-colors duration-150 ${
            activeTab === id
              ? "border-sb-blue text-sb-blue"
              : "border-transparent text-sb-text-2 hover:text-sb-navy"
          }`}
        >
          <Icon className="hidden sm:block w-4 h-4 shrink-0" />
          <span>{label}<span className="block sm:inline text-[11px] font-normal"> ({counts[id] ?? "—"})</span></span>
        </button>
      ))}
    </nav>
  );
}
