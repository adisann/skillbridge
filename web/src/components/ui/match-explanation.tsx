import type { MatchCategory } from "@/lib/matching";

export function MatchExplanation({ status, supporting = [], limiting = [] }: {
  status: MatchCategory;
  supporting?: string[];
  limiting?: string[];
}) {
  const reason = status === "match" || status === "potentially_overqualified" ? supporting[0] : limiting[0];
  return reason ? <p className="text-xs leading-relaxed text-sb-text-2">{reason}</p> : null;
}
