import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import { ObjectId } from "mongodb";
import path from "path";
import { Joblist } from "../models/jobModel.js";
import { Automation, Resume } from "../models/resume.js";
import { ResumeAnalysis } from "../models/resumeanalysis.js";
import { SkillProgress } from "../models/skill.js";
// import { PDFLoader } from 'pdf-loader-library';
import { fileURLToPath } from "url";
import { TryCatch } from "../middleware/error.js";
import { Job } from "../models/jobTracker.js";
import { MatchResult } from "../models/MatchResult.js";
import { io } from "../socket.js";
import ErrorHandler, { determineStartDate } from "../utils/utitlity.js";

import { User } from "../models/user.js";
import {
  getLLMEvaluation,
  getLLMEvaluationStats,
} from "../services/llmService.js";
import {
  convertToCSV,
  uploadCSVToS3,
  uploadPDFToS3,
  deleteFromS3,
  downloadFileFromS3,
} from "../utils/s3Upload.js";

import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to check and reset the count if a minute has passed
let apiRequestCount = 0;
let lastRequestTimestamp = Date.now();

// Helper function to check and reset the count if a minute has passed
const checkAndResetApiRequestCount = () => {
  const currentTime = Date.now();
  const timeElapsed = currentTime - lastRequestTimestamp;

  if (timeElapsed >= 60000) {
    // If more than 60 seconds have passed
    apiRequestCount = 0; // Reset the counter
    lastRequestTimestamp = currentTime; // Update the timestamp
  }
};

// Helper function to wait until the LLM API is available again
const waitUntilAvailable = async () => {
  // Check if the API request count is within the limit (15 requests per minute)
  while (apiRequestCount >= 15) {
    const currentTime = Date.now();
    const timeElapsed = currentTime - lastRequestTimestamp;
    const timeRemaining = Math.max(0, 60 - Math.floor(timeElapsed / 1000)); // Calculate remaining time in seconds

    if (io) {
      io.emit("progress", {
        success: false,
        message: `Please wait, we are overloaded. Avaiable in ${timeRemaining} second${
          timeRemaining === 1 ? "" : "s"
        }.`,
      });
    }

    // Wait for 1 second before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
    checkAndResetApiRequestCount(); // Recheck the rate limit
  }
};

