import { NextRequest, NextResponse } from "next/server";
import { LEARNING_PRIORITIES, learningItemFromRow, normalizeSkillName } from "@/lib/learning";
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

    const { data: aliasRows, error: aliasError } = await supabase.from("skill_aliases").select("alias, skills(name)");
    if (aliasError) throw new Error(aliasError.message);
    const aliases = Object.fromEntries((aliasRows || []).map((row) => [normalizeSkillName(row.alias), normalizeSkillName((row.skills as unknown as { name: string }).name)]));
    const headers = new Headers();
    headers.set("Cache-Control", "private, no-store, must-revalidate");

    return NextResponse.json(
      {
        learningItems: (items || []).map(learningItemFromRow),
        aliases,
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
    const { skillName, reason, priority = "Tinggi", resourceSuggestion, sourceJobId } = body;

    if (typeof skillName !== "string" || !skillName.trim() || skillName.length > 200) {
      return NextResponse.json({ error: "Nama skill wajib diisi" }, { status: 400 });
    }

    if (!LEARNING_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Prioritas belajar tidak valid." }, { status: 400 });
    }
    const { data: newItem, error } = await supabase.rpc("add_learning_item", {
      p_skill_name: skillName,
      p_reason: typeof reason === "string" ? reason : "Ditambahkan ke rencana belajar.",
      p_priority: priority,
      p_resource: typeof resourceSuggestion === "string" ? resourceSuggestion : "",
      p_job_id: sourceJobId || null,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: `Skill '${skillName}' berhasil ditambahkan ke rencana belajar.`,
      item: learningItemFromRow(newItem),
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
    const { id, isDone, priority, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "ID target belajar wajib disertakan" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (typeof isDone === "boolean") updateData.is_done = isDone;
    if (priority !== undefined) {
      if (!LEARNING_PRIORITIES.includes(priority)) return NextResponse.json({ error: "Prioritas belajar tidak valid." }, { status: 400 });
      updateData.priority = priority;
    }
    if (notes !== undefined) {
      if (typeof notes !== "string" || notes.length > 20000) return NextResponse.json({ error: "Catatan maksimal 20.000 karakter." }, { status: 400 });
      updateData.notes = notes;
    }
    if (!Object.keys(updateData).length) return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });

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
      item: learningItemFromRow(updated),
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

