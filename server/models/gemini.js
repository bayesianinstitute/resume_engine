import { SchemaType } from "@google/generative-ai";

// Define schema for resume_matchschema evulation response
export const resume_matchschema = {
    description: "Evaluation of resume against job description",
    type: SchemaType.OBJECT,
    properties: {
      scores: {
        type: SchemaType.OBJECT,
        properties: {
          relevance: { type: SchemaType.NUMBER, description: "Score for relevance to job role" },
          skills: { type: SchemaType.NUMBER, description: "Score for skills and expertise" },
          experience: { type: SchemaType.NUMBER, description: "Score for experience level" },
          presentation: { type: SchemaType.NUMBER, description: "Score for presentation and clarity" }
        },
        required: ["relevance", "skills", "experience", "presentation"]
      },
      compositeScore: { type: SchemaType.NUMBER, description: "Overall composite score" },
      recommendation: { type: SchemaType.STRING, description: "Improvement suggestion if composite score is below threshold" },
      isfit: { type: SchemaType.BOOLEAN, description: "Indicates if the resume meets the fit threshold" }
    },
    required: ["scores", "compositeScore", "recommendation", "isfit"]
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
  
