import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin, getServiceSupabase } from "@/lib/supabase/server";
import { getCachedPublicJobs, revalidateJobsCache } from "@/lib/public-jobs";
import { getCategoryFromTitle, getCategoryBySlug } from "@/lib/job-categories";
import { loadCandidateProfile } from "@/lib/candidate-profile";
import { parseAdminSalary } from "@/lib/admin-salary";
import { formatJobListItem, countJobsPerCategory } from "@/lib/job-list-format";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("bidang") || searchParams.get("role");
    const query = searchParams.get("q");

    // Ringkasan ringan untuk landing page: jumlah lowongan & bidang, tanpa daftar lowongan
    if (searchParams.get("summary") === "1") {
      const allJobs = await getCachedPublicJobs();
      return NextResponse.json(
        { total: allJobs.length, categories: countJobsPerCategory(allJobs) },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
      );
    }

    const { user, supabase } = await getAuthenticatedUser(req);

    // 1. Ambil katalog lowongan aktif dari cache server (unstable_cache tag 'jobs')
    const allJobs = await getCachedPublicJobs();

    // Filter lowongan berdasarkan bidang / role dan query pencarian
    let filteredJobs = allJobs;
    if (role && role !== "all") {
      const lowerRole = role.toLowerCase();
      const catFilter = getCategoryBySlug(role);
      filteredJobs = filteredJobs.filter((j) => {
        if (catFilter) {
          const jCat = getCategoryFromTitle(j.title, j.canonical_title);
          if (jCat.slug === catFilter.slug) return true;
        }
        return (
          (j.canonical_title || "").toLowerCase().includes(lowerRole) ||
          (j.title || "").toLowerCase().includes(lowerRole)
        );
      });
    }
    if (query) {
      const q = query.toLowerCase();
      filteredJobs = filteredJobs.filter(
        (j) =>
          (j.title || "").toLowerCase().includes(q) ||
          (j.company || "").toLowerCase().includes(q) ||
          (j.location || "").toLowerCase().includes(q)
      );
    }

    // 2. Ambil profil CV pengguna (kosong untuk tamu), lalu bentuk item daftar
    const candidate = await loadCandidateProfile(supabase, user?.id ?? null);
    const formattedJobs = filteredJobs.map((j) => formatJobListItem(j, candidate));

    const headers = new Headers();
    headers.set("Vary", "Cookie");
    if (user) {
      headers.set("Cache-Control", "private, no-store, must-revalidate");
    } else {
      headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    }

    return NextResponse.json(
      {
        jobs: formattedJobs,
        total: formattedJobs.length,
      },
      { headers }
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memuat lowongan" }, { status: 500 });
  }
}

function resolveCanonicalTitle(title: string, explicitCanonical?: string): string {
  if (explicitCanonical && explicitCanonical.trim()) {
    // Jika explicitCanonical BI Analyst tetapi judul jelas Business Analyst, koreksi ke Business Analyst
    if (explicitCanonical.trim() === "BI Analyst" && /\bbusiness analyst\b/i.test(title)) {
      return "Business Analyst";
    }
    return explicitCanonical.trim();
  }
  const lower = title.toLowerCase();
  if (/\b(business analyst|analis bisnis)\b/i.test(lower)) return "Business Analyst";
  if (/\b(bi|business intelligence)\b/i.test(lower)) return "BI Analyst";
  if (/\b(data analyst|analis data|analytics specialist)\b/i.test(lower)) return "Data Analyst";
  if (/\b(data scientist|sains data)\b/i.test(lower)) return "Data Scientist";
  if (/\b(data engineer|rekayasa data)\b/i.test(lower)) return "Data Engineer";
  if (/\b(software engineer|software developer|programmer)\b/i.test(lower)) return "Software Engineer";
  if (/\b(frontend|front-end)\b/i.test(lower)) return "Frontend Developer";
  if (/\b(backend|back-end)\b/i.test(lower)) return "Backend Developer";
  if (/\b(fullstack|full-stack)\b/i.test(lower)) return "Full Stack Developer";
  if (/\b(product manager|manajer produk)\b/i.test(lower)) return "Product Manager";
  if (/\b(ui\/ux|ux designer|ui designer|product designer)\b/i.test(lower)) return "UI/UX Designer";
  if (/\b(cyber|cybersecurity|keamanan siber)\b/i.test(lower)) return "Cyber Security Engineer";
  if (/\b(marketing|pemasaran)\b/i.test(lower)) return "Digital Marketing";
  if (/\b(finance|keuangan|akuntan|accounting)\b/i.test(lower)) return "Finance & Accounting";
  if (/\b(operations|operasional)\b/i.test(lower)) return "Operations Specialist";
  return title.trim();
}

