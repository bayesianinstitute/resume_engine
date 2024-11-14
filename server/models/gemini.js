import { SchemaType } from "@google/generative-ai";

// Define schema for resume_matchschema evulation response
export const resume_matchschema = {
  description: "Evaluation of resume against job description",
  type: SchemaType.OBJECT,
  properties: {
    scores: {
      type: SchemaType.OBJECT,
      properties: {
        relevance: {
          type: SchemaType.NUMBER,
          description: "Score for relevance to job role",
        },
        skills: {
          type: SchemaType.NUMBER,
          description: "Score for skills and expertise",
        },
        experience: {
          type: SchemaType.NUMBER,
          description: "Score for experience level",
        },
        presentation: {
          type: SchemaType.NUMBER,
          description: "Score for presentation and clarity",
        },
      },
      required: ["relevance", "skills", "experience", "presentation"],
    },
    compositeScore: {
      type: SchemaType.NUMBER,
      description: "Overall composite score",
    },
    recommendation: {
      type: SchemaType.STRING,
      description:
        "Improvement suggestion if composite score is below threshold",
    },
    isfit: {
      type: SchemaType.BOOLEAN,
      description: "Indicates if the resume meets the fit threshold",
    },
  },
  required: ["scores", "compositeScore", "recommendation", "isfit"],
};

// Define schema for interview preparation resources
export const preparationResourcesSchema = {
  description: "Interview preparation resources based on job description",
  type: SchemaType.OBJECT,
  properties: {
    keySkills: {
      type: SchemaType.ARRAY,
      description: "List of key skills required for the job",
      items: {
        type: SchemaType.STRING,
      },
      nullable: false,
    },
    interviewQuestions: {
      type: SchemaType.ARRAY,
      description: "List of sample interview questions",
      items: {
        type: SchemaType.STRING,
      },
      nullable: false,
    },
    preparationTips: {
      type: SchemaType.ARRAY,
      description: "List of preparation tips for the role",
      items: {
        type: SchemaType.STRING,
      },
      nullable: false,
    },
  },
  required: ["keySkills", "interviewQuestions", "preparationTips"],
};

// / Define schema for LLM evaluation of resume strengths, weaknesses, and skills
export const resume_evaluation_schema = {
  description:
    "Evaluation of resume based on LLM analysis for strengths, weaknesses, and skill proficiency",
  type: SchemaType.OBJECT,
  properties: {
    strengths: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        description: "Strength identified in the resume",
      },
      description: "List of strengths found in the resume",
      nullable: false,
    },
    weaknesses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
        description: "Weakness identified in the resume",
      },
      description: "List of weaknesses or areas for improvement",
      nullable: false,
    },
    skills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          skillName: {
            type: SchemaType.STRING,
            description: "Name of the technical skill",
          },
          skillLevel: {
            type: SchemaType.NUMBER,
            description: "Proficiency level of the skill out of 100",
          },
        },
        required: ["skillName", "skillLevel"],
        description: "Technical skill with proficiency rating",
      },
      description: "Array of skills with proficiency ratings",
      nullable: false,
    },
  },
  required: ["strengths", "weaknesses", "skills"],
};
