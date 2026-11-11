import test from "node:test";
import assert from "node:assert/strict";

// Muat variabel lingkungan lokal jika tersedia
try {
  process.loadEnvFile?.(".env.local");
} catch {
  // File .env.local tidak ada di environment runner / CI, gunakan env process standar
}

test("API Authentication and Role Protection Tests", async (t) => {
  // Cek apakah server dev lokal aktif di port 3001 atau 3000
  let baseUrl: string | null = null;
  for (const port of [3001, 3000]) {
    try {
      const ping = await fetch(`http://localhost:${port}/api/admin/skills`, {
        signal: AbortSignal.timeout(1000),
      });
      if (ping.status === 401 || ping.status === 403) {
        baseUrl = `http://localhost:${port}`;
        break;
      }
    } catch {
      // Port tidak aktif, coba port berikutnya
    }
  }

  // 1. Tes Unauthenticated Request -> 401
  await t.test("Semua route user terproteksi menolak unauthenticated request dengan status 401", async (context) => {
    if (!baseUrl) {
      return context.skip("Server lokal tidak aktif; uji HTTP tidak dijalankan.");
    }

    const endpoints = [
      { path: "/api/cv/save", method: "POST", body: JSON.stringify({ role: "Data Analyst", skills: ["SQL"] }) },
      { path: "/api/cv/delete", method: "POST", body: JSON.stringify({ cvId: "mock-cv" }) },
      { path: "/api/cv/upload", method: "POST", body: JSON.stringify({ fileName: "test.pdf" }) },
      { path: "/api/saved-jobs", method: "GET" },
      { path: "/api/learning-items", method: "GET" },
    ];

    for (const ep of endpoints) {
      const res: Response = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
        body: ep.body,
      });

      assert.equal(
        res.status,
        401,
        `Endpoint ${ep.method} ${ep.path} tanpa token harus mengembalikan status 401 Unauthorized`
      );

      const json = await res.json();
      assert.ok(
        json.error && typeof json.error === "string",
        `Endpoint ${ep.path} harus menyertakan pesan error valid`
      );
    }
  });

  // 2. Tes Admin Route tanpa Autentikasi -> 401
  await t.test("Semua route admin menolak unauthenticated request dengan status 401", async (context) => {
    if (!baseUrl) {
      return context.skip("Server lokal tidak aktif; uji HTTP tidak dijalankan.");
    }

    const adminEndpoints = [
      { path: "/api/admin/skills", method: "GET" },
      { path: "/api/admin/jobs/import-link", method: "POST", body: JSON.stringify({ url: "https://example.com" }) },
      { path: "/api/admin/worker-runs", method: "GET" },
    ];

    for (const ep of adminEndpoints) {
      const res: Response = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { "Content-Type": "application/json" },
        body: ep.body,
      });

      assert.equal(
        res.status,
        401,
        `Admin route ${ep.method} ${ep.path} tanpa token harus mengembalikan status 401`
      );
    }
  });

  // 3. Tes Hak Akses Admin (403 untuk Non-Admin, 200 untuk Admin)
  await t.test("Route admin menolak user non-admin (403) dan mengizinkan admin resmi (200)", async (context) => {
    // Ambil kredensial dari process.env jika tersedia
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Kata sandi akun uji tidak disimpan di repo: berikan lewat env saat menjalankan uji integrasi.
    const juriPassword = process.env.TEST_JURI_PASSWORD;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    const juriEmail = process.env.TEST_JURI_EMAIL;
    const adminEmail = process.env.TEST_ADMIN_EMAIL;

    if (!baseUrl || !supabaseUrl || !anonKey || !juriPassword || !adminPassword || !juriEmail || !adminEmail) {
      return context.skip("Akun integrasi admin/non-admin belum dikonfigurasi lewat env.");
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, anonKey);

    // Login sebagai Juri (Non-Admin)
    const { data: juriAuth, error: juriErr } = await supabase.auth.signInWithPassword({
      email: juriEmail,
      password: juriPassword,
    });

    assert.equal(juriErr, null, "Login akun non-admin untuk pengujian harus berhasil");
    assert.ok(juriAuth.session?.access_token);
    {
      const res: Response = await fetch(`${baseUrl}/api/admin/skills`, {
        headers: {
          Authorization: `Bearer ${juriAuth.session.access_token}`,
        },
      });

      assert.equal(
        res.status,
        403,
        "User juri (non-admin) harus ditolak dengan status 403 Forbidden saat mengakses route admin"
      );

      const json = await res.json();
      assert.match(json.error, /Akses terlarang/i, "Pesan error harus menunjukkan penolakan hak akses admin");
    }

    // Login sebagai Admin Resmi
    const { data: adminAuth, error: adminErr } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    assert.equal(adminErr, null, "Login akun admin untuk pengujian harus berhasil");
    assert.ok(adminAuth.session?.access_token);
    {
      const res: Response = await fetch(`${baseUrl}/api/admin/skills`, {
        headers: {
          Authorization: `Bearer ${adminAuth.session.access_token}`,
        },
      });

      assert.equal(
        res.status,
        200,
        "Akun admin resmi harus diizinkan mengakses route admin dengan status 200 OK"
      );

      const json = await res.json();
      assert.ok(Array.isArray(json.skills), "Response admin harus menyertakan array data skills");
    }
  });

  // SSRF memakai fungsi produksi dan mock jaringan di job-import.test.ts.
});
