"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Send,
  RotateCcw,
  Bot,
  User,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
  Square,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  provider?: string;
  cached?: boolean;
  hasCvContext?: boolean;
  sources?: string[];
  timestamp: string;
  isStreaming?: boolean;
}

interface JobChatAssistantProps {
  jobId: string;
  jobTitle: string;
  company: string;
  userId?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const QUICK_QUESTIONS = [
  "Apa keterampilan utama yang dibutuhkan?",
  "Apa tanggung jawab posisi ini?",
  "Apakah CV saya sesuai dengan lowongan ini?",
  "Keterampilan apa yang perlu saya tingkatkan?",
  "Apakah pengalaman kerja wajib untuk posisi ini?",
];

let messageCounter = 0;
function createMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatCurrentTime(): string {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function JobChatAssistant({
  jobId,
  jobTitle,
  company,
  userId,
  isOpen: controlledIsOpen,
  onOpenChange,
}: JobChatAssistantProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (nextOpen: boolean) => {
      if (onOpenChange) {
        onOpenChange(nextOpen);
      }
      setInternalIsOpen(nextOpen);
    },
    [onOpenChange]
  );

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isNearBottomRef = useRef(true);
  const streamStateRef = useRef({
    content: "",
    provider: "Google Gemini",
    sources: [] as string[],
    hasCv: false,
  });

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Smart scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  const scrollToBottomIfNear = useCallback((force = false, behavior: ScrollBehavior = "smooth") => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming || isAnalyzing) return;

    setErrorMessage(null);
    setInputValue("");
    isNearBottomRef.current = true;

    const userMessageItem: ChatMessageItem = {
      id: createMessageId("user"),
      role: "user",
      content: text,
      timestamp: formatCurrentTime(),
    };

    const assistantMsgId = createMessageId("assistant");

    setMessages((prev) => [...prev, userMessageItem]);
    setIsAnalyzing(true);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setTimeout(() => scrollToBottomIfNear(true, "smooth"), 50);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`/api/jobs/${jobId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          userId: userId || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error("Koneksi tidak mendukung streaming.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      streamStateRef.current = {
        content: "",
        provider: "Google Gemini",
        sources: [],
        hasCv: false,
      };

      while (true) {
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
            const data = JSON.parse(jsonStr);

            if (data.meta) {
              if (data.meta.provider) streamStateRef.current.provider = data.meta.provider;
              if (data.meta.sources) streamStateRef.current.sources = data.meta.sources;
              if (data.meta.hasCvContext !== undefined) streamStateRef.current.hasCv = data.meta.hasCvContext;
            }

            if (data.provider) {
              streamStateRef.current.provider = data.provider;
            }

            if (data.delta) {
              // First token received! Switch from "Menganalisis..." to live streaming bubble
              setIsAnalyzing(false);
              streamStateRef.current.content += data.delta;
              const currentContent = streamStateRef.current.content;
              const currentProvider = streamStateRef.current.provider;
              const currentSources = streamStateRef.current.sources;
              const currentHasCv = streamStateRef.current.hasCv;

              setMessages((prev) => {
                const existingIdx = prev.findIndex((m) => m.id === assistantMsgId);
                if (existingIdx !== -1) {
                  return prev.map((m, idx) =>
                    idx === existingIdx
                      ? {
                          ...m,
                          content: currentContent,
                          provider: currentProvider,
                          sources: currentSources,
                          hasCvContext: currentHasCv,
                          isStreaming: true,
                        }
                      : m
                  );
                } else {
                  return [
                    ...prev,
                    {
                      id: assistantMsgId,
                      role: "assistant",
                      content: currentContent,
                      provider: currentProvider,
                      sources: currentSources,
                      hasCvContext: currentHasCv,
                      timestamp: formatCurrentTime(),
                      isStreaming: true,
                    },
                  ];
                }
              });

              scrollToBottomIfNear(false, "auto");
            }

            if (data.error) {
              throw new Error(data.error);
            }
          } catch (jsonErr) {
            if (jsonErr instanceof Error && jsonErr.message.includes("Terjadi")) {
              throw jsonErr;
            }
          }
        }
      }

      // Finalize the assistant message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        // User stopped generation: preserve partial response
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          )
        );
      } else {
        const errText = err instanceof Error ? err.message : "Gagal memproses jawaban";
        setErrorMessage(errText);

        setMessages((prev) => {
          const hasAssistantBubble = prev.some((m) => m.id === assistantMsgId);
          if (!hasAssistantBubble) {
            return [
              ...prev,
              {
                id: assistantMsgId,
                role: "assistant",
                content:
                  "Maaf, asisten AI sedang tidak tersedia atau mengalami kendala jaringan. Silakan coba kembali beberapa saat lagi.",
                provider: "Layanan Offline",
                cached: false,
                timestamp: formatCurrentTime(),
                isStreaming: false,
              },
            ];
          }
          return prev.map((m) =>
            m.id === assistantMsgId ? { ...m, isStreaming: false } : m
          );
        });
      }
    } finally {
      setIsAnalyzing(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 100);
      scrollToBottomIfNear(true, "smooth");
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (isStreaming) {
      handleStopGenerating();
    }
    setMessages([]);
    setErrorMessage(null);
  };

  // Helper to resolve action button destination
  const resolveActionUrl = (label: string, customUrl?: string): string => {
    if (customUrl && customUrl.trim()) return customUrl.trim();
    const l = label.toLowerCase();
    if (l.includes("daftar") || l.includes("register")) return "/register";
    if (l.includes("masuk") || l.includes("login")) return "/login";
    if (l.includes("upload") || l.includes("cv") || l.includes("resume")) return "/cv";
    if (
      l.includes("lowongan") ||
      l.includes("katalog") ||
      l.includes("cari") ||
      l.includes("jelajahi")
    )
      return "/jobs";
    if (l.includes("tracker") || l.includes("lamaran") || l.includes("pipeline"))
      return "/tracker";
    if (l.includes("market") || l.includes("tren") || l.includes("insight"))
      return "/insights";
    return "/dashboard";
  };

  // Helper formatting for bold, lists, and interactive action buttons in responses
  const renderMessageContent = (text: string, msgIsStreaming = false) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 leading-relaxed text-xs sm:text-sm">
        {lines.map((line, idx) => {
          const isLastLine = idx === lines.length - 1;
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Check for Ultralytics-style interactive action button: [Label](/url) or [Label]
          const actionMatch = trimmed.match(/\[([^\]]+)\](?:\(([^)]+)\))?/);
          if (actionMatch) {
            const fullTag = actionMatch[0];
            const actionLabel = actionMatch[1];
            const explicitUrl = actionMatch[2];
            const textBefore = trimmed.replace(fullTag, "").trim();
            const actionUrl = resolveActionUrl(actionLabel, explicitUrl);
            const isExternal =
              actionUrl.startsWith("http://") || actionUrl.startsWith("https://");

            return (
              <div key={idx} className="space-y-2">
                {textBefore && (
                  <p>
                    <span dangerouslySetInnerHTML={{ __html: formatBold(textBefore) }} />
                    {msgIsStreaming && isLastLine && (
                      <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-sb-sky animate-pulse rounded-xs" />
                    )}
                  </p>
                )}
                <div className="pt-1">
                  {isExternal ? (
                    <a
                      href={actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sb-sky hover:bg-sb-sky-hover text-sb-navy font-semibold text-xs shadow-xs hover:shadow-sm transition-ui duration-150 cursor-pointer group"
                    >
                      <span>{actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  ) : (
                    <Link
                      href={actionUrl}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sb-sky hover:bg-sb-sky-hover text-sb-navy font-semibold text-xs shadow-xs hover:shadow-sm transition-ui duration-150 cursor-pointer group"
                    >
                      <span>{actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          }

          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            const rawContent = trimmed.slice(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-sb-blue font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <span dangerouslySetInnerHTML={{ __html: formatBold(rawContent) }} />
                  {msgIsStreaming && isLastLine && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-sb-sky animate-pulse rounded-xs" />
                  )}
                </span>
              </div>
            );
          }

          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-sb-blue font-semibold shrink-0 text-xs mt-0.5">
                  {numMatch[1]}.
                </span>
                <span>
                  <span dangerouslySetInnerHTML={{ __html: formatBold(numMatch[2]) }} />
                  {msgIsStreaming && isLastLine && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-sb-sky animate-pulse rounded-xs" />
                  )}
                </span>
              </div>
            );
          }

          return (
            <p key={idx}>
              <span dangerouslySetInnerHTML={{ __html: formatBold(line) }} />
              {msgIsStreaming && isLastLine && (
                <span className="inline-block w-1.5 h-3.5 ml-1 align-middle bg-sb-sky animate-pulse rounded-xs" />
              )}
            </p>
          );
        })}
      </div>
    );
  };

  const formatBold = (str: string) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  return (
    <>
      {/* Floating Pill Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Tanya Asisten AI"
          className="fixed right-4 bottom-6 sm:right-6 sm:bottom-6 z-40 inline-flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-sb-sky text-sb-navy shadow-xl hover:bg-sb-sky-hover hover:scale-105 active:scale-[0.97] transition-ui border border-sb-border cursor-pointer group focus:outline-none focus:ring-2 focus:ring-sb-blue focus:ring-offset-2 font-bold"
        >
          <div className="w-6 h-6 rounded-lg bg-white/80 text-sb-navy flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform shadow-2xs">
            <Bot className="w-4 h-4 text-sb-blue" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight">
            Tanya Asisten AI
          </span>
          <span className="w-2 h-2 rounded-full bg-sb-sky animate-pulse ml-0.5" />
        </button>
      )}

      {/* Floating Dialog Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`Asisten AI Lowongan - ${jobTitle}`}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-white/95 backdrop-blur-md border border-sb-border shadow-2xl animate-pop-in origin-bottom-right",
            isMaximized
              ? "inset-2 sm:inset-6 md:inset-10 rounded-2xl"
              : "right-3 bottom-3 sm:right-6 sm:bottom-6 w-[calc(100vw-1.5rem)] sm:w-[440px] h-[580px] sm:h-[620px] max-h-[88vh] rounded-2xl"
          )}
        >
          {/* Header Panel */}
          <div className="px-4 py-3 sm:px-4.5 sm:py-3 bg-sb-mist-soft text-sb-navy border-b border-sb-border flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-sb-border flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 text-sb-blue" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight truncate text-sb-navy">
                    SkillBridge AI
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-sb-blue border border-sb-border shrink-0">
                    Kontekstual
                  </span>
                </div>
                <p className="text-[11px] text-sb-text-2 truncate mt-0.5">
                  {jobTitle} • {company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Bersihkan percakapan"
                  aria-label="Bersihkan percakapan"
                  className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-white/60 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Perkecil ukuran obrolan" : "Perbesar obrolan"}
                aria-label={isMaximized ? "Perkecil ukuran obrolan" : "Perbesar obrolan"}
                className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-white/60 transition-colors cursor-pointer"
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup obrolan"
                aria-label="Tutup obrolan"
                className="p-1.5 rounded-lg text-sb-text-2 hover:text-sb-navy hover:bg-white/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-4.5 space-y-4 bg-sb-mist-faint/30"
          >
            {messages.length === 0 ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-white border border-sb-border shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sb-navy">
                    <MessageSquare className="w-4 h-4 text-sb-blue" />
                    Pusat Informasi & Konsultasi Lowongan
                  </div>
                  <p className="text-xs text-sb-text-2 leading-relaxed">
                    Ajukan pertanyaan seputar tanggung jawab, kualifikasi, atau perbandingan kecocokan CV-mu terhadap lowongan{" "}
                    <strong className="text-sb-navy">{jobTitle}</strong> ini. Jawaban bersumber langsung dari deskripsi lowongan resmi dan data CV-mu.
                  </p>
                </div>

                {/* Pre-suggested quick chips */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-sb-text-2 uppercase tracking-wider">
                    Saran Pertanyaan Awal:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(question)}
                        disabled={isStreaming || isAnalyzing}
                        className="text-left text-xs px-3 py-1.5 rounded-lg border border-sb-border bg-white hover:bg-sb-mist-soft hover:text-sb-navy transition-ui cursor-pointer shadow-2xs active:scale-[0.97] text-sb-navy disabled:opacity-50 font-medium"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-sb-sky text-sb-navy flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-sb-border">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2 ${
                      msg.role === "user"
                        ? "bg-sb-mist-soft text-sb-navy border border-sb-border rounded-tr-xs font-medium"
                        : "bg-white text-sb-navy border border-sb-border rounded-tl-xs"
                    }`}
                  >
                    {renderMessageContent(msg.content, msg.isStreaming)}