export const matcher = TryCatch(async (req, res, next) => {
  const {
    userId,
    resumeEntryIds,
    jobIds,
    selectallJob = false,
    selectallResume = false,
  } = req.body;

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  const fitThreshold = 70;

  try {
    const jobDataArray = selectallJob
      ? await Joblist.find()
      : await Joblist.find({ _id: { $in: jobIds } });

    if (!jobDataArray || jobDataArray.length === 0) {
      return next(new ErrorHandler("No jobs found.", 404));
    }

    const resumeIdsToFetch = selectallResume
      ? (await Resume.find()).flatMap((resume) =>
          resume.resumes.map((r) => r._id.toString())
        )
      : resumeEntryIds;

    if (!resumeIdsToFetch || resumeIdsToFetch.length === 0) {
      return next(new ErrorHandler("No resumes found.", 404));
    }

    const results = [];

    for (const resumeEntryId of resumeIdsToFetch) {
      const resumeData = await Resume.findOne({ "resumes._id": resumeEntryId });
      if (!resumeData) {
        results.push({ resumeEntryId, error: "Resume entry not found." });
        continue;
      }

      const resumeEntry = resumeData.resumes.find(
        (r) => r._id.toString() === resumeEntryId
      );

      if (!resumeEntry) {
        results.push({
          resumeEntryId,
          error: "Resume entry not found in the resumes array.",
        });
        continue;
      }

      const s3Key = resumeEntry.resume; // Assuming the key is stored in `resumeEntry.resume`
      console.log("s3Key: " + s3Key);
      const localFileName = `${resumeEntry.filename || "resume"}.pdf`;

      // Download the file locally
      const localFilePath = await downloadFileFromS3(s3Key, localFileName);

      // Process the downloaded file
      const pdfLoader = new PDFLoader(path.resolve(localFilePath));
      const resumeDocs = await pdfLoader.load();
      const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");
      const resumeName = resumeEntry.filename || "Untitled Resume";

      // Delete the file after processing
      try {
        fs.unlinkSync(localFilePath); // Delete the file synchronously
      } catch (err) {
        console.error("Error deleting file:", err);
      }

      const resumeJobResults = [];

      for (const jobData of jobDataArray) {
        if (!jobData || !jobData._id) {
          console.warn("Invalid jobData:", jobData);
          continue;
        }

        const existingMatch = await MatchResult.findOne({
          userId,
          "resumes.resumeEntryId": resumeEntryId,
          "resumes.jobs.jobId": jobData._id,
        });

        if (existingMatch) {
          const existingJobResult = existingMatch.resumes
            .find(
              (r) => r.resumeEntryId.toString() === resumeEntryId.toString()
            )
            ?.jobs.find((j) => j.jobId.toString() === jobData._id.toString());

          if (existingJobResult) {
            if (io) {
              io.emit("progress", {
                success: true,
                message: `Match for job '${jobData.title}' and resume '${resumeName}' already exists in the database.`,
                results: existingJobResult,
              });
            }
            continue; // Skip LLM evaluation for existing match
          }
        }

        await waitUntilAvailable(); // Wait until the API is available before continuing

        // After waiting, check the rate limit again
        checkAndResetApiRequestCount();
        // Call LLM only if no match is found
        const {
          evaluationText,
          compositeScore,
          scores,
          recommendation,
          isfit,
        } = await getLLMEvaluation(
          resumeText,
          jobData.description,
          fitThreshold
        );

        apiRequestCount++;

        console.log("apiRequestCount: ", apiRequestCount);

        const resultMessage =
          compositeScore >= fitThreshold
            ? `Good fit for job ${jobData.title} with a score of ${compositeScore}%.`
            : `Not a good fit for job ${jobData.title} with a score of ${compositeScore}%.`;

        const newJobResult = {
          resumeName: resumeName,
          jobId: jobData._id,
          jobTitle: jobData.title,
          jobCompany: jobData.company,
          jobUrl: jobData.url,

          matchResult: resultMessage,
          evaluationResponse: {
            scores,
            compositeScore,
            recommendation,
            isfit,
          },
        };

        resumeJobResults.push(newJobResult);

        if (io) {
          io.emit("progress", {
            success: true,
            message: `Progress: ${newJobResult.jobTitle} -> ${newJobResult.matchResult}`,
            results: [newJobResult],
          });
        }
      }

      if (resumeJobResults.length > 0) {
        const matchResult = await MatchResult.findOneAndUpdate(
          { userId, "resumes.resumeEntryId": resumeEntryId },
          {
            $push: { "resumes.$.jobs": { $each: resumeJobResults } },
            $set: { updatedAt: new Date() },
          },
          { new: true }
        );

        if (!matchResult) {
          // If the resume entry doesn't exist in MatchResult, create it.
          await MatchResult.updateOne(
            { userId },
            {
              $push: {
                resumes: {
                  resumeEntryId,
                  resumeName,
                  jobs: resumeJobResults,
                },
              },
              $set: { updatedAt: new Date() },
            },
            { upsert: true }
          );
        }

        results.push(resumeJobResults);

        if (io) {
          io.emit("progress-batch", {
            success: true,
            message: "Completed new matches",
            results: resumeJobResults,
          });
        }
      }
    }

    if (io) {
      io.emit("done", {
        message: "Matching process completed.",
        results,
      });
    }

    res.json({ message: "Match result", success: true, results: results[0] });
  } catch (error) {
    console.error("Error processing resume match:", error);
    return next(new ErrorHandler("An error occurred", 500));
  }
});

