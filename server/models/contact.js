import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['shortlist', 'applied', 'interview', 'rejected'],
    required: true,
  },
});

// Use ES6 export to export the model
export const Job = mongoose.model('Job', jobSchema);
