export interface TopSkillInsight {
  skillName: string;
  category: string;
  frequencyCount: number;
  percentage: number;
  cvStatus: "tercantum" | "belum_ditemukan" | "perlu_verifikasi";
  statusLabel: string;
  exampleRequirement: string;
}

export interface LearningRec {
  skillName: string;
  demandPercentage: number;
  reason: string;
  priority?: string;
  action: string;
}

/** Respons GET /api/insights. */
export interface InsightsResponse {
  error?: string;
  sampleSizeN?: number;
  lastUpdated?: string;
  topSkills?: TopSkillInsight[];
  learningRecommendations?: LearningRec[];
}
