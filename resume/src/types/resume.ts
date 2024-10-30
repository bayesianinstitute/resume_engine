export interface Resume {
  resumeId: string;
  resume: string;
  filename: string;
  strengths: { point: string }[];
  weaknesses: { point: string }[];
  skills: {
    skillName: string;
    skillLevel: string;
  }[];
  uploadedAt: string;
}

export interface ResumeApi {
  userId: string;
  resumes: Resume;
}

export interface ResumeApiResponse {
  success: boolean;
  message: string;
  data: ResumeApi;
}
