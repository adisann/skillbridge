import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import {
  buildSystemInstruction,
  isCvRelatedQuery,
  getInstantTemplateAnswer,
  PROMPT_VERSION,
} from "@/lib/ai/prompts";
import { streamAIWithFallback } from "@/lib/ai/provider";
import { enforceRateLimits, getClientIp } from "@/lib/rate-limit";
import { chatBurstRules, chatQuotaRules } from "@/lib/rate-limit-policies";
import {
  getJobKnowledgeCache,
  setJobKnowledgeCache,
  getCvAnalysisCache,
  setCvAnalysisCache,
} from "@/lib/ai/cache";
import { ActiveJobContext, CandidateCVContext, ChatMessage } from "@/lib/ai/types";
import { calculateJobMatch, getDisplayScore } from "@/lib/matching";
import { loadCandidateProfile, toMatchCandidate } from "@/lib/candidate-profile";
import { toMatchJob } from "@/lib/job-skills";

const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY_MESSAGES = 6;

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
    const ip = getClientIp(req);

    // 1. Rate limiting awal per IP (sebelum membaca body dan menyentuh database)
    const burstLimited = await enforceRateLimits(chatBurstRules(ip));
    if (burstLimited) return burstLimited;

    const body = await req.json();
    const { message, history: rawHistory = [] } = body as {
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

    // Kuota per pengguna (atau per IP untuk tamu) dan batas global harian
    const quotaLimited = await enforceRateLimits(chatQuotaRules(ip, user?.id ?? null));
    if (quotaLimited) return quotaLimited;

    const trimmedMessage = message.trim().slice(0, MAX_MESSAGE_CHARS);
    const history = rawHistory
      .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

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

    const matchJob = toMatchJob(job);
    const { requiredSkills: reqSkills, preferredSkills: prefSkills } = matchJob;

    const jobContext: ActiveJobContext = {
      id: job.id,
      title: job.title,
      canonicalTitle: job.canonical_title,
      company: job.company,
      location: job.location,
      employmentType: job.employment_type || "Full-time",
      seniority: job.seniority || "Tidak dirinci",
      experienceYearsMin: matchJob.experienceYearsMin,
      education: job.education,
      minGpa: job.min_gpa ?? null,
      salaryMin: job.salary_min ?? null,
      salaryMax: job.salary_max ?? null,
      salaryPeriod: job.salary_period ?? null,
      description: job.description,
      contentHash: `${PROMPT_VERSION}:${job.content_hash || "default_hash"}`,
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

      const candidate = await loadCandidateProfile(supabase, user.id);
      const activeResume = candidate.activeResume;

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

      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const liveMatch = calculateJobMatch(toMatchCandidate(candidate), matchJob);

      candidateCv = {
        userId: user.id,
        resumeId: String(activeResume.id),
        fullName: profile?.full_name || "Pelamar",
        targetRole: candidate.targetRole,
        experienceYears: candidate.years,
        education: candidate.education,
        gpa: candidate.gpa,
        skills: candidate.skills.filter((s) => !candidate.claimedSkills.includes(s) && !candidate.reviewSkills.includes(s)),
        claimedSkills: candidate.claimedSkills, reviewSkills: candidate.reviewSkills,
        matchScore: getDisplayScore(liveMatch) ?? undefined,
        matchStatus: liveMatch.matchStatus,
        matchedSkills: liveMatch.matchedSkills,
        missingSkills: liveMatch.missingSkills,
        updatedAt: String(activeResume.updated_at || ""),
      };

      // 4A. Check CV Analysis Cache
      const cachedCvResponse = history.length === 0 ? await getCvAnalysisCache(
        user.id,
        String(activeResume.id),
        job.id,
        `${jobContext.contentHash}:${activeResume.id}:${activeResume.updated_at}:${candidate.targetRole}`,
        trimmedMessage
      ) : null;

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
      const cachedJobResponse = history.length === 0 ? await getJobKnowledgeCache(
        job.id,
        jobContext.contentHash,
        trimmedMessage
      ) : null;

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
    // Pertanyaan umum tidak memuat CV (undefined); null berarti akun memang belum punya CV aktif.
    const systemInstruction = buildSystemInstruction(jobContext, needsCv ? candidateCv : undefined);

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
            fullText && history.length === 0 &&
            !fullText.includes("sedang tidak tersedia atau mengalami gangguan") &&
            !req.signal.aborted
          ) {
            try {
              if (candidateCv) {
                await setCvAnalysisCache(
                  candidateCv.userId,
                  candidateCv.resumeId,
                  job.id,
                  `${jobContext.contentHash}:${candidateCv.resumeId}:${candidateCv.updatedAt}:${candidateCv.targetRole}`,
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
