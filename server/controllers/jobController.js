import { Joblist } from "../models/jobModel.js";
import { TryCatch } from "../middleware/error.js";
import ErrorHandler from "../utils/utitlity.js";
import axios from 'axios';

const FASTAPI_URL = "http://127.0.0.1:8000/jobs/"; 


export const addJob = TryCatch(async (req, res, next) => {
  const {
    title,
    location,
    experienceLevel,
    datePosted,
    description,
    url,
    company,
  } = req.body;

  // Check for required parameters
  if (!title || !location || !experienceLevel || !description || !company) {
    return next(
      new ErrorHandler("Please provide all required parameters", 400)
    );
  }

  // Check if a job with the same title and location already exists
  const existingJob = await Joblist.findOne({ title, location });
  if (existingJob) {
    return next(
      new ErrorHandler(
        "Job with the same title and location already exists",
        400
      )
    );
  }

  // Create a new job if it doesn't exist
  const joblist = new Joblist({
    title,
    location,
    experienceLevel,
    datePosted: datePosted || Date.now(),
    description,
    url,
    company,
  });

  // Save the job
  await joblist.save();

  return res.status(201).json(joblist);
});

export const searchJobs = TryCatch(async (req, res, next) => {
  const { title, location, experienceLevel, datePosted } = req.query;
  const filter = {};

  if (title) filter.title = new RegExp(title, "i");
  if (location) filter.location = new RegExp(location, "i");
  if (experienceLevel) filter.experienceLevel = experienceLevel;

  // Filtering by date posted
  if (datePosted) {
    const date = new Date(datePosted);
    filter.datePosted = { $gte: date }; // Filter for jobs posted on or after the given date
  }

  const joblists = await Joblist.find(filter);
  return res.status(200).json(joblists);
});

export const listJobs = TryCatch(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const joblists = await Joblist.find()
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const totalJoblists = await Joblist.countDocuments();
  return res.status(200).json({
    totalJoblists,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalJoblists / limit),
    joblists,
  });
});

export const scrapJob = TryCatch(async (req, res, next) => {
  const { title, location, hours, include_description = true } = req.params;
  console.log(title, location, hours, include_description);
  // Check for required parameters
  if (!title || !location || !hours) {
    return next(
      new ErrorHandler("Please provide all required parameters", 400)
    );
  }


  try {
    // Call the FastAPI job scraping endpoint
    const response = await axios.get(FASTAPI_URL, {
      params: {
        role: title,
        location,
        hours,
        include_description,
      },
    });

    const { total_jobs, jobs } = response.data;
    console.log(total_jobs);
    // Save each job in the database if it doesn't already exist
    for (const job of jobs) {
      const existingJob = await Joblist.findOne({
        title: job.title,
        location: job.location,
      });
      if (!existingJob) {
        const joblist = new Joblist({
          title: job.title,
          location: job.location,
          experienceLevel: job.job_level || null, // Adapt as necessary
          datePosted: new Date(job.date_posted), // Convert string to Date
          description: job.description || null,
          url: job.job_url,
          company: job.company,
        });

        await joblist.save();
      }
    }

    return res
      .status(201)
      .json({ message: `Total ${total_jobs} Jobs scraped and saved successfully.` });
  } catch (error) {
    console.error("Error scraping jobs:", error);
    return next(new ErrorHandler("Error while scraping jobs", 500));
  }
});