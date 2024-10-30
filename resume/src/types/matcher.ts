export interface EvaluationDetails {
    scores: {
        relevance: number;
        skills: number;
        experience: number;
        presentation: number;
    };
    compositeScore: number;
    recommendation: string | null;
}

export interface MatchResult {
  resumeEntryId: string;
  jobId: string;
  matchResult: string;
  evaluationResponse: EvaluationDetails;
}

export interface MatchResultResponse {
  success: boolean;
  message: string;
  results: MatchResult[];
}