export const matcherEnterprise = TryCatch(async (req, res, next) => {
  const {
    email,
    resumeNames = [],
    jobTitles = [],
    selectallJob = false,
    selectallResume = false,
    dateRange = "last_day", // Default to "day"
  } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  // Fetch the user by email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  const filterDate = determineStartDate(dateRange);

  // // Title filter
  // if (title) filter.title = new RegExp(title, "i");

  // Job filtering with partial match and title constraints

  const jobFilter = selectallJob
    ? { datePosted: { $gte: filterDate } }
    : { datePosted: { $gte: filterDate } };

  if (jobTitles.length > 0) {
    jobFilter.title = {
      $in: jobTitles.map((title) => new RegExp(title, "i")), // Partial match for multiple job titles
    };
  }

  const jobDataArray = await Joblist.find(jobFilter);
  if (!jobDataArray || jobDataArray.length === 0) {
    return next(new ErrorHandler("No jobs found.", 404));
  }

  // Determine the resumes to be processed
  const resumeDataArray = selectallResume
    ? await Resume.find()
    : await Resume.find({ "resumes.filename": { $in: resumeNames } });

  if (!resumeDataArray || resumeDataArray.length === 0) {
    return next(
      new ErrorHandler("No resumes found with the given names.", 404)
    );
  }

  const userId = user.id;
  const fitThreshold = 70;
  const results = [];

  try {
    for (const resumeData of resumeDataArray) {
      for (const resumeEntry of resumeData.resumes) {
        if (!resumeNames.includes(resumeEntry.filename)) continue;

        const resumeName = resumeEntry.filename;
        const resumePath = resumeEntry.resume;
        let localFilePath;

        // Handle S3 or local file paths
        if (resumePath.startsWith("https://")) {
          localFilePath = await downloadFileFromS3(resumePath, resumeName);
        } else {
          localFilePath = path.resolve(resumePath);
        }

        const pdfLoader = new PDFLoader(localFilePath);
        const resumeDocs = await pdfLoader.load();
        const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

        for (const jobData of jobDataArray) {
          const existingMatch = await MatchResult.findOne({
            userId,
            "resumes.jobs.jobTitle": jobData.title,
            "resumes.resumeName": resumeName,
          });

          if (existingMatch) {
            // console.log("existingMatch.resumes", existingMatch);
            results.push({
              resumeName,
              jobTitle: jobData.title,
              jobCompany: jobData.company,
              jobUrl: jobData.url,
              evaluationResponse:
                existingMatch.resumes.jobs?.[0]?.evaluationResponse,
            });

            continue;
          }

          await waitUntilAvailable();
          checkAndResetApiRequestCount();

          const {
            evaluationText,
            compositeScore,
            scores,
            recommendation,
            isfit,
          } = await getLLMEvaluation(
            resumeText,
            jobData.description,
            fitThreshold
          );

          apiRequestCount++;

          console.log("apiRequestCount: ", apiRequestCount);

          const newJobResult = {
            resumeName,
            jobTitle: jobData.title,
            jobCompany: jobData.company,
            jobUrl: jobData.url,

            matchResult:
              compositeScore >= fitThreshold
                ? `Good fit for job ${jobData.title} with a score of ${compositeScore}%.`
                : `Not a good fit for job ${jobData.title} with a score of ${compositeScore}%.`,
            evaluationResponse: {
              scores,
              compositeScore,
              recommendation,
              isfit,
            },
          };

          results.push(newJobResult);

          // Save match result to DB
          await MatchResult.updateOne(
            { userId },
            {
              $push: {
                resumes: {
                  resumeName,
                  jobs: [newJobResult],
                },
              },
              $set: { updatedAt: new Date() },
            },
            { upsert: true }
          );
        }

        // Cleanup: Remove downloaded file if necessary
        // if (resumePath.startsWith("https://")) {
        //   fs.unlinkSync(localFilePath);
        // }
      }
    }

    if (results.length === 0) {
      return res.json({ message: "No match results found.", success: false });
    }

    const csvData = results.map((jobResult) => ({
      "Resume Name": jobResult?.resumeName,
      "Job Title": jobResult?.jobTitle,
      "Company Name": jobResult?.jobCompany,
      jobUrl: jobResult?.jobUrl,

      Isfit: jobResult?.evaluationResponse?.isfit,
      "Match Result": jobResult?.matchResult,
      "Composite Score": jobResult?.evaluationResponse?.compositeScore,
      Relevance: jobResult?.evaluationResponse?.scores?.relevance,
      Skills: jobResult?.evaluationResponse?.scores?.skills,
      Experience: jobResult?.evaluationResponse?.scores?.experience,
      Presentation: jobResult?.evaluationResponse?.scores?.presentation,
      Recommendation: jobResult?.evaluationResponse?.recommendation,
    }));

    const csvContent = convertToCSV(csvData);
    const rootDir = path.resolve(__dirname, "../uploads/");
    const targetDir = path.join(rootDir, "match_results");
    const fileName = `match_results_${Date.now()}.csv`;
    const filePath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await writeFileAsync(filePath, csvContent, "utf8");
    console.log(`File saved successfully at ${filePath}`);

    const s3FileUrl = await uploadCSVToS3(filePath, fileName);

    return res.json({ message: "Match result", success: true, s3FileUrl });
  } catch (error) {
    console.error("Error processing resume match:", error);
    return next(new ErrorHandler("An error occurred", 500));
  }
});

