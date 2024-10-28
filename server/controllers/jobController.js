import { Joblist } from '../models/jobModel.js';
import { TryCatch } from '../middleware/error.js'
import ErrorHandler from '../utils/utitlity.js';

export const addJob = TryCatch(
  async (req, res, next) => {
    const { title, location, experienceLevel, datePosted, description, url } = req.body;

    // Check for required parameters
    if (!title || !location || !experienceLevel || !description) {
      return next(new ErrorHandler("Please provide all required parameters", 400));
    }

    // Check if a job with the same title and location already exists
    const existingJob = await Joblist.findOne({ title, location });
    if (existingJob) {
      return next(new ErrorHandler("Job with the same title and location already exists", 400));
    }

    // Create a new job if it doesn't exist
    const joblist = new Joblist({
      title,
      location,
      experienceLevel,
      datePosted: datePosted || Date.now(), // Use provided datePosted or default to now
      description, // Include the job description
      url // Include the URL link if provided
    });

    // Save the job
    await joblist.save();
    
    return res.status(201).json(joblist);
  }
);

export const searchJobs = TryCatch(
  async (req, res, next) => {
    const { title, location, experienceLevel } = req.query;
    const filter = {};

    if (title) filter.title = new RegExp(title, 'i');
    if (location) filter.location = new RegExp(location, 'i');
    if (experienceLevel) filter.experienceLevel = experienceLevel;

    const joblists = await Joblist.find(filter);
    return res.status(200).json(joblists);
  }
);

export const listJobs = TryCatch(
  async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const joblists = await Joblist.find()
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalJoblists = await Joblist.countDocuments();
    return res.status(200).json({
      totalJoblists,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalJoblists / limit),
      joblists
    });
  }
);
