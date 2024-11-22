import { Joblist } from "../models/jobModel.js";
import { TryCatch } from "../middleware/error.js";
import ErrorHandler, { fetchCountryByCity } from "../utils/utitlity.js";
import axios from 'axios';
import csv from 'csvtojson';

const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000/jobs/"; 

// add Jobs
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
  const existingJob = await Joblist.findOne({ title:title, location:location, company: company});
  if (existingJob) {
    return next(
      new ErrorHandler(
        `Job with the same title,company and location already exists`,
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

  return res.status(201).json({joblist: joblist, success:true,message:"Added job successfully"});
});

// add from csv file
export const uploadJobsFromCSV = TryCatch(async (req, res, next) => {
  // Check if file exists
  if (!req.file) {
    return next(new ErrorHandler('No file uploaded', 400));
  }

  try {
    // Convert CSV to JSON
    const jsonArray = await csv().fromString(req.file.buffer.toString());

    // Validate CSV structure
    const requiredFields = ['title', 'location', 'company', 'description'];
    const missingFields = requiredFields.filter(field => 
      !jsonArray.every(row => row.hasOwnProperty(field) && row[field])
    );

    if (missingFields.length > 0) {
      return next(new ErrorHandler(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    // Prepare jobs for bulk insert with deduplication
    const jobsToInsert = [];
    const duplicateJobs = [];

    for (const job of jsonArray) {
      // Normalize job data
      const normalizedJob = {
        title: job.title.trim(),
        location: job.location.trim(),
        company: job.company.trim(),
        description: job.description.trim(),
        experienceLevel: job.experienceLevel || 'Entry Level',
        datePosted: job.datePosted ? new Date(job.datePosted) : new Date(),
        url: job.url || ''
      };

      // Check for existing job
      const existingJob = await Joblist.findOne({
        title: normalizedJob.title,
        location: normalizedJob.location,
        company: normalizedJob.company,
        url: normalizedJob.url
      });

      if (!existingJob) {
        jobsToInsert.push(normalizedJob);
      } else {
        duplicateJobs.push(normalizedJob);
      }
    }

    // Bulk insert non-duplicate jobs
    let insertedCount = 0;
    if (jobsToInsert.length > 0) {
      const result = await Joblist.insertMany(jobsToInsert, { ordered: false });
      insertedCount = result.length;
    }

    // Respond with import statistics
    res.status(200).json({
      success: true,
      message: 'CSV Import Completed',
      totalRecords: jsonArray.length,
      insertedRecords: insertedCount,
      duplicateRecords: duplicateJobs.length,
      duplicateJobs: duplicateJobs
    });

  } catch (error) {
    return next(new ErrorHandler(`CSV Import Error: ${error.message}`, 500));
  }
});


export const scrapJob = TryCatch(async (req, res, next) => {
  const { title, location, hours, include_description = true, max_result_wanted,country_code } = req.body;
  // console.log(title, location, hours, include_description, max_result_wanted);

  // Check for required parameters
  if (!title || !location || !hours) {
    return next(
      new ErrorHandler("Please provide all required parameters", 400)
    );
  }

  let countryCode = country_code
  if (!country_code ){

    countryCode = await fetchCountryByCity(location);
  }

  console.log("country fetch ",country_code)
  try {
    // Call the FastAPI job scraping endpoint
    const response = await axios.get(FASTAPI_URL, {
      params: {
        role: title,
        location,
        hours,
        include_description,
        country:countryCode,
        max_result_wanted
      },
    });

    const { total_jobs, jobs } = response.data;

    // Save each job in the database if it doesn't already exist
    let newJobsCount = 0;
    let newJobs = [];
    for (const job of jobs) {
      const existingJob = await Joblist.findOne({
        title: job.title,
        location: job.location,
      });

      if (!existingJob) {
        const joblist = new Joblist({
          title: job.title,
          location: job.location,
          experienceLevel: job.job_level || null,
          datePosted: new Date(job.date_posted),
          description: job.description || null,
          url: job.job_url,
          company: job.company,
        });

        await joblist.save();
        newJobsCount++;
        newJobs.push(joblist);
      }
    }

    const existingJobsCount = total_jobs - newJobsCount;

    return res
      .status(201)
      .json({ 
        message: `Total jobs found: ${total_jobs}. New jobs saved: ${newJobsCount}. Jobs already in database: ${existingJobsCount}.`,
        success: true,
        joblist: newJobs
        
      });
  } catch (error) {
    return next(new ErrorHandler("Error while scraping jobs", 500));
  }
});


// get jobs
export const searchJobs = TryCatch(async (req, res, next) => {
  const { title, location, datePosted } = req.body;
  const filter = {};

  console.log(`Title: ${title}, Location: ${location}, Date Posted: ${datePosted}`);

  // Title filter
  if (title) filter.title = new RegExp(title, "i");

  // Location filter
  if (location) filter.location = new RegExp(location, "i");

  // Date filter
  if (datePosted) {
    const date = new Date(datePosted);
    if (!isNaN(date.getTime())) {
      filter.datePosted = { $gte: date }; // Filter for jobs posted on or after the given date
    } else {
      console.warn("Invalid date format for datePosted:", datePosted);
    }
  }

  console.log("Applied Filter:", filter);

  try {
    const joblists = await Joblist.find(filter);
    const totalJoblists = joblists.length;

    if (totalJoblists === 0) {
      console.log("No matching job listings found");
      return res.status(404).json({
        message: "No job listings match the specified criteria.",
        success: true,
        data: {
        joblists: [],
        totalJoblists: 0,
      }});
    }

    console.log("Total Job Listings Found:", totalJoblists);
    return res.status(200).json({

      message: `Found ${totalJoblists} matching job listings.`,
      success: true,
      data: {
        joblists,
        totalJoblists,
      },
    });
  } catch (error) {
    console.error("Error searching for jobs:", error);
    return next(new ErrorHandler("Error while searching for jobs", 500));
  }
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




