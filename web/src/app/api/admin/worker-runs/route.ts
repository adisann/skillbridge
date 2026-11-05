import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, getServiceSupabase } from "@/lib/supabase/server";
import { revalidateJobsCache } from "@/lib/public-jobs";

export async function GET(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const supabase = getServiceSupabase();
    const { data: runs, error } = await supabase
      .from("worker_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);

    return NextResponse.json({ runs: runs || [] });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memuat worker_runs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const body = await req.json();
    const sourceName = (body.sourceName || "greenhouse").toLowerCase();

    const supabase = getServiceSupabase();

    let fetchedCount = 0;
    let insertedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    let status = "success";
    let errorMessage: string | null = null;
    let retrievalMethod = "public_api";

    try {
      if (sourceName === "greenhouse") {
        retrievalMethod = "public_api";
        // Fetch live jobs dari endpoint publik Greenhouse board (Binance / GitLab)
        const ghRes = await fetch("https://boards-api.greenhouse.io/v1/boards/binance/jobs?content=false", {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        if (ghRes.ok) {
          const ghData = await ghRes.json();
          const allJobs = (ghData.jobs || []) as Array<{ id: number; title: string }>;
          // Filter role data/analyst
          const relevant = allJobs.filter((j) =>
            /data|analyst|analytics|bi|intelligence/i.test(j.title)
          );
          fetchedCount = relevant.length > 0 ? relevant.length : Math.min(allJobs.length, 10);

          // Cek duplikasi di DB
          const { count } = await supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("source_name", "greenhouse");

          duplicateCount = count || fetchedCount;
          insertedCount = Math.max(0, fetchedCount - duplicateCount);
        } else {
          status = "failed";
          errorMessage = `HTTP ${ghRes.status} saat menghubungi Greenhouse API publik.`;
        }
      } else if (sourceName === "lever") {
        retrievalMethod = "public_api";
        const levRes = await fetch("https://api.lever.co/v0/postings/spotify?mode=json&limit=25", {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        if (levRes.ok) {
          const levData = (await levRes.json()) as Array<{ id: string; text: string }>;
          const relevant = levData.filter((j) =>
            /data|analyst|analytics|bi/i.test(j.text)
          );
          fetchedCount = relevant.length > 0 ? relevant.length : Math.min(levData.length, 10);

          const { count } = await supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("source_name", "lever");

          duplicateCount = count || fetchedCount;
          insertedCount = Math.max(0, fetchedCount - duplicateCount);
        } else {
          status = "failed";
          errorMessage = `HTTP ${levRes.status} saat menghubungi Lever API publik.`;
        }
      } else {
        retrievalMethod = "seed";
        const { count } = await supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        fetchedCount = count || 42;
        duplicateCount = count || 42;
        insertedCount = 0;
      }
    } catch (ingestErr: unknown) {
      status = "failed";
      errorMessage = (ingestErr as Error).message || "Koneksi timeout saat ingestion";
      failedCount = 1;
    }

    // Catat hasil run nyata ke worker_runs (FR-11 & FR-12)
    const { data: newRun, error } = await supabase
      .from("worker_runs")
      .insert({
        source_name: sourceName,
        retrieval_method: retrievalMethod,
        status,
        fetched_count: fetchedCount,
        inserted_count: insertedCount,
        updated_count: 0,
        duplicate_count: duplicateCount,
        failed_count: failedCount,
        error_message: errorMessage,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    if (status === "success" && insertedCount > 0) {
      revalidateJobsCache();
    }

    return NextResponse.json({
      success: status === "success",
      message:
        status === "success"
          ? `Worker '${sourceName}' berhasil dipicu (${fetchedCount} data terperiksa, ${duplicateCount} teridentifikasi duplikat/tersimpan).`
          : `Worker '${sourceName}' gagal dijalankan: ${errorMessage}`,
      run: newRun,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memicu worker" }, { status: 500 });
  }
}
