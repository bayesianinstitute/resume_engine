import mongoose from "mongoose";

const matchResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumes: [
      {
        resumeEntryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Resume",
          required: true,
        },
        resumeName: { type: String, required: true },
        evaluationResponse: { type: String }, // Still at resume level if needed
        jobs: [
          {
            jobId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Joblist",
              required: true,
            },
            jobTitle: { type: String, required: true },
            jobCompany: { type: String, required: true },
            matchResult: { type: String, required: true },
            compositeScore: { type: Number, required: true }, // Job-specific composite score
            scores: {
              relevance: { type: Number, required: true },
              skills: { type: Number, required: true },
              experience: { type: Number, required: true },
              presentation: { type: Number, required: true },
            },
            recommendation: { type: String }, // Job-specific recommendation
          },
        ],
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export const MatchResult = mongoose.model("MatchResult", matchResultSchema);
