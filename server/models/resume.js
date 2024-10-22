import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true, 
  },
  filePath: {
    type: String,
    required: true, 
  },
  uploadedAt: {
    type: Date,
    default: Date.now, 
  },
}, {
  timestamps: true, 
});

export const Resume = mongoose.model('Resume', resumeSchema);
