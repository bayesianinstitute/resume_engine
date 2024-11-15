import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumes: [
    {
      resume: {
        type: String, // File Path
        required: true,
      },
      filename:{
        type:String, // file name
        required: true,
        unique: true,
      },
      strengths: [
        {
          point: String, // Each strength point as an individual object
        },
      ],
      weaknesses: [
        {
          point: String, // Each weakness point as an individual object
        },
      ],
      skills: [
        {
          skillName: String,
          skillLevel: String,
        },
      ],
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, {
  timestamps: true,
});

export const Resume = mongoose.model('Resume', resumeSchema);
