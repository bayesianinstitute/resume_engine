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
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to the User model
    ref: 'User',
    required: true, // Ensure every job is associated with a user
  },
}, {
  timestamps: true, // Automatically creates createdAt and updatedAt fields
});

// Use ES6 export to export the model
export const Job = mongoose.model('jobTracker', jobSchema);
