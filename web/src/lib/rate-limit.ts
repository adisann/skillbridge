import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export interface RateRule {
  /** Nama kebijakan, misalnya "cv-upload:ip-hour". */
  scope: string;
  /** Identitas yang dibatasi (IP, id user, atau "global"). */
  key: string;
  limit: number;
  windowSeconds: number;
  message: string;
}

interface RateResult {
  allowed: boolean;
  retryAfter: number;
}

/** IP klien dari header proxy (Vercel menimpa x-forwarded-for dengan IP asli). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

// Cadangan per-instance bila tabel rate_limits belum tersedia; tidak seketat versi Supabase.
const fallbackCounters = new Map<string, { count: number; resetAt: number }>();

function hitInMemory(id: string, rule: RateRule): RateResult {
  const now = Date.now();
  const entry = fallbackCounters.get(id);
  if (!entry || now > entry.resetAt) {
    fallbackCounters.set(id, { count: 1, resetAt: now + rule.windowSeconds * 1000 });
    return { allowed: true, retryAfter: rule.windowSeconds };
  }
  entry.count += 1;
  return { allowed: entry.count <= rule.limit, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
}

async function hit(rule: RateRule): Promise<RateResult> {
  const id = `${rule.scope}:${rule.key}`;
  try {
    const { data, error } = await getServiceSupabase().rpc("rate_limit_hit", {
      p_key: id,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { allowed: Boolean(row?.allowed), retryAfter: Number(row?.retry_after) || rule.windowSeconds };
  } catch (err) {
    console.error("[rate-limit] Supabase tidak tersedia, memakai penghitung memori:", (err as Error).message);
    return hitInMemory(id, rule);
  }
}

/** Menerapkan aturan berurutan; mengembalikan respons 429 pada aturan pertama yang terlampaui, atau null bila lolos. */
export async function enforceRateLimits(rules: RateRule[]): Promise<NextResponse | null> {
  for (const rule of rules) {
    const result = await hit(rule);
    if (!result.allowed) {
      return NextResponse.json(
        { error: rule.message },
        { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
      );
    }
  }
  return null;
}
