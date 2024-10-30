import mongoose from 'mongoose';


const JobMatchingSchema = new mongoose.Schema({
  resumeEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Resume', // Reference to the Resume model
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Joblist', // Reference to the Joblist model
  },
  scores: {
    relevance: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    presentation: { type: Number, default: 0 },
  },
  compositeScore: {
    type: Number,
    default: 0,
  },
  recommendation: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export const  JobMatching = mongoose.model('JobMatching', JobMatchingSchema);

