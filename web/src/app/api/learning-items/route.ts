import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk melihat target belajar." },
        { status: 401 }
      );
    }

    const { data: items, error } = await supabase
      .from("learning_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const headers = new Headers();
    headers.set("Cache-Control", "private, no-store, must-revalidate");

    return NextResponse.json(
      {
        learningItems: (items || []).map((it) => ({
          id: it.id,
          skillName: it.skill_name,
          reason: it.reason,
          resourceSuggestion: it.resource_suggestion,
          isDone: it.is_done,
          priority: it.priority,
          createdAt: it.created_at,
        })),
      },
      { headers }
    );
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
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk menambah target belajar." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { skillName, reason, priority, resourceSuggestion } = body;

    if (!skillName || !skillName.trim()) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    const { data: newItem, error } = await supabase
      .from("learning_items")
      .insert({
        user_id: user.id,
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
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk mengubah target belajar." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, isDone, priority } = body;

    if (!id) {
      return NextResponse.json({ error: "ID target belajar wajib disertakan" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isDone === "boolean") updateData.is_done = isDone;
    if (priority) updateData.priority = priority;

    const { data: updated, error } = await supabase
      .from("learning_items")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
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
    const { user, supabase, error: authError } = await getAuthenticatedUser(req);
    if (!user || authError) {
      return NextResponse.json(
        { error: "Sesi autentikasi tidak ditemukan. Silakan login terlebih dahulu untuk menghapus target belajar." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID target belajar wajib disertakan" }, { status: 400 });
    }

    const { error } = await supabase
      .from("learning_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

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

