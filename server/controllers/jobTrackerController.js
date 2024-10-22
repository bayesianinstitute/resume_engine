import { Job } from '../models/job.js';

// Fetch jobs for a specific user
export const getJobs = async (req, res) => {
  const userId = req.query.userId; // Get userId from query parameters
  try {
    const jobs = await Job.find({ userId }); // Fetch jobs for this userId
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs', error });
  }
};

// Create a new job for a specific user
export const createJob = async (req, res) => {
  const { title, company, status, userId } = req.body;

  if (!title || !company || !status || !userId) {
    return res.status(400).json({ message: 'Title, company, status, and userId are required' });
  }

  try {
    const newJob = new Job({ title, company, status, userId });
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job', error });
  }
};

// Update job status
export const updateJobStatus = async (req, res) => {
    const { id } = req.params; // Get the job ID from URL parameters
    const { status } = req.body; // Get the new status from the request body
  
    // Ensure status is provided
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
  
    try {
      // Find job by ID and update its status
      const updatedJob = await Job.findByIdAndUpdate(id, { status }, { new: true });
  
      // If job not found, return 404
      if (!updatedJob) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Return the updated job
      res.status(200).json(updatedJob);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update job status', error: error.message });
    }
  };


// Delete job by ID
export const deleteJob = async (req, res) => {
    const { id } = req.params; // Get the job ID from URL parameters
  
    try {
      // Find the job by ID and delete it
      const deletedJob = await Job.findByIdAndDelete(id);
  
      // If the job was not found, return 404
      if (!deletedJob) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Return success message
      res.status(200).json({ message: 'Job successfully deleted', job: deletedJob });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete job', error: error.message });
    }
  };