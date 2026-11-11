import { getServiceSupabase } from "@/lib/supabase/server";
import { promptCacheKey } from "./cache-key";

// In-Memory Fast LRU Cache fallback (works even if DB table is unmigrated or unreachable)
interface MemoryCacheItem {
  response: string;
  provider: string;
  expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheItem>();
const MAX_MEMORY_ITEMS = 300;
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function remember(memKey: string, responseText: string, provider: string) {
  if (memoryCache.size >= MAX_MEMORY_ITEMS) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey) memoryCache.delete(firstKey);
  }
  memoryCache.set(memKey, { response: responseText, provider, expiresAt: Date.now() + DEFAULT_TTL_MS });
}

// ---------------------------------------------------------------------------
// 1. Job Knowledge Cache (Public across users for identical job content)
// ---------------------------------------------------------------------------
export async function getJobKnowledgeCache(
  jobId: string,
  contentHash: string,
  question: string
): Promise<{ text: string; provider: string } | null> {
  const promptKey = promptCacheKey(question);
  const memKey = `job:${jobId}:${contentHash}:${promptKey}`;

  // Check Memory cache first
  const memItem = memoryCache.get(memKey);
  if (memItem && Date.now() < memItem.expiresAt) {
    return { text: memItem.response, provider: `${memItem.provider} (Cache)` };
  }

  // Check Supabase DB cache
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("ai_chat_cache")
      .select("response_text, provider")
      .eq("cache_type", "job_knowledge")
      .eq("job_id", jobId)
      .eq("content_hash", contentHash)
      .eq("prompt_key", promptKey)
      .maybeSingle();

    if (!error && data?.response_text) {
      // Re-populate memory cache
      remember(memKey, data.response_text, data.provider || "Gemini");
      return { text: data.response_text, provider: `${data.provider || "Gemini"} (Cache)` };
    }
  } catch {
    // Ignore db cache error; fallback seamlessly
  }

  return null;
}

export async function setJobKnowledgeCache(
  jobId: string,
  contentHash: string,
  question: string,
  responseText: string,
  provider: string
): Promise<void> {
  const promptKey = promptCacheKey(question);
  const memKey = `job:${jobId}:${contentHash}:${promptKey}`;

  // Save to Memory
  remember(memKey, responseText, provider);

  // Save to Supabase DB asynchronously
  try {
    const supabase = getServiceSupabase();
    await supabase.from("ai_chat_cache").upsert(
      {
        cache_type: "job_knowledge",
        job_id: jobId,
        user_id: null,
        content_hash: contentHash,
        prompt_key: promptKey,
        response_text: responseText,
        provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "job_id,content_hash,prompt_key" }
    );
  } catch {
    // Gracefully handle if DB table is unmigrated
  }
}

// ---------------------------------------------------------------------------
// 2. CV-Job Analysis Cache (Strictly scoped to user & active resume)
// ---------------------------------------------------------------------------
export async function getCvAnalysisCache(
  userId: string,
  resumeId: string,
  jobId: string,
  contentHash: string,
  question: string
): Promise<{ text: string; provider: string } | null> {
  const promptKey = promptCacheKey(question);
  const memKey = `cv:${userId}:${resumeId}:${jobId}:${contentHash}:${promptKey}`;

  const memItem = memoryCache.get(memKey);
  if (memItem && Date.now() < memItem.expiresAt) {
    return { text: memItem.response, provider: `${memItem.provider} (Cache)` };
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("ai_chat_cache")
      .select("response_text, provider")
      .eq("cache_type", "cv_analysis")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .eq("content_hash", contentHash)
      .eq("prompt_key", promptKey)
      .maybeSingle();

    if (!error && data?.response_text) {
      remember(memKey, data.response_text, data.provider || "Gemini");
      return { text: data.response_text, provider: `${data.provider || "Gemini"} (Cache)` };
    }
  } catch {
    // Ignore error
  }

  return null;
}

export async function setCvAnalysisCache(
  userId: string,
  resumeId: string,
  jobId: string,
  contentHash: string,
  question: string,
  responseText: string,
  provider: string
): Promise<void> {
  const promptKey = promptCacheKey(question);
  const memKey = `cv:${userId}:${resumeId}:${jobId}:${contentHash}:${promptKey}`;

  // Save to Memory
  remember(memKey, responseText, provider);

  // Save to Supabase DB asynchronously
  try {
    const supabase = getServiceSupabase();
    await supabase.from("ai_chat_cache").upsert(
      {
        cache_type: "cv_analysis",
        job_id: jobId,
        user_id: userId,
        content_hash: contentHash,
        prompt_key: promptKey,
        response_text: responseText,
        provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id,content_hash,prompt_key" }
    );
  } catch {
    // Ignore error
  }
}

/**
 * Menghapus seluruh cache AI yang terkait dengan pengguna (NFR-02 Privasi CV)
 */
export async function clearCvAnalysisCache(userId: string): Promise<void> {
  // 1. Bersihkan dari memory cache
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(`cv:${userId}:`)) {
      memoryCache.delete(key);
    }
  }

  // 2. Bersihkan dari database tabel ai_chat_cache
  try {
    const supabase = getServiceSupabase();
    await supabase.from("ai_chat_cache").delete().eq("user_id", userId);
  } catch (err) {
    console.warn("[Cache] Gagal menghapus ai_chat_cache:", err);
  }
}

