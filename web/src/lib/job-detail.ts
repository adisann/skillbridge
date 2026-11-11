import type { RequirementEvaluation, RequirementStatus } from "@/lib/matching";
import type { JobDetailData } from "@/types/job";

const DAY_MS = 24 * 60 * 60 * 1000;
const FALLBACK_DEADLINE_DAYS = 30;
const FALLBACK_DEADLINE_LABEL = "30 Nov 2026";

const deadlineFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function parseValidDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** Deadline dari data lowongan; jika kosong, 30 hari setelah tanggal pengambilan. */
export function formatDeadlineDate(deadline?: string, retrievedAt?: string): string {
  const explicit = parseValidDate(deadline);
  if (explicit) return deadlineFormatter.format(explicit);

  const retrieved = parseValidDate(retrievedAt);
  if (retrieved) {
    return deadlineFormatter.format(new Date(retrieved.getTime() + FALLBACK_DEADLINE_DAYS * DAY_MS));
  }
  return FALLBACK_DEADLINE_LABEL;
}

const STATUS_LABEL: Record<RequirementStatus, RequirementEvaluation["statusLabel"]> = {
  cocok: "Cocok di CV",
  belum_cukup_bukti: "Belum cukup bukti",
  belum_ditemukan: "Belum ditemukan di CV",
};

function evaluateSkill(job: JobDetailData, skill: string, id: string, isMandatory: boolean): RequirementEvaluation {
  const status: RequirementStatus = job.matchedSkills.includes(skill)
    ? "cocok"
    : (job.unprovenSkills || []).includes(skill)
      ? "belum_cukup_bukti"
      : "belum_ditemukan";

  return { id, skill, isMandatory, status, statusLabel: STATUS_LABEL[status], evidence: "" };
}

/** Evaluasi dari backend; bila belum ada, direkonstruksi dari skill lowongan dan hasil match. */
export function resolveRequirementEvaluations(job: JobDetailData): RequirementEvaluation[] {
  if (job.requirementsEvaluation && job.requirementsEvaluation.length > 0) {
    return job.requirementsEvaluation;
  }
  return [
    ...job.requiredSkills.map((skill, idx) => evaluateSkill(job, skill, `req-m-${idx}`, true)),
    ...job.preferredSkills.map((skill, idx) => evaluateSkill(job, skill, `req-p-${idx}`, false)),
  ];
}

const BULLET = "•▪●◦‣";

const HTML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith("#")) {
      const point = Number(code.slice(1));
      return point <= 0x10ffff ? String.fromCodePoint(point) : match;
    }
    return HTML_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Deskripsi yang tersimpan sebagai HTML mentah diubah menjadi teks biasa dengan bullet. */
function htmlToPlainText(raw: string): string {
  if (!/<\/?[a-z][^>]*>/i.test(raw)) return decodeEntities(raw);
  const text = raw
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Merapikan deskripsi hasil scrape: HTML mentah jadi teks, bullet yang berdiri sendiri digabung dengan teksnya, dan daftar dirapatkan. */
export function formatJobDescription(raw: string): string {
  return htmlToPlainText(raw)
    .replace(new RegExp(`^[ \\t]*([${BULLET}\\-*])[ \\t]*\\n+[ \\t]*(?=\\S)`, "gm"), "$1 ")
    .replace(/[ \t]+([,.;:])/g, "$1")
    .replace(new RegExp(`^([${BULLET}] [^\\n]*)\\n\\n(?=[${BULLET}] )`, "gm"), "$1\n");
}
