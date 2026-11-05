import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, getServiceSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const supabase = getServiceSupabase();
    const { data: skills, error: sErr } = await supabase
      .from("skills")
      .select("*, skill_aliases(*)")
      .order("name", { ascending: true });

    if (sErr) throw new Error(sErr.message);

    const { data: sources, error: srcErr } = await supabase
      .from("job_sources")
      .select("*")
      .order("created_at", { ascending: true });

    if (srcErr) throw new Error(srcErr.message);

    return NextResponse.json({
      skills: skills || [],
      sources: sources || [],
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memuat taksonomi skill" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const body = await req.json();
    const { skillName, alias, category } = body;

    const supabase = getServiceSupabase();

    if (skillName && category) {
      const { data, error } = await supabase
        .from("skills")
        .insert({ name: skillName.trim(), category: category.trim() })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, skill: data });
    }

    if (alias && skillName) {
      // Cari skill_id
      const { data: found } = await supabase.from("skills").select("id").ilike("name", skillName.trim()).single();
      if (!found) throw new Error("Skill master tidak ditemukan.");

      const { data: newAlias, error } = await supabase
        .from("skill_aliases")
        .insert({ alias: alias.trim(), skill_id: found.id })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, alias: newAlias });
    }

    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal menyimpan skill" }, { status: 500 });
  }
}