// POST: Admin Import (Tambah manual atau impor CSV lewat pipeline yang sama)
export async function POST(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const body = await req.json();
    const salary = parseAdminSalary(body);
    if (salary.error) return NextResponse.json({ error: salary.error }, { status: 400 });
    const { title, company, location, canonicalTitle, seniority, experienceYearsMin, education, description, requiredSkills, preferredSkills, sourceUrl } = body;

    if (!title || !company || !description) {
      return NextResponse.json({ error: "Judul, nama perusahaan, dan deskripsi wajib diisi." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Cleaning & Hash
    const cleanedDesc = description.replace(/<[^>]*>?/gm, "").trim();
    const payload = `${title.trim().toLowerCase()}|${company.trim().toLowerCase()}|${cleanedDesc}`;
    
    // Simple SHA-256 in web
    const crypto = await import("crypto");
    const contentHash = crypto.createHash("sha256").update(payload).digest("hex");
    const externalId = `admin-${Date.now()}`;

    // 2. Simpan lowongan ke tabel `jobs`
    const { data: insertedJob, error: jobErr } = await supabase
      .from("jobs")
      .insert({
        source_name: "admin_import",
        external_id: externalId,
        source_url: (sourceUrl && typeof sourceUrl === "string") ? sourceUrl.trim() : "",
        title: title.trim(),
        canonical_title: canonicalTitle === null ? null : resolveCanonicalTitle(title, canonicalTitle),
        company: company.trim(),
        location: location || null,
        employment_type: "Full-time",
        seniority: seniority || null,
        experience_years_min: experienceYearsMin == null || experienceYearsMin === "" ? null : Number(experienceYearsMin),
        education: education || null,
        ...salary.data,
        description: cleanedDesc,
        content_hash: contentHash,
        retrieval_method: "admin_import",
        is_active: true,
      })
      .select("id")
      .single();

    if (jobErr || !insertedJob) {
      throw new Error("Gagal menyimpan lowongan: " + jobErr?.message);
    }

    const jobId = insertedJob.id;

    // 3. Hubungkan ke job_skills
    await syncJobSkills(supabase, jobId, requiredSkills, preferredSkills, cleanedDesc);

    // Skor dihitung saat pengguna membuka katalog/detail. Import tidak perlu membaca
    // CV seluruh pengguna atau menyimpan cache skor dengan asumsi pendidikan/pengalaman.
    revalidateJobsCache();

    return NextResponse.json({
      success: true,
      jobId,
      message: `Lowongan '${title}' berhasil disimpan melalui pipeline dan dipublikasikan ke katalog.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memproses import lowongan" }, { status: 500 });
  }
}

// PUT: Admin Edit Lowongan
export async function PUT(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const body = await req.json();
    const salary = parseAdminSalary(body);
    if (salary.error) return NextResponse.json({ error: salary.error }, { status: 400 });
    const { id, title, company, location, canonicalTitle, seniority, experienceYearsMin, education, description, requiredSkills, preferredSkills } = body;

    if (!id || !title || !company) {
      return NextResponse.json({ error: "ID, judul, dan nama perusahaan wajib diisi." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const cleanedDesc = (description || "").replace(/<[^>]*>?/gm, "").trim();

    // 1. Update jobs table
    const { error: updateErr } = await supabase
      .from("jobs")
      .update({
        title: title.trim(),
        company: company.trim(),
        location: location || null,
        canonical_title: canonicalTitle || null,
        seniority: seniority || null,
        experience_years_min: experienceYearsMin == null || experienceYearsMin === "" ? null : Number(experienceYearsMin),
        education: education || null,
        ...salary.data,
        description: cleanedDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) throw new Error(updateErr.message);

    // 2. Hubungkan ulang job_skills jika ada perubahan skills
    if (requiredSkills || preferredSkills) {
      await supabase.from("job_skills").delete().eq("job_id", id);
      await syncJobSkills(supabase, id, requiredSkills, preferredSkills, cleanedDesc);
    }

    revalidateJobsCache();

    return NextResponse.json({
      success: true,
      message: `Lowongan '${title}' berhasil diperbarui.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal memperbarui lowongan" }, { status: 500 });
  }
}

// DELETE: Admin Hapus Lowongan
export async function DELETE(req: NextRequest) {
  try {
    const { admin, error: adminErr, status: adminStatus } = await getAuthenticatedAdmin(req);
    if (!admin || adminErr) {
      return NextResponse.json({ error: adminErr }, { status: adminStatus || 401 });
    }

    const { searchParams } = new URL(req.url);
    let jobId = searchParams.get("id");

    if (!jobId) {
      const body = await req.json().catch(() => ({}));
      jobId = body.id;
    }

    if (!jobId) {
      return NextResponse.json({ error: "ID lowongan wajib disertakan." }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Hapus dari tabel jobs (otomatis cascading ke job_skills, matches, saved_jobs)
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) throw new Error(error.message);

    revalidateJobsCache();

    return NextResponse.json({
      success: true,
      message: "Lowongan berhasil dihapus dari basis data.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Gagal menghapus lowongan" }, { status: 500 });
  }
}

const NEW_SKILL_CATEGORY = "Data & Analytics";
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Simpan relasi skill lowongan beserta kalimat persyaratan asli bila ditemukan di deskripsi. */
async function syncJobSkills(
  supabase: ReturnType<typeof getServiceSupabase>,
  jobId: string,
  requiredSkills: unknown,
  preferredSkills: unknown,
  description: string,
) {
  const toList = (value: unknown) => (Array.isArray(value) ? value : []).filter((s): s is string => typeof s === "string" && s.trim() !== "");
  const items = [
    ...toList(requiredSkills).map((name) => ({ name: name.trim(), isMandatory: true })),
    ...toList(preferredSkills).map((name) => ({ name: name.trim(), isMandatory: false })),
  ];
  const sentences = description.split(/[.\n•;]+/).map((sentence) => sentence.trim());

  for (const item of items) {
    const { data: found } = await supabase.from("skills").select("id").ilike("name", item.name).limit(1);
    let skillId: string | null = found?.[0]?.id ?? null;
    if (!skillId) {
      const { data: inserted } = await supabase.from("skills").insert({ name: item.name, category: NEW_SKILL_CATEGORY }).select("id").single();
      skillId = inserted?.id ?? null;
    }
    if (!skillId) continue;

    const pattern = new RegExp(`\\b${escapeRegExp(item.name)}\\b`, "i");
    const sentence = sentences.find((s) => pattern.test(s));
    await supabase.from("job_skills").upsert({
      job_id: jobId,
      skill_id: skillId,
      is_mandatory: item.isMandatory,
      requirement_snippet: sentence && sentence.length > 5 && sentence.length < 160
        ? sentence
        : `Kualifikasi ${item.isMandatory ? "wajib" : "tambahan"} ${item.name}`,
    }, { onConflict: "job_id,skill_id" });
  }
}
