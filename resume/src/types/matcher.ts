export interface EvaluationDetails {
    scores: {
        relevance: number;
        skills: number;
        experience: number;
        presentation: number;
    };
    compositeScore: number;
    recommendation: string | null;
    isfit: boolean
}

export interface MatchResult {
  resumeEntryId: string;
  resumeName: string;
  jobId: string;
  jobTitle: string;
  jobCompany:string;
  matchResult: string;
  evaluationResponse: EvaluationDetails ;
}

// export interface ProgreeResult {
//   results: MatchResult[];

// }

export interface MatchResultResponse {
  success: boolean;
  message: string;
  results: MatchResult[];
}