export const getResumeMatchResults = TryCatch(async (req, res, next) => {
  const { userId, filterByFit } = req.query; // Use query params for filtering

  if (!userId) {
    return next(new ErrorHandler("User ID is required", 400));
  }

  try {
    // Fetch match results for the user
    const matchResults = await MatchResult.find({ userId }).select(
      "resumes.resumeName resumes.jobs"
    );

    if (!matchResults || matchResults.length === 0) {
      return res.status(404).json({
        message: "No match results found for the user.",
        success: false,
      });
    }

    // Flatten resumes and jobs for frontend, returning all fields in jobs
    const formattedResults = [];
    matchResults.forEach((result) => {
      result.resumes.forEach((resume) => {
        resume.jobs.forEach((job) => {
          const { evaluationResponse } = job;

          // Filter based on fit if provided
          if (
            (filterByFit === "fit" && evaluationResponse.isfit) ||
            (filterByFit === "notFit" && !evaluationResponse.isfit) ||
            !filterByFit ||
            filterByFit === "all"
          ) {
            formattedResults.push({
              resumeEntryId: resume.resumeEntryId,
              resumeName: resume.resumeName,
              jobTitle: job.jobTitle,
              job_url:job.jobUrl || "URL",
              jobCompany: job.jobCompany,
              jobId: job.jobId,
              matchResult: job.matchResult,
              evaluationResponse: {
                compositeScore: evaluationResponse.compositeScore,
                scores: evaluationResponse.scores,
                recommendation: evaluationResponse.recommendation,
                isfit: evaluationResponse.isfit,
              },
            });
          }
        });
      });
    });

    return res.status(200).json({
      message: "Resume Match Results fetched successfully.",
      success: true,
      results: formattedResults,
    });
  } catch (error) {
    console.error("Error fetching match results:", error);
    next(new ErrorHandler("Failed to fetch results.", 500));
  }
});

