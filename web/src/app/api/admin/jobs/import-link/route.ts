import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/supabase/server";
import { extractJobFromText } from "@/lib/ai/extractor";
import { enforceRateLimits } from "@/lib/rate-limit";
import { adminAiImportRules } from "@/lib/rate-limit-policies";
import { readJobStreetPosting } from "@/lib/jobstreet-posting";
import { fetchPublicJobPage, isSafePublicJobUrl, PublicJobUrlError } from "@/lib/public-job-fetch";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const limited = await enforceRateLimits(adminAiImportRules(admin.id));
    if (limited) return limited;

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL lowongan wajib diisi." }, { status: 400 });
    }

    // Validasi SSRF
    const safetyCheck = isSafePublicJobUrl(url);
    if (!safetyCheck.isSafe) {
      return NextResponse.json({ error: safetyCheck.reason || "URL ditolak demi keamanan server." }, { status: 400 });
    }

    // Fetch konten halaman lowongan secara aman
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let html = "";
    try {
      const res = await fetchPublicJobPage(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "id,en-US;q=0.9,en;q=0.8",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Gagal mengakses URL lowongan (HTTP ${res.status}: ${res.statusText})` },
          { status: 400 }
        );
      }

      html = await res.text();
    } catch (fetchErr: unknown) {
      if (fetchErr instanceof PublicJobUrlError) {
        return NextResponse.json({ error: fetchErr.message }, { status: 400 });
      }
      const isAbort = fetchErr instanceof Error && fetchErr.name === "AbortError";
      return NextResponse.json(
        {
          error: isAbort
            ? "Permintaan ke URL melebihi batas waktu (timeout 12 detik)."
            : "Tidak dapat menghubungi server sumber lowongan.",
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (/(^|\.)jobstreet\.com$/i.test(new URL(url).hostname)) {
      const posting = readJobStreetPosting(html, url);
      if (!posting) {
        return NextResponse.json(
          { error: "Halaman JobStreet tidak menampilkan isi lowongan. Periksa tautannya atau gunakan Tambah Manual." },
          { status: 422 },
        );
      }

      const text = [posting.title, posting.company, posting.location, posting.employmentType, posting.description].filter(Boolean).join("\n");
      try {
        const extracted = await extractJobFromText(text, url);
        return NextResponse.json({ success: true, job: { ...extracted, ...posting } });
      } catch {
        return NextResponse.json({ success: true, job: posting });
      }
    }

    // Sanitasi HTML sederhana untuk mengekstrak teks relevan
    const sanitizedText = sanitizeHtmlToText(html);

    if (!sanitizedText || sanitizedText.length < 50) {
      return NextResponse.json(
        { error: "Konten lowongan dari URL terlalu pendek atau tidak dapat terbaca." },
        { status: 422 }
      );
    }

    // Ekstrak struktur lowongan menggunakan AI
    const extracted = await extractJobFromText(sanitizedText, url);

    return NextResponse.json({
      success: true,
      message: "Lowongan berhasil diekstrak dari tautan sumber.",
      job: extracted,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Admin Import Link Error]:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses tautan lowongan." },
      { status: 500 }
    );
  }
}

function sanitizeHtmlToText(html: string): string {
  let text = html;
  // Hapus tag script, style, svg, noscript, nav, header, footer
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, " ");
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ");
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ");
  text = text.replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, " ");

  // Hapus semua tag HTML tersisa dan decode entities
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Normalisasi spasi dan baris baru
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

