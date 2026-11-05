import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  buildSystemInstruction,
  isCvRelatedQuery,
  getInstantTemplateAnswer,
} from "@/lib/ai/prompts";
import { streamAIWithFallback, checkRateLimit } from "@/lib/ai/provider";
import {
  getJobKnowledgeCache,
  setJobKnowledgeCache,
  getCvAnalysisCache,
  setCvAnalysisCache,
} from "@/lib/ai/cache";
import { ActiveJobContext, CandidateCVContext, ChatMessage } from "@/lib/ai/types";
import { calculateJobMatch } from "@/lib/matching";

// Helper to return instant SSE response (for cache hits, auth notices, rule engine)
function createInstantStreamResponse(
  message: string,
  provider: string,
  hasCvContext: boolean,
  sources: string[],
  cached = false,
  cacheType?: string
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            meta: {
              provider,
              hasCvContext,
              sources,
              cached,
              cacheType,
            },
          })}\n\n`
        )
      );
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ delta: message })}\n\n`)
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ done: true, fullText: message })}\n\n`
        )
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await context.params;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";

    // 1. Rate Limiting Check
    if (!checkRateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        {
          error: "Terlalu banyak permintaan dalam waktu singkat. Mohon tunggu beberapa saat sebelum bertanya kembali.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, history = [] } = body as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan pertanyaan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const { user, supabase } = await getAuthenticatedUser(req);
    const trimmedMessage = message.trim().slice(0, 500); // Guardrail: Max 500 characters

    // 2. Fetch Active Job Details from Supabase
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, job_skills(is_mandatory, skills(name))")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: "Lowongan pekerjaan tidak ditemukan pada basis data." },
        { status: 404 }
      );
    }

    const reqSkills: string[] = [];
    const prefSkills: string[] = [];
    if (job.job_skills) {
      for (const js of job.job_skills as unknown as Array<{
        is_mandatory: boolean;
        skills: { name: string };
      }>) {
        if (js.skills?.name) {
          if (js.is_mandatory) reqSkills.push(js.skills.name);
          else prefSkills.push(js.skills.name);
        }
      }
    }

    const jobContext: ActiveJobContext = {
      id: job.id,
      title: job.title,
      canonicalTitle: job.canonical_title,
      company: job.company,
      location: job.location,
      employmentType: job.employment_type || "Full-time",
      seniority: job.seniority || "Tidak dirinci",
      experienceYearsMin: job.experience_years_min,
      education: job.education,
      description: job.description,
      contentHash: job.content_hash || "default_hash",
      sourceName: job.source_name,
      sourceUrl: job.source_url,
      retrievalMethod: job.retrieval_method,
      retrievedAt: new Date(job.retrieved_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      requiredSkills: reqSkills,
      preferredSkills: prefSkills,
    };

    // 3. Fast FAQ & Action Template Engine (0ms latency, zero token cost)
    const instantTemplate = getInstantTemplateAnswer(trimmedMessage, jobContext);
    if (instantTemplate) {
      return createInstantStreamResponse(
        instantTemplate,
        "SkillBridge Rule Engine (Instan)",
        false,
        ["Panduan Platform SkillBridge"],
        true,
        "faq_template"
      );
    }

    // 4. Determine if Query requires CV Analysis
    const needsCv = isCvRelatedQuery(trimmedMessage);
    let candidateCv: CandidateCVContext | null = null;

    if (needsCv) {
      if (!user) {
        return createInstantStreamResponse(
          "Silakan login terlebih dahulu untuk mengakses analisis kecocokan CV-mu terhadap lowongan ini. Kamu dapat masuk instan menggunakan **Akun Demo** di halaman Login.",
          "SkillBridge Rule Engine (Instan)",
          false,
          ["Status Autentikasi Pengguna"],
          true,
          "cv_analysis"
        );
      }

      const { data: resumeRows } = await supabase
        .from("resumes")
        .select("id, user_id, experience_years, education, updated_at, resume_skills(skills(name))")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      const activeResume = resumeRows && resumeRows.length > 0 ? resumeRows[0] : null;

      if (!activeResume) {
        return createInstantStreamResponse(
          "Dokumen CV-mu belum terdeteksi aktif pada akun ini di SkillBridge.\n\n" +
            "Untuk mengevaluasi kecocokan kualifikasi dan kesenjangan kompetensi untuk posisi ini, silakan unggah CV-mu terlebih dahulu melalui menu **[Upload / Review CV](/cv)**.",
          "SkillBridge Rule Engine (Instan)",
          false,
          ["Status Profil Akun Pengguna"],
          true,
          "cv_analysis"
        );
      }

      const candidateSkills: string[] = [];
      if (activeResume.resume_skills) {
        for (const rs of activeResume.resume_skills as unknown as Array<{
          skills: { name: string };
        }>) {
          if (rs.skills?.name) candidateSkills.push(rs.skills.name);
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, target_role")
        .eq("id", user.id)
        .maybeSingle();

      const liveMatch = calculateJobMatch(
        candidateSkills,
        Number(activeResume.experience_years) || 0,
        activeResume.education || "Sarjana (S1)",
        {
          title: job.title,
          canonicalTitle: job.canonical_title,
          requiredSkills: reqSkills,
          preferredSkills: prefSkills,
          experienceYearsMin: job.experience_years_min || null,
          education: job.education || null,
          seniority: job.seniority || null,
        }
      );

      candidateCv = {
        userId: user.id,
        resumeId: activeResume.id,
        fullName: profile?.full_name || "Pelamar",
        targetRole: profile?.target_role || job.canonical_title,
        experienceYears: Number(activeResume.experience_years) || 0,
        education: activeResume.education || "Sarjana (S1)",
        skills: candidateSkills,
        matchScore: liveMatch.score,
        matchStatus: liveMatch.matchStatus,
        matchedSkills: liveMatch.matchedSkills,
        missingSkills: liveMatch.missingSkills,
        updatedAt: activeResume.updated_at,
      };

      // 4A. Check CV Analysis Cache
      const cachedCvResponse = await getCvAnalysisCache(
        user.id,
        activeResume.id,
        job.id,
        jobContext.contentHash,
        trimmedMessage
      );

      if (cachedCvResponse) {
        return createInstantStreamResponse(
          cachedCvResponse.text,
          cachedCvResponse.provider,
          true,
          ["Deskripsi Lowongan", "Kualifikasi CV Pelamar", "Cache Hasil Analisis"],
          true,
          "cv_analysis"
        );
      }
    } else {
      // 4B. Check Job Knowledge Cache (Public across users)
      const cachedJobResponse = await getJobKnowledgeCache(
        job.id,
        jobContext.contentHash,
        trimmedMessage
      );

      if (cachedJobResponse) {
        return createInstantStreamResponse(
          cachedJobResponse.text,
          cachedJobResponse.provider,
          false,
          ["Deskripsi Lowongan", "Cache Pengetahuan Lowongan"],
          true,
          "job_knowledge"
        );
      }
    }

    // 5. Build Scoped Prompt & Instructions
    const systemInstruction = buildSystemInstruction(jobContext, candidateCv);

    // 6. Live Token Streaming via Gemini / Groq with Fallback
    const encoder = new TextEncoder();
    const sources = candidateCv
      ? ["Deskripsi Lowongan Resmi", "Kualifikasi CV Pelamar"]
      : ["Deskripsi Lowongan Resmi"];

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              meta: {
                hasCvContext: !!candidateCv,
                sources,
                cached: false,
              },
            })}\n\n`
          )
        );

        let fullText = "";
        let finalProvider = "Google Gemini 2.5 Flash";

        try {
          for await (const chunk of streamAIWithFallback(
            systemInstruction,
            trimmedMessage,
            history,
            req.signal
          )) {
            if (req.signal.aborted) {
              break;
            }

            if (chunk.provider) {
              finalProvider = chunk.provider;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ provider: chunk.provider })}\n\n`)
              );
            }

            if (chunk.delta) {
              fullText += chunk.delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: chunk.delta })}\n\n`)
              );
            }

            if (chunk.error) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: chunk.error })}\n\n`)
              );
            }
          }

          // 7. Store Safe Results into Cache if response is valid
          if (
            fullText &&
            !fullText.includes("sedang tidak tersedia atau mengalami gangguan") &&
            !req.signal.aborted
          ) {
            try {
              if (candidateCv) {
                await setCvAnalysisCache(
                  candidateCv.userId,
                  candidateCv.resumeId,
                  job.id,
                  jobContext.contentHash,
                  trimmedMessage,
                  fullText,
                  finalProvider
                );
              } else {
                await setJobKnowledgeCache(
                  job.id,
                  jobContext.contentHash,
                  trimmedMessage,
                  fullText,
                  finalProvider
                );
              }
            } catch (cacheErr) {
              console.warn("[Chat Cache Write Warning]:", cacheErr);
            }
          }

          // Send terminal done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, fullText, provider: finalProvider })}\n\n`
            )
          );
        } catch (streamErr: unknown) {
          const errObj = streamErr as Error;
          console.error("[Stream API Error]:", errObj);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Terjadi gangguan saat streaming jawaban: " + (errObj.message || "Unknown error"),
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
      cancel() {
        // Handle client abort / disconnect
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Chat API Error]:", err);
    return NextResponse.json(
      {
        error: "Terjadi kendala saat memproses jawaban asisten AI: " + (err.message || "Kesalahan server"),
      },
      { status: 500 }
    );
  }
}
