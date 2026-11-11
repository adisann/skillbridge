import { getCanonicalSkill } from "./matching-config.ts";

export const LEARNING_PRIORITIES = ["Tinggi", "Sedang", "Rendah"] as const;

export function normalizeSkillName(name: string): string {
  return getCanonicalSkill(name);
}

// The old UI offered these as priority choices, in descending order.
export function displayLearningPriority(priority: string): string {
  return ({ Menengah: "Sedang", Dasar: "Rendah" } as Record<string, string>)[priority] || priority;
}

export interface LearningItem {
  id: string;
  skillName: string;
  skillKey: string;
  reason: string;
  resourceSuggestion: string;
  isDone: boolean;
  priority: string;
  notes: string;
  sourceJobId: string | null;
  duplicateOf: string | null;
}

export function noteSegments(value: string): { text: string; href?: string }[] {
  return value.split(/(https?:\/\/[^\s<>"']+)/g).filter(Boolean).flatMap((text) => {
    const clean = text.replace(/[.,;!?)]+$/, "");
    try {
      const url = new URL(clean);
      if ((url.protocol === "http:" || url.protocol === "https:") && url.hostname) {
        return [{ text: clean, href: url.href }, { text: text.slice(clean.length) }];
      }
    } catch { /* Plain text remains plain text. */ }
    return [{ text }];
  });
}

export function learningItemFromRow(row: Record<string, unknown>) {
  return {
    id: row.id, skillName: row.skill_name, skillKey: row.skill_key,
    reason: row.reason, resourceSuggestion: row.resource_suggestion,
    isDone: row.is_done, priority: displayLearningPriority(String(row.priority)),
    notes: row.notes, sourceJobId: row.source_job_id, duplicateOf: row.duplicate_of,
    createdAt: row.created_at,
  };
}
