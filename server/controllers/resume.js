import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import { ObjectId } from "mongodb";
import path from "path";
import { Joblist } from "../models/jobModel.js";
import { Resume } from "../models/resume.js";
import { ResumeAnalysis } from "../models/resumeanalysis.js";
import { SkillProgress } from "../models/skill.js";
// import { PDFLoader } from 'pdf-loader-library';
import { fileURLToPath } from "url";
import { TryCatch } from "../middleware/error.js";
import { Job } from "../models/jobTracker.js";
import { MatchResult } from "../models/MatchResult.js";
import { io } from "../socket.js";
import ErrorHandler from "../utils/utitlity.js";

import { User } from "../models/user.js";
import { getLLMEvaluation, getLLMEvaluationStats } from "../services/llmService.js";
import { convertToCSV, uploadCSVToS3 } from "../utils/s3Upload.js";

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

      const resumeName = resumeEntry.filename || "Untitled Resume";
      const resumePath = resumeEntry.resume;
      const pdfLoader = new PDFLoader(path.join(process.cwd(), resumePath));
      const resumeDocs = await pdfLoader.load();
      const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

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

        const resultMessage =
          compositeScore >= fitThreshold
            ? `Good fit for job ${jobData.title} with a score of ${compositeScore}%.`
            : `Not a good fit for job ${jobData.title} with a score of ${compositeScore}%.`;

        const newJobResult = {
          resumeName: resumeName,
          jobId: jobData._id,
          jobTitle: jobData.title,
          jobCompany: jobData.company,
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

export const matcherEnterprice = TryCatch(async (req, res, next) => {
  const {
    email,
    resumeEntryIds,
    jobIds,
    selectallJob = false,
    selectallResume = false,
  } = req.body;


  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });

  const userId= user.id
  console.log(userId);

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

      const resumeName = resumeEntry.filename || "Untitled Resume";
      const resumePath = resumeEntry.resume;
      const pdfLoader = new PDFLoader(path.join(process.cwd(), resumePath));
      const resumeDocs = await pdfLoader.load();
      const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

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

        const resultMessage =
          compositeScore >= fitThreshold
            ? `Good fit for job ${jobData.title} with a score of ${compositeScore}%.`
            : `Not a good fit for job ${jobData.title} with a score of ${compositeScore}%.`;

        const newJobResult = {
          resumeName: resumeName,
          jobId: jobData._id,
          jobTitle: jobData.title,
          jobCompany: jobData.company,
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
    console.log("results",results[0])
    const csvData = results.flat().map((jobResult) => ({
      "Resume Name": jobResult.resumeName,
      "Job Title": jobResult.jobTitle,
      "Company Name": jobResult.jobCompany,
      Isfit: jobResult.evaluationResponse.isfit,
      "Match Result": jobResult.matchResult,
      "Composite Score": jobResult.evaluationResponse.compositeScore,
      Relevance: jobResult.evaluationResponse.scores.relevance,
      Skills: jobResult.evaluationResponse.scores.skills,
      Experience: jobResult.evaluationResponse.scores.experience,
      Presentation: jobResult.evaluationResponse.scores.presentation,
      Recommendation: jobResult.evaluationResponse.recommendation,
    }));
    console.log("csvData ",csvData)
    // Convert JSON data to CSV format
    const csvContent = convertToCSV(csvData);
    // Generate a unique file name
    const fileName = `match_results_${Date.now()}`;

    // Upload CSV to S3 and get the file URL
    const s3FileUrl = await uploadCSVToS3(csvContent, fileName);
    console.log("CSV uploaded to S3:", s3FileUrl);

    return res.json({ message: "Match result", success: true,s3FileUrl });
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

  // Define the uploads directory inside the `server` folder
  const uploadsDir = path.join(__dirname, "../uploads");

  // Create the directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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

  // Create a unique filename for the resume
  const resumeFileName = `${userId}-${Date.now()}-resume.pdf`;
  const resumeFilePath = path.join(uploadsDir, resumeFileName);

  // Store only the relative path from the `uploads` directory
  const relativePath = path.join("uploads", resumeFileName);

  try {
    // Write the resume to the defined file path
    fs.writeFileSync(resumeFilePath, resumeFile.buffer);

    // Load and extract text from the resume PDF
    const pdfLoader = new PDFLoader(resumeFilePath);
    const resumeDocs = await pdfLoader.load();
    const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

    // Analyze the resume text for strengths, weaknesses, and skills
    const { strengths, weaknesses, skills } = await getLLMEvaluationStats(
      resumeText
    );

    // Format strengths, weaknesses, and skills
    const formattedStrengths = strengths.map((point) => ({ point }));
    const formattedWeaknesses = weaknesses.map((point) => ({ point }));
    const formattedSkills =
      skills.length > 0
        ? skills.map((skill) => ({
            skillName: skill.skillName,
            skillLevel: skill.skillLevel,
          }))
        : [{ skillName: "No skill found in resume", skillLevel: 0 }];

    // Store the relative path and analysis data in the database
    const resumeRecord = await Resume.findOneAndUpdate(
      { userId },
      {
        $push: {
          resumes: {
            resume: relativePath, // Store only the relative path
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
  }
});


export const resumeview =  TryCatch(async (req, res, next) => {
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
  // return next(new ErrorHandler("User ID and file name are required.", 400));

  if (!userId || !resume) {
    return next(new ErrorHandler("User ID and file name are required.", 400));
  }

  try {
    // Define the base directory for resume uploads
    const resumeFilePath = resume;

    console.log("Resuming upload", resumeFilePath);

    // Check if the file exists and delete it from the server
    if (fs.existsSync(resumeFilePath)) {
      fs.unlinkSync(resumeFilePath); // Remove the file from the server
    } else {
      return next(new ErrorHandler("File not found on the server.", 400));
    }

    // Remove the resume reference from the database
    const updatedResume = await Resume.findOneAndUpdate(
      { userId },
      { $pull: { resumes: { resume: resume } } },
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
