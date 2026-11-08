export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
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
  minGpa?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: string | null;
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
  experienceYears: number | null;
  education: string;
  gpa?: number | null;
  skills: string[];
  claimedSkills?: string[];
  reviewSkills?: string[];
  matchScore?: number;
  matchStatus?: string;
  matchedSkills?: string[];
  missingSkills?: string[];
  updatedAt?: string;
}

