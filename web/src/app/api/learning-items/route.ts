import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, serviceKey);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "00000000-0000-0000-0000-000000000001";

    const supabase = getServiceSupabase();

    const { data: items, error } = await supabase
      .from("learning_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Jika belum ada data untuk pengguna baru / demo, sediakan inisialisasi awal
    if (!items || items.length === 0) {
      const defaultItems = [
        {
          user_id: userId,
          skill_name: "Power BI & DAX Formulas",
          reason: "Kebutuhan utama visualisasi data dan laporan analitik bisnis.",
          resource_suggestion: "Microsoft Learn: Power BI Data Analyst Associate (PL-300).",
          is_done: false,
          priority: "Tinggi",
        },
        {
          user_id: userId,
          skill_name: "dbt (Data Build Tool)",
          reason: "Kualifikasi transformasi data modern stack berbasis SQL.",
          resource_suggestion: "dbt Fundamentals Course (Official dbt Labs Free Certification).",
          is_done: false,
          priority: "Menengah",
        },
        {
          user_id: userId,
          skill_name: "Statistik A/B Testing",
          reason: "Sering disyaratkan untuk evaluasi produk dan eksperimen metrik bisnis.",
          resource_suggestion: "Praktik inferensi statistik dan uji hipotesis data transaksi.",
          is_done: true,
          priority: "Tinggi",
        },
      ];

      const { data: inserted } = await supabase
        .from("learning_items")
        .insert(defaultItems)
        .select("*");

      return NextResponse.json({
        learningItems: (inserted || []).map((it) => ({
          id: it.id,
          skillName: it.skill_name,
          reason: it.reason,
          resourceSuggestion: it.resource_suggestion,
          isDone: it.is_done,
          priority: it.priority,
          createdAt: it.created_at,
        })),
      });
    }

    return NextResponse.json({
      learningItems: items.map((it) => ({
        id: it.id,
        skillName: it.skill_name,
        reason: it.reason,
        resourceSuggestion: it.resource_suggestion,
        isDone: it.is_done,
        priority: it.priority,
        createdAt: it.created_at,
      })),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal memuat daftar target belajar: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, skillName, reason, priority, resourceSuggestion } = body;

    if (!skillName || !skillName.trim()) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    const effectiveUserId = userId || "00000000-0000-0000-0000-000000000001";
    const supabase = getServiceSupabase();

    const { data: newItem, error } = await supabase
      .from("learning_items")
      .insert({
        user_id: effectiveUserId,
        skill_name: skillName.trim(),
        reason: reason || "Ditambahkan berdasarkan analisis gap kebutuhan pasar kerja.",
        priority: priority || "Tinggi",
        resource_suggestion: resourceSuggestion || "Dokumentasi resmi dan latihan studi kasus praktis.",
        is_done: false,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: `Skill '${skillName}' berhasil ditambahkan ke rencana belajar.`,
      item: {
        id: newItem.id,
        skillName: newItem.skill_name,
        reason: newItem.reason,
        resourceSuggestion: newItem.resource_suggestion,
        isDone: newItem.is_done,
        priority: newItem.priority,
        createdAt: newItem.created_at,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menambahkan target belajar: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isDone, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "ID target belajar wajib disertakan" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const updateData: Record<string, unknown> = {};
    if (typeof isDone === "boolean") updateData.is_done = isDone;
    if (priority) updateData.priority = priority;

    const { data: updated, error } = await supabase
      .from("learning_items")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        skillName: updated.skill_name,
        reason: updated.reason,
        resourceSuggestion: updated.resource_suggestion,
        isDone: updated.is_done,
        priority: updated.priority,
        createdAt: updated.created_at,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal memperbarui target belajar: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID target belajar wajib disertakan" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("learning_items").delete().eq("id", id);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: "Target belajar berhasil dihapus.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json(
      { error: "Gagal menghapus target belajar: " + (err.message || "Kesalahan server") },
      { status: 500 }
    );
  }
}

