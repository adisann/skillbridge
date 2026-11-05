import type { ChatMessage } from "./types";

export interface AIProviderResult {
  text: string;
  provider: string;
  isFallback: boolean;
}

export interface StreamChunk {
  delta?: string;
  provider?: string;
  isFallback?: boolean;
  done?: boolean;
  error?: string;
}

// In-memory rate limiter: max 30 requests per minute per identifier
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(clientId: string, maxRequests = 30, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

// Helper to parse SSE stream lines across any chunk boundaries
async function* readSSEStream(
  response: Response,
  extractor: (json: unknown) => string | undefined,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const text = extractor(parsed);
          if (text) yield text;
        } catch {
          // ignore partial JSON chunk until more data arrives
        }
      }
    }

    if (buffer.trim().startsWith("data:")) {
      const jsonStr = buffer.trim().slice(5).trim();
      if (jsonStr && jsonStr !== "[DONE]") {
        try {
          const parsed = JSON.parse(jsonStr);
          const text = extractor(parsed);
          if (text) yield text;
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ==============================================================================
// 1. Google Gemini Streaming & Non-Streaming
// ==============================================================================

function buildGeminiPayload(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = []
) {
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of history.slice(-6)) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: userPrompt }],
  });

  return {
    contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2500,
      topP: 0.95,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };
}

async function* streamGemini(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  signal?: AbortSignal,
  timeoutMs = 12000
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY tidak dikonfigurasi.");
  }

  const model = process.env.AI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const payload = buildGeminiPayload(systemInstruction, userPrompt, history);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Gemini Stream HTTP ${res.status}: ${res.statusText} - ${errText}`);
    }

    yield* readSSEStream(
      res,
      (data: unknown) => {
        const item = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        return item?.candidates?.[0]?.content?.parts?.[0]?.text;
      },
      signal
    );
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  timeoutMs = 9000
): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY tidak dikonfigurasi pada server.");
  }

  const model = process.env.AI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const payload = buildGeminiPayload(systemInstruction, userPrompt, history);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${res.statusText} - ${errBody}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Respon Gemini tidak memuat teks kandidat.");
    }

    return candidateText;
  } finally {
    clearTimeout(timer);
  }
}

// ==============================================================================
// 2. Groq Fallback Streaming & Non-Streaming
// ==============================================================================

function buildGroqPayload(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  stream = false
) {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemInstruction },
  ];

  for (const msg of history.slice(-6)) {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userPrompt });

  return {
    model,
    messages,
    temperature: 0.2,
    max_tokens: 2048,
    stream,
  };
}

async function* streamGroq(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  signal?: AbortSignal,
  timeoutMs = 12000
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY tidak dikonfigurasi.");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = buildGroqPayload(systemInstruction, userPrompt, history, true);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Groq Stream HTTP ${res.status}: ${res.statusText} - ${errBody}`);
    }

    yield* readSSEStream(
      res,
      (data: unknown) => {
        const item = data as { choices?: Array<{ delta?: { content?: string } }> };
        return item?.choices?.[0]?.delta?.content;
      },
      signal
    );
  } finally {
    clearTimeout(timer);
  }
}

async function callGroq(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  timeoutMs = 9000
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY tidak dikonfigurasi.");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const payload = buildGroqPayload(systemInstruction, userPrompt, history, false);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Groq HTTP ${res.status}: ${res.statusText} - ${errBody}`);
    }

    const data = await res.json();
    const messageContent = data?.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error("Respon Groq tidak memuat konten.");
    }

    return messageContent;
  } finally {
    clearTimeout(timer);
  }
}

// ==============================================================================
// 3. Unified Stream with Resilient Fallback (Gemini -> Groq -> Offline Notice)
// ==============================================================================

export async function* streamAIWithFallback(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = [],
  signal?: AbortSignal
): AsyncGenerator<StreamChunk, void, unknown> {
  let hasEmittedFirstToken = false;

  // Step 1: Try Primary Provider (Google Gemini)
  try {
    yield { provider: "Google Gemini", isFallback: false };

    for await (const token of streamGemini(systemInstruction, userPrompt, history, signal)) {
      hasEmittedFirstToken = true;
      yield { delta: token };
    }

    yield { done: true };
    return;
  } catch (primaryErr: unknown) {
    const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn("[AI Stream Provider] Primary provider (Gemini) failed:", errMsg);

    // If stream already started emitting tokens, do not corrupt response mid-sentence
    if (hasEmittedFirstToken) {
      yield { error: "Koneksi terputus saat streaming respons. Silakan coba kembali." };
      return;
    }
  }

  // Step 2: Attempt Fallback to Groq if key is present
  if (process.env.GROQ_API_KEY) {
    try {
      console.info("[AI Stream Provider] Executing fallback streaming via Groq...");
      yield { provider: "Groq", isFallback: true };

      for await (const token of streamGroq(systemInstruction, userPrompt, history, signal)) {
        hasEmittedFirstToken = true;
        yield { delta: token };
      }

      yield { done: true };
      return;
    } catch (fallbackErr: unknown) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error("[AI Stream Provider] Fallback provider (Groq) also failed:", fallbackMsg);

      if (hasEmittedFirstToken) {
        yield { error: "Koneksi terputus saat streaming respons. Silakan coba kembali." };
        return;
      }
    }
  }

  // Step 3: Graceful offline message
  yield { provider: "Layanan Offline", isFallback: true };
  yield {
    delta:
      "Maaf, asisten AI sedang tidak tersedia atau mengalami gangguan sementara. Silakan coba kembali beberapa saat lagi.",
  };
  yield { done: true };
}

// ==============================================================================
// 4. Non-Streaming Fallback (Retained for Backwards Compatibility)
// ==============================================================================

export async function callAIWithFallback(
  systemInstruction: string,
  userPrompt: string,
  history: ChatMessage[] = []
): Promise<AIProviderResult> {
  // Step 1: Try Primary Provider (Google Gemini)
  try {
    const text = await callGemini(systemInstruction, userPrompt, history);
    return {
      text,
      provider: "Google Gemini",
      isFallback: false,
    };
  } catch (primaryErr: unknown) {
    const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    console.warn("[AI Provider] Primary provider (Gemini) encountered an error:", errMsg);

    // Step 2: Attempt Fallback to Groq if key is present
    if (process.env.GROQ_API_KEY) {
      try {
        console.info("[AI Provider] Executing fallback to Groq...");
        const text = await callGroq(systemInstruction, userPrompt, history);
        return {
          text,
          provider: "Groq",
          isFallback: true,
        };
      } catch (fallbackErr: unknown) {
        const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        console.error("[AI Provider] Fallback provider (Groq) also failed:", fallbackMsg);
      }
    }

    // Step 3: Graceful failure message as required by guidelines
    return {
      text: "Maaf, asisten AI sedang tidak tersedia atau mengalami gangguan sementara. Silakan coba kembali beberapa saat lagi.",
      provider: "Offline",
      isFallback: true,
    };
  }
}
