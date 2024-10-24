import mongoose from 'mongoose';

const skillProgressSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skills: [{
      skillName: String,
      skillLevel: Number,
    }],
    evaluatedAt: {
      type: Date,
      default: Date.now,
    }
  });
  
export const SkillProgress = mongoose.model('SkillProgress', skillProgressSchema);
