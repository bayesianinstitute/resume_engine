export interface InterviewQuestion {
  interviewQuestions: string[];
  keySkills: string[];
  preparationTips: string[];
}
export interface PrepResource {
  title: string;
  content: string;
  type: "topic" | "question" | "tip";
}


export interface preparationAPIResponse {
  message: string;
  success: boolean;
  data: string;
}
