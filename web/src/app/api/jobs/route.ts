import { jobExperienceYears } from "@/lib/job-experience";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getAuthenticatedAdmin, getServiceSupabase } from "@/lib/supabase/server";
import { calculateJobMatch, getDisplayScore } from "@/lib/matching";
import { getCachedPublicJobs, revalidateJobsCache } from "@/lib/public-jobs";
import { getCategoryFromTitle, getCategoryBySlug } from "@/lib/job-categories";
import { loadCandidateProfile } from "@/lib/candidate-profile";
import { parseAdminSalary } from "@/lib/admin-salary";
import { splitJobSkills } from "@/lib/job-skills";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("bidang") || searchParams.get("role");
    const query = searchParams.get("q");

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

    // 2. Ambil resume aktif pengguna jika pengguna terautentikasi
    const {
      activeResume,
      skills: candidateSkills,
      years: candidateYears,
      education: candidateEdu,
      gpa: candidateGpa,
      targetRole, claimedSkills, reviewSkills, evidence,
    } = await loadCandidateProfile(supabase, user?.id ?? null);

    // Format lowongan dengan perhitungan hybrid matching
    const formattedJobs = filteredJobs.map((j) => {
      const { required: reqSkills, preferred: prefSkills } = splitJobSkills(j.job_skills);

      // Hitung atau ambil data matching
      let matchScore: number | null = null;
      let matchStatus = "match";
      let matchedSkills: string[] = [];
      let missingSkills: string[] = [];
      let unprovenSkills: string[] = [];
      let factorsSupporting: string[] = [];
      let factorsLimiting: string[] = [];
      let scoreBreakdown: unknown[] = [];
      let requirementsEvaluation: unknown[] = [];

      // Jika ada resume aktif, hitung secara dinamis
      if (activeResume) {
        const liveMatch = calculateJobMatch(
          { skills: candidateSkills, experienceYears: candidateYears, education: candidateEdu, gpa: candidateGpa, targetRole, claimedSkills, reviewSkills, evidence },
          {
            title: j.title,
            canonicalTitle:
          j.canonical_title === "BI Analyst" && /\bbusiness analyst\b/i.test(j.title)
            ? "Business Analyst"
            : j.canonical_title,
            requiredSkills: reqSkills,
            preferredSkills: prefSkills,
            experienceYearsMin: jobExperienceYears(j.experience_years_min, j.description),
            education: j.education || null,
            minGpa: j.min_gpa ?? null,
            seniority: j.seniority || null,
          }
        );

        matchScore = getDisplayScore(liveMatch);
        matchStatus = liveMatch.matchStatus;
        matchedSkills = liveMatch.matchedSkills;
        missingSkills = liveMatch.missingSkills;
        unprovenSkills = liveMatch.unprovenSkills;
        factorsSupporting = liveMatch.factorsSupporting;
        factorsLimiting = liveMatch.factorsLimiting;
        scoreBreakdown = liveMatch.breakdown;
        requirementsEvaluation = liveMatch.requirementsEvaluation;
      } else {
        matchScore = null;
        matchStatus = "insufficient_evidence";
        factorsLimiting = ["CV belum terunggah. Unggah CV untuk mengevaluasi kecocokan kualifikasi."];
        factorsSupporting = ["Data lowongan resmi aktif."];
        scoreBreakdown = [];
        requirementsEvaluation = [];
      }

      const jobCategory = getCategoryFromTitle(j.title, j.canonical_title);

      return {
        id: j.id,
        externalId: j.external_id,
        title: j.title,
        canonicalTitle:
          j.canonical_title === "BI Analyst" && /\bbusiness analyst\b/i.test(j.title)
            ? "Business Analyst"
            : j.canonical_title,
        category: jobCategory.slug,
        categoryLabel: jobCategory.label,
        company: j.company,
        location: j.location,
        employmentType: j.employment_type,
        seniority: j.seniority || "Mid",
        experienceYearsMin: jobExperienceYears(j.experience_years_min, j.description),
        education: j.education || "Bachelor",
        salaryMin: j.salary_min ?? null,
        salaryMax: j.salary_max ?? null,
        salaryCurrency: j.salary_currency ?? null,
        salaryPeriod: j.salary_period ?? null,
        minGpa: j.min_gpa ?? null,
        description: j.description,
        sourceName: j.source_name,
        sourceUrl: j.source_url,
        retrievalMethod: j.retrieval_method,
        retrievedAt: j.retrieved_at,
        expiresAt: j.expires_at || null,
        deadline: j.expires_at || null,
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        matchScore,
        matchStatus,
        matchedSkills,
        missingSkills,
        unprovenSkills,
        factorsSupporting,
        factorsLimiting,
        scoreBreakdown,
        requirementsEvaluation,
      };
    });

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
    const allSkills = [
      ...(requiredSkills || []).map((s: string) => ({ name: s, is_mandatory: true })),
      ...(preferredSkills || []).map((s: string) => ({ name: s, is_mandatory: false })),
    ];

    for (const item of allSkills) {
      const sName = item.name.trim();
      let skillId: string | null = null;
      const { data: found } = await supabase.from("skills").select("id").ilike("name", sName).limit(1);
      if (found && found.length > 0) {
        skillId = found[0].id;
      } else {
        const { data: ins } = await supabase.from("skills").insert({ name: sName, category: "Data & Analytics" }).select("id").single();
        if (ins) skillId = ins.id;
      }

      if (skillId) {
        // Cari kalimat asli di deskripsi yang memuat nama skill untuk requirement_snippet kontekstual
        let snippet = `Kualifikasi ${item.is_mandatory ? 'wajib' : 'tambahan'} ${sName}`;
        if (cleanedDesc) {
          const sentences = cleanedDesc.split(/[.\n•;]+/).map((s: string) => s.trim());
          const matchSentence = sentences.find((s: string) =>
            new RegExp(`\\b${sName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s)
          );
          if (matchSentence && matchSentence.length > 5 && matchSentence.length < 160) {
            snippet = matchSentence;
          }
        }

        await supabase.from("job_skills").upsert({
          job_id: jobId,
          skill_id: skillId,
          is_mandatory: item.is_mandatory,
          requirement_snippet: snippet,
        }, { onConflict: "job_id,skill_id" });
      }
    }

    // 4. Update matches dengan resume aktif yang ada
    const { data: resumes } = await supabase.from("resumes").select("id, user_id, education, experience_years, resume_skills(skills(name))").eq("is_active", true);
    if (resumes) {
      for (const r of resumes) {
        const candidateSkills = (r.resume_skills as unknown as Array<{ skills: { name: string } }>)?.map((s) => s.skills?.name).filter(Boolean) || [];
        const matchRes = calculateJobMatch(
          candidateSkills,
          r.experience_years || 0,
          r.education || "S1",
          {
            title,
            requiredSkills: requiredSkills || [],
            preferredSkills: preferredSkills || [],
            experienceYearsMin: experienceYearsMin == null || experienceYearsMin === "" ? null : Number(experienceYearsMin),
            education: education || null,
            seniority: seniority || null,
          }
        );

        await supabase.from("matches").upsert({
          user_id: r.user_id,
          resume_id: r.id,
          job_id: jobId,
          match_status: matchRes.matchStatus,
          score: matchRes.score,
          score_breakdown: matchRes.breakdown,
          factors_supporting: matchRes.factorsSupporting,
          factors_limiting: matchRes.factorsLimiting,
        }, { onConflict: "resume_id,job_id" });
      }
    }

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

      const allSkills = [
        ...(requiredSkills || []).map((s: string) => ({ name: s, is_mandatory: true })),
        ...(preferredSkills || []).map((s: string) => ({ name: s, is_mandatory: false })),
      ];

      for (const item of allSkills) {
        const sName = item.name.trim();
        let skillId: string | null = null;
        const { data: found } = await supabase.from("skills").select("id").ilike("name", sName).limit(1);
        if (found && found.length > 0) {
          skillId = found[0].id;
        } else {
          const { data: ins } = await supabase.from("skills").insert({ name: sName, category: "Data & Analytics" }).select("id").single();
          if (ins) skillId = ins.id;
        }

        if (skillId) {
          await supabase.from("job_skills").upsert({
            job_id: id,
            skill_id: skillId,
            is_mandatory: item.is_mandatory,
            requirement_snippet: `Kualifikasi ${item.is_mandatory ? 'wajib' : 'tambahan'} ${sName}`,
          }, { onConflict: "job_id,skill_id" });
        }
      }

      // 3. Update matches dengan resume aktif yang ada
      const { data: resumes } = await supabase.from("resumes").select("id, user_id, education, experience_years, resume_skills(skills(name))").eq("is_active", true);
      if (resumes) {
        for (const r of resumes) {
          const candidateSkills = (r.resume_skills as unknown as Array<{ skills: { name: string } }>)?.map((s) => s.skills?.name).filter(Boolean) || [];
          const matchRes = calculateJobMatch(
            candidateSkills,
            r.experience_years || 0,
            r.education || "S1",
            {
              title,
              canonicalTitle: canonicalTitle || (title.toLowerCase().includes("bi") ? "BI Analyst" : "Data Analyst"),
              requiredSkills: requiredSkills || [],
              preferredSkills: preferredSkills || [],
              experienceYearsMin: experienceYearsMin == null || experienceYearsMin === "" ? null : Number(experienceYearsMin),
              education: education || null,
              seniority: seniority || null,
            }
          );

          await supabase.from("matches").upsert({
            user_id: r.user_id,
            resume_id: r.id,
            job_id: id,
            match_status: matchRes.matchStatus,
            score: matchRes.score,
            score_breakdown: matchRes.breakdown,
            factors_supporting: matchRes.factorsSupporting,
            factors_limiting: matchRes.factorsLimiting,
          }, { onConflict: "resume_id,job_id" });
        }
      }
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
