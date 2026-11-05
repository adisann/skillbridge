/**
 * LlamaParse Integration for SkillBridge
 * Official LlamaCloud Document & Flyer Parsing Service (v2 REST API)
 * Free Tier provides 10,000 credits/pages per month.
 */

interface LlamaParseOptions {
  tier?: "fast" | "cost_effective" | "agentic";
  version?: string;
  maxTimeoutMs?: number;
}

interface LlamaParseV2UploadResponse {
  id: string;
  status?: string;
  error?: string;
  message?: string;
}

interface LlamaParseV2JobResponse {
  job?: {
    id: string;
    status: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
    markdown?: {
      pages?: Array<{
        page: number;
        markdown: string;
      }>;
    };
    error_message?: string;
  };
  status?: string;
  error?: string;
}

/**
 * Parses an image or PDF buffer using LlamaParse v2 REST API.
 * Returns the extracted Markdown text from the document.
 */
export async function parseDocumentWithLlamaParse(
  buffer: Buffer,
  mimeType: string,
  filename: string = "job-flyer.jpg",
  options: LlamaParseOptions = {}
): Promise<string> {
  const apiKey = process.env.LLAMA_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("LLAMA_CLOUD_API_KEY belum dikonfigurasi.");
  }

  const tier = options.tier || "cost_effective";
  const version = options.version || "latest";
  const maxTimeoutMs = options.maxTimeoutMs || 25000;

  // Siapkan multipart/form-data
  const formData = new FormData();
  const fileBlob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  formData.append("file", fileBlob, filename);
  formData.append("tier", tier);
  formData.append("version", version);

  console.info(`[LlamaParse] Mengunggah "${filename}" (${buffer.length} bytes) ke LlamaParse v2...`);

  // Step 1: Upload dokumen & inisiasi parse job
  let uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/v2/parse/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  // Fallback ke v1 jika v2 mengembalikan 404/405
  if (!uploadRes.ok && uploadRes.status === 404) {
    console.warn("[LlamaParse] Endpoint v2 tidak merespons, mencoba endpoint v1...");
    const v1FormData = new FormData();
    v1FormData.append("file", fileBlob, filename);
    uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: v1FormData,
    });
  }

  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "");
    throw new Error(`LlamaParse upload gagal HTTP ${uploadRes.status}: ${errText.slice(0, 300)}`);
  }

  const uploadData: LlamaParseV2UploadResponse = await uploadRes.json();
  const jobId = uploadData.id;
  if (!jobId) {
    throw new Error("LlamaParse tidak mengembalikan Job ID yang valid.");
  }

  console.info(`[LlamaParse] Job berhasil dibuat: ${jobId}. Menunggu hasil parsing (polling)...`);

  // Step 2: Polling status pekerjaan
  const startTime = Date.now();
  const pollIntervalMs = 1500;

  while (Date.now() - startTime < maxTimeoutMs) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));

    // Coba ambil status v2 dengan expand=markdown
    const statusRes = await fetch(
      `https://api.cloud.llamaindex.ai/api/v2/parse/${jobId}?expand=markdown`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (statusRes.ok) {
      const statusData: LlamaParseV2JobResponse = await statusRes.json();
      const job = statusData.job;

      if (job?.status === "SUCCESS") {
        const pages = job.markdown?.pages || [];
        const fullMarkdown = pages.map((p) => p.markdown).join("\n\n---\n\n").trim();
        if (fullMarkdown) {
          console.info(`[LlamaParse] Berhasil mengekstrak ${pages.length} halaman markdown (${fullMarkdown.length} chars).`);
          return fullMarkdown;
        }
      } else if (job?.status === "ERROR") {
        throw new Error(`LlamaParse job error: ${job.error_message || "Gagal memproses dokumen"}`);
      }
    } else if (statusRes.status === 404) {
      // Fallback v1 check
      const v1StatusRes = await fetch(
        `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      if (v1StatusRes.ok) {
        const v1Data = await v1StatusRes.json();
        if (v1Data.status === "SUCCESS") {
          const v1MarkdownRes = await fetch(
            `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            }
          );
          if (v1MarkdownRes.ok) {
            const mdData = await v1MarkdownRes.json();
            const mdText = mdData.markdown || mdData.text || "";
            if (mdText) return mdText;
          }
        }
      }
    }
  }

  throw new Error(`LlamaParse timeout setelah ${Math.round(maxTimeoutMs / 1000)} detik.`);
}
