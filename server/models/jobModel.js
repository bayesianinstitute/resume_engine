import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  datePosted: {
    type: Date,
    required: true,
    default: Date.now 
  },
  experienceLevel: {
    type: String,
    enum: ["Internship", "Entry Level", "Mid Level", "Senior Level", "Executive"],
    required: false
  },
  company: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true // Make description required
  },
  url: {
    type: String,
    required: false // Make url optional
  }
});

export const Joblist = mongoose.model('Joblist', jobSchema);