                    {msg.role === "assistant" && (
                      <div className="pt-1.5 mt-2 border-t border-sb-border flex justify-end text-xs text-sb-text-2">
                        <span>{msg.timestamp}</span>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-sb-mist text-sb-navy flex items-center justify-center shrink-0 mt-0.5 border border-sb-border">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Initial Analyzing Indicator (Before First Token Arrives) */}
            {isAnalyzing && (
              <div className="flex items-center gap-2.5 text-xs text-sb-text-2 py-2 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-sb-sky text-sb-navy flex items-center justify-center shrink-0 animate-pulse border border-sb-border">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-sb-border shadow-2xs flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-sb-sky animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-sb-sky animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-sb-sky animate-bounce [animation-delay:0.4s]" />
                  <span className="text-sb-text-2 font-medium pl-1 text-xs">Menganalisis konteks lowongan...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips bar when conversation has started */}
          {messages.length > 0 && !isStreaming && !isAnalyzing && (
            <div className="px-3.5 py-1.5 bg-sb-mist-soft/60 border-t border-sb-border overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
              <span className="text-xs font-bold text-sb-text-2 uppercase shrink-0">
                Tanya cepat:
              </span>
              {QUICK_QUESTIONS.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  disabled={isStreaming || isAnalyzing}
                  className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-md bg-white border border-sb-border hover:bg-sb-mist-soft text-sb-navy transition-colors shrink-0 disabled:opacity-50 cursor-pointer shadow-2xs font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 sm:p-3.5 bg-white border-t border-sb-border shrink-0">
            {errorMessage && (
              <div className="mb-2 p-2 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-[11px] font-semibold text-red-800 hover:underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Pertanyaan untuk asisten AI"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.slice(0, 300))}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming || isAnalyzing}
                  placeholder={
                    isStreaming
                      ? "Asisten AI sedang menyusun jawaban..."
                      : "Ketik pertanyaan seputar lowongan ini..."
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-sb-border bg-sb-mist-faint/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sb-blue focus:border-transparent transition-ui pr-14 disabled:opacity-60 text-sb-navy placeholder:text-sb-text-2"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sb-text-2 font-mono">
                  {inputValue.length}/300
                </span>
              </div>

              {isStreaming || isAnalyzing ? (
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  onClick={handleStopGenerating}
                  title="Hentikan respons AI"
                  aria-label="Hentikan respons"
                  className="shrink-0 rounded-xl gap-1.5"
                >
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span className="hidden sm:inline">Hentikan</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputValue.trim()}
                  className="shrink-0 rounded-xl"
                  aria-label="Kirim pesan"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Kirim</span>
                </Button>
              )}
            </form>

            <div className="flex items-center justify-between text-[11px] text-sb-text-2 pt-2 px-1">
              <span>{isStreaming ? "Klik 'Hentikan' untuk membatalkan" : "Tekan Enter untuk mengirim"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
