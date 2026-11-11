// Read-only HEAD requests: no CV contents, identities, tokens, or passwords are printed.
try { process.loadEnvFile("web/.env.local"); } catch { /* CI may provide env directly. */ }
const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!origin || !anon) throw new Error("Konfigurasi Supabase publik belum tersedia.");

let failed = false;
const checks = [
  ...["profiles", "resumes", "resume_skills", "saved_jobs", "learning_items"].map((table) => ({ table })),
  { table: "ai_chat_cache", cacheType: "cv_analysis" },
  { table: "ai_chat_cache", cacheType: "job_knowledge" },
];
for (const { table, cacheType } of checks) {
  const url = new URL(`/rest/v1/${table}`, origin);
  url.searchParams.set("select", "*");
  url.searchParams.set("limit", "1");
  if (cacheType) url.searchParams.set("cache_type", `eq.${cacheType}`);
  const response = await fetch(url, {
    method: "HEAD",
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: "count=exact" },
    signal: AbortSignal.timeout(12000),
  });
  const count = response.headers.get("content-range")?.split("/").at(-1);
  const passed = [401, 403].includes(response.status) || (response.ok && count === "0");
  if (!passed) failed = true;
  console.log(JSON.stringify({ table, cacheType, status: response.status, noAnonymousRows: passed }));
}
process.exitCode = failed ? 1 : 0;