export const stats = TryCatch(async (req, res, next) => {
  const resumeFile = req.file;
  const { userId } = req.body;
  const fileName = resumeFile.originalname;

  if (!resumeFile) {
    return next(new ErrorHandler("Resume file is required.", 400));
  }

  // Check if a resume with the same filename already exists for the user
  const existingResume = await Resume.findOne({
    userId,
    "resumes.filename": fileName,
  });

  if (existingResume) {
    return res.status(409).json({
      success: false,
      message: "A file with the same name already exists.",
    });
  }

  // Create a unique filename for the temporary local file
  const uniqueFileName = `${userId}-${fileName}-resume`;
  const tempFilePath = path.join(__dirname, "../uploads", uniqueFileName);

  try {
    // Save the file locally
    fs.writeFileSync(tempFilePath, resumeFile.buffer);

    // Load and extract text from the temporary resume PDF file
    const pdfLoader = new PDFLoader(tempFilePath);
    const resumeDocs = await pdfLoader.load();
    const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

    // Analyze the resume text for strengths, weaknesses, and skills
    const { strengths, weaknesses, skills } = await getLLMEvaluationStats(
      resumeText
    );

    // Format strengths and weaknesses as arrays of objects
    const formattedStrengths = strengths.map((point) => ({ point }));
    const formattedWeaknesses = weaknesses.map((point) => ({ point }));
    const formattedSkills =
      skills.length > 0
        ? skills.map((skill) => ({
            skillName: skill.skillName,
            skillLevel: skill.skillLevel,
          }))
        : [{ skillName: "No skill found in resume", skillLevel: 0 }];

    // Upload the processed resume to S3
    const s3Url = await uploadPDFToS3(resumeFile.buffer, uniqueFileName);

    // Store the S3 URL and analysis data in the database
    const resumeRecord = await Resume.findOneAndUpdate(
      { userId },
      {
        $push: {
          resumes: {
            resume: s3Url, // Store the S3 URL
            filename: fileName,
            strengths: formattedStrengths,
            weaknesses: formattedWeaknesses,
            skills: formattedSkills,
          },
        },
      },
      { new: true, upsert: true }
    );

    // Send successful response
    res.json({
      success: true,
      message: "Resume uploaded and analysis data saved successfully!",
      data: resumeRecord,
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    return next(
      new ErrorHandler("An error occurred while processing the resume.", 500)
    );
  } finally {
    // Ensure the temporary file is deleted
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

export const resumeview = TryCatch(async (req, res, next) => {
  const { userId, fileName } = req.params;

  try {
    // Define the base directory for resume uploads
    const relativeUploadsDir = `uploads`; // Adjusted to point to "uploads" directory in root
    const resumeFilePath = path.join(
      process.cwd(),
      relativeUploadsDir,
      fileName
    ); // Full path

    // Check if the file exists
    if (fs.existsSync(resumeFilePath)) {
      // Set headers to display the file in the browser (not force download)
      res.setHeader("Content-Type", "application/pdf"); // Assuming PDF for resume files
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileName}"` // 'inline' for browser display
      );

      // Stream the file to the response
      fs.createReadStream(resumeFilePath).pipe(res);
    } else {
      // Send a 404 response if the file does not exist
      return next(new ErrorHandler("File not found", 400));
    }
  } catch (error) {
    console.error("Error serving resume:", error);
    return next(
      new ErrorHandler("An error occurred while fetching the resume file.", 500)
    );
  }
});

export const getAllResumes = TryCatch(async (req, res, next) => {
  const { userId } = req.query;

  if (!userId) {
    return next(
      new ErrorHandler(
        "An error occurred while processing the resume match..",
        400
      )
    );
  }

  try {
    // Find the user's resume data
    const resumeData = await Resume.findOne({ userId }).lean();

    if (!resumeData) {
      return next(
        new ErrorHandler("No resumes found for the given user ID.", 404)
      );
    }

    // Format the resumes data for response
    const resumes = resumeData.resumes.map((resume, index) => ({
      _id: resume._id.toString(), // Send resume id as collection id from db
      resume: resume.resume, // Include the path to the resume PDF
      filename: resume.filename, // Include the file name for response
      strengths: resume.strengths.map((s) => s.point), // Extract points for response
      weaknesses: resume.weaknesses.map((w) => w.point), // Extract points for response
      skills: resume.skills,
      uploadedAt: resume.uploadedAt,
    }));

    res.status(200).json({
      message: "Resumes retrieved successfully!",
      success: true,
      data: resumes,
    });
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return next(
      new ErrorHandler("An error occurred while fetching resumes.", 500)
    );
  }
});

export const deleteResume = TryCatch(async (req, res, next) => {
  const { userId, resume } = req.body;

  if (!userId || !resume) {
    return next(new ErrorHandler("User ID and resume URL are required.", 400));
  }

  try {
    // Delete the file from S3
    await deleteFromS3(resume);

    // Remove the resume reference from the database
    const updatedResume = await Resume.findOneAndUpdate(
      { userId },
      { $pull: { resumes: { resume } } },
      { new: true }
    );

    if (!updatedResume) {
      return res
        .status(404)
        .json({ error: "Resume not found in the database." });
    }

    res.json({
      success: true,
      message: "Resume deleted successfully.",
      data: updatedResume,
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return next(
      new ErrorHandler("An error occurred while deleting the resume.", 500)
    );
  }
});

// other api :

export const getResumeAnalysis = async (req, res) => {
  const { userId } = req.body;

  try {
    // Find the resume analysis for the given userId
    const resumeAnalysis = await ResumeAnalysis.findOne({ userId });

    if (!resumeAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Resume analysis not found for the given userId.",
      });
    }

    // Send back strengths and weaknesses
    res.status(200).json({
      success: true,
      data: {
        strengths: resumeAnalysis.strengths,
        weaknesses: resumeAnalysis.weaknesses,
      },
    });
  } catch (error) {
    console.error("Error fetching resume analysis:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the resume analysis.",
    });
  }
};

export const getSkillProgresses = async (req, res) => {
  const { userId } = req.body;

  try {
    // Find the skill progress for the given userId
    const skillProgress = await SkillProgress.findOne({ userId });

    if (!skillProgress) {
      return res.status(404).json({
        success: false,
        message: "Skill progress not found for the given userId.",
      });
    }

    // Send back the skills array
    res.status(200).json({
      success: true,
      data: {
        skills: skillProgress.skills,
        evaluatedAt: skillProgress.evaluatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching skill progress:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the skill progress.",
    });
  }
};

export const getStatusCount = async (req, res) => {
  try {
    // Destructure userId from req.body
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Convert userId to ObjectId since it's stored as ObjectId in the database
    const userObjectId = new ObjectId(userId);

    // Aggregate job statuses by userId
    const statusCount = await Job.aggregate([
      { $match: { userId: userObjectId } }, // Match userId as ObjectId
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log(statusCount); // Debugging: check the output

    // Initialize status counts
    const result = {
      shortlist: 0,
      applied: 0,
      interview: 0,
      rejected: 0,
    };

    // Populate the result with actual counts
    statusCount.forEach((statusObj) => {
      const status = statusObj._id.toLowerCase(); // Normalize status to lowercase
      if (result.hasOwnProperty(status)) {
        result[status] = statusObj.count;
      }
    });

    res.json({ data: result });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving job status count", error });
  }
};

export const getAllJobIds = TryCatch(async (req, res, next) => {
  try {
    // Fetch job details along with the job ID from the Joblist collection

    const jobs = await Joblist.find({}, "_id title description url");

    if (!jobs || jobs.length === 0) {
      return next(new ErrorHandler("No jobs found", 404));
    }

    // Return the job details along with job IDs
    const jobDetails = jobs.map((job) => ({
      jobId: job._id,
      jobTitle: job.title,
      jobDescription: job.description,
      jobUrl: job.url || "No URL provided", // Provide a default URL message if not available
    }));

    res.status(200).json({
      success: true,
      message: "Job IDs and details retrieved successfully",
      data: jobDetails,
    });
  } catch (error) {
    console.error("Error fetching job details:", error);
    next(new ErrorHandler("An error occurred while fetching job details", 500));
  }
});

export const handleAutomationData = TryCatch(async (req, res, next) => {
  const { email, resumeNames, jobTitles, selectallResume = false } = req.body;

  // Validate inputs
  if (
    !email ||
    !Array.isArray(resumeNames) ||
    resumeNames.length === 0 ||
    !Array.isArray(jobTitles) ||
    jobTitles.length === 0
  ) {
    return next(
      new ErrorHandler(
        "Email, resume names, and at least one job title are required.",
        400
      )
    );
  }

  try {
    // Find the user's ID using the email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    // Determine the resumes to be processed
    const resumes = selectallResume
      ? await Resume.find({ userId: user._id })
      : await Resume.find({
          userId: user._id,
          "resumes.filename": { $in: resumeNames },
        });

    if (!resumes || resumes.length === 0) {
      return next(
        new ErrorHandler("No resumes found with the given names.", 404)
      );
    }

    // Map resumeNames and jobTitles into the required format
    const automationData = resumeNames.map((resumeName, index) => ({
      resumeName,
      jobTitle: jobTitles[index] || jobTitles[0], // Default to the first job title if titles are fewer
    }));

    // Check if an Automation document exists for this user
    let automation = await Automation.findOne({ userId: user._id });

    if (!automation) {
      // Create a new Automation document if none exists
      automation = new Automation({
        userId: user._id,
        email: email, // Save email along with automation data
        automationData: [],
      });
    }

    // Add or update entries in automationData
    for (const data of automationData) {
      const existingEntry = automation.automationData.find(
        (entry) => entry.resumeName === data.resumeName
      );

      if (existingEntry) {
        // Add jobTitle to the existing entry if not already present
        const titleExists = existingEntry.jobTitles.some(
          (job) => job.title === data.jobTitle
        );
        if (!titleExists) {
          existingEntry.jobTitles.push({ title: data.jobTitle });
        }
      } else {
        // Add a new entry for the resume
        automation.automationData.push({
          resumeName: data.resumeName,
          jobTitles: [{ title: data.jobTitle }],
        });
      }
    }

    // Save the updated document
    await automation.save();

    return res.status(200).json({
      message: "Automation data saved successfully!",
      success: true,
    });
  } catch (error) {
    return next(error);
  }
});
