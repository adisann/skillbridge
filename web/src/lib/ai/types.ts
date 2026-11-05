export type AIProvider = "gemini" | "groq" | "fallback" | "cache";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatRequest {
  message: string;
  history?: ChatMessage[];
  userId?: string;
}

export interface AIChatResponse {
  message: string;
  provider: string;
  cached: boolean;
  cacheType?: "job_knowledge" | "cv_analysis" | "memory";
  hasCvContext: boolean;
  sources: string[];
}

export interface ActiveJobContext {
  id: string;
  title: string;
  canonicalTitle: string;
  company: string;
  location: string;
  employmentType: string;
  seniority?: string | null;
  experienceYearsMin?: number | null;
  education?: string | null;
  description: string;
  contentHash: string;
  sourceName: string;
  sourceUrl: string;
  retrievalMethod: string;
  retrievedAt: string;
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface CandidateCVContext {
  userId: string;
  resumeId: string;
  fullName: string;
  targetRole: string;
  experienceYears: number;
  education: string;
  skills: string[];
  matchScore?: number;
  matchStatus?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  updatedAt?: string;
}

