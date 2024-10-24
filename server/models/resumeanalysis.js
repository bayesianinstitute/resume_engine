import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true, 
  },
  overallStrength: {
    type: Number,
  },
  strengths: {
    type: [String], 
  },
  weaknesses: {
    type: [String], 
  },
  evaluatedAt: {
    type: Date,
    default: Date.now, 
  }
}, {
  timestamps: true, 
});

export const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
