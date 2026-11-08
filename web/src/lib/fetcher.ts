/**
 * Client-side in-flight request deduplication and short-term cache.
 * Mencegah duplikasi pemanggilan API (seperti /api/insights, /api/jobs, /api/saved-jobs)
 * saat beberapa komponen me-mount bersamaan atau akibat React StrictMode di mode pengembangan.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const inFlightRequests = new Map<string, Promise<unknown>>();
let cacheGeneration = 0;
const clientCache = new Map<string, CacheEntry<unknown>>();

/**
 * Melakukan fetch dengan deduplikasi in-flight promise dan cache singkat di client.
 * Hanya me-cache request bertipe GET. Request mutasi (POST, PUT, DELETE) akan langsung dieksekusi
 * dan otomatis membersihkan entri cache terkait.
 */
export async function fetchDeduped<T = unknown>(
  input: string | URL,
  init?: RequestInit,
  maxAgeMs = 10000
): Promise<T> {
  const url = typeof input === "string" ? input : input.toString();
  const method = (init?.method || "GET").toUpperCase();

  // Jika bukan GET, eksekusi langsung dan hapus cache terkait
  if (method !== "GET") {
    clearDedupedCache(url.split("?")[0]);
    const res = await fetch(url, init);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP error ${res.status}`);
    }
    clearDedupedCache(url.split("?")[0]);
    return (await res.json()) as T;
  }

  const cacheKey = url;
  const now = Date.now();

  // 1. Cek cache lokal jika masih valid
  const cached = clientCache.get(cacheKey);
  if (cached && now - cached.timestamp < maxAgeMs) {
    return cached.data as T;
  }

  // 2. Cek in-flight promise jika request sedang berjalan
  const existingInFlight = inFlightRequests.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight as Promise<T>;
  }

  // 3. Buat in-flight promise baru
  const generation = cacheGeneration;
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        ...init,
        // Pastikan credentials include agar session cookie terkirim
        credentials: init?.credentials || "include",
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP error ${res.status}`);
      }

      const data = (await res.json()) as T;
      if (generation === cacheGeneration) clientCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      if (generation === cacheGeneration) inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Menghapus cache client untuk url tertentu atau seluruh cache jika tanpa parameter.
 */
export function clearDedupedCache(prefix?: string) {
  cacheGeneration++;
  inFlightRequests.clear();
  if (!prefix) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      clientCache.delete(key);
    }
  }
}

