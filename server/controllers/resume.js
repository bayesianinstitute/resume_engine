import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import os from "os";
import path from "path";
import { Resume } from "../models/resume.js";
import { Joblist } from "../models/jobModel.js";
import { ResumeAnalysis } from "../models/resumeanalysis.js";
import { SkillProgress } from "../models/skill.js";
import { genAIModel, openai } from "../utils/chatAI.js";
import { ObjectId } from "mongodb";
// import { PDFLoader } from 'pdf-loader-library';
import { fileURLToPath } from "url";
import { Job } from "../models/jobTracker.js";
import { JobMatching } from "../models/JobMatching.js"; // Import your JobMatching model
import { TryCatch } from "../middleware/error.js";
import ErrorHandler from "../utils/utitlity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getLLMEvaluation(resumeText, jobDescription, fitThreshold,id) {
  const prompt = `
    Evaluate the following resume against the job description. For each criterion, provide a score out of 100:
    - Relevance to the job role
    - Skills and expertise
    - Experience level
    - Presentation and clarity

    Also, calculate a composite score. If the composite score is below ${fitThreshold}, include a recommendation for improvement.

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}

    Note: 
    Respond strictly in the following JSON format without any additional text. below is the JSON Structure:
    {
      "scores": {
        "relevance": <score>,
        "skills": <score>,
        "experience": <score>,
        "presentation": <score>
      },
      "compositeScore": <score>,
      "recommendation": "<one concise suggestion if applicable>"
      "isfit":true/false
    }

  `;

  try {
    const chatSession = genAIModel.startChat({ history: [] });
    const result = await chatSession.sendMessage(prompt);
    let response = result.response.text().trim();
    // Save the response as plain text
    // const filePath = path.join(__dirname, `evaluation_response_${id}.txt`);
    // fs.writeFileSync(filePath, response, "utf-8");
    // console.log("Evaluation response saved to:", filePath);

    // Function to check if the response is valid JSON
    const isValidJSON = (text) => {
      try {
        JSON.parse(text);
        return true;
      } catch {
        console.log("It is not a valid JSON.");
        return false;
      }
    };

    // If response is not valid JSON, resend the request
    if (!isValidJSON(response)) {
      console.warn("Response was not in JSON format. Resending request.");
      response = await chatSession.sendMessage(
        prompt + "\n\nPlease ensure your response is in valid JSON format."
      );
      console.log("it is now in JSON format");
      response = response.response.text().trim();
    }

    return {
      evaluationText: response,
    };
  } catch (error) {
    console.error("Error fetching LLM evaluation:", error);
    return {
      evaluationText: "Evaluation results not found.",
    };
  }
}

export const matcher = TryCatch(async (req, res, next) => {
  const {
    resumeEntryIds,
    jobIds,
    selectallJob = false,
    selectallResume = false,
  } = req.body;
  const fitThreshold = 70;

  try {
    // Fetch all jobs if selectallJob is true; otherwise, fetch based on jobIds array
    const jobDataArray = selectallJob
      ? await Joblist.find()
      : await Joblist.find({ _id: { $in: jobIds } });

    if (!jobDataArray || jobDataArray.length === 0) {
      return next(new ErrorHandler("No jobs found.", 404));
    }

    // Fetch all resumes if selectallResume is true; otherwise, use resumeEntryIds array
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
      // Find the specific resume entry
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

      // Load resume text
      const resumePath = resumeEntry.resume;
      const pdfLoader = new PDFLoader(path.join(process.cwd(), resumePath));
      const resumeDocs = await pdfLoader.load();
      const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

      // Evaluate each job description against the resume text
      for (const jobData of jobDataArray) {
        const jobDescription = jobData.description;

        const { evaluationText, compositeScore, scores, recommendation } =
          await getLLMEvaluation(resumeText, jobDescription, fitThreshold,jobData._id);

        // Save the evaluation to JobMatching
        const jobMatchingEntry = new JobMatching({
          resumeEntryId,
          jobId: jobData._id,
          scores,
          compositeScore,
          recommendation,
        });
        await jobMatchingEntry.save();

        let resultMessage;
        if (compositeScore !== null && compositeScore >= fitThreshold) {
          resultMessage = `You are a good fit for the job ${jobData.title} with a score of ${compositeScore}%.`;
        } else {
          resultMessage = `You are not a perfect fit for the job ${jobData.title} with a score of ${compositeScore}%. Please refer to the suggestions below for improving your application:\n\n${evaluationText}`;
        }

        console.log(resumeEntry.filename);
        // Push result for each job evaluated
        results.push({
          resumeEntryId,
          resumeName: resumeEntry.filename,
          jobTitle: jobData.title,
          jobCompany: jobData.company,
          jobId: jobData._id,
          matchResult: resultMessage,
          evaluationResponse: evaluationText,
        });
      }
    }

    // Return all results
    res.json({ message: "Match result", success: true, results });
  } catch (error) {
    console.error("Error processing resume match:", error);
    return next(
      new ErrorHandler(
        "An error occurred while processing the resume match..",
        500
      )
    );
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

    // Format strengths and weaknesses as arrays of objects
    const formattedStrengths = strengths.map((point) => ({ point }));
    const formattedWeaknesses = weaknesses.map((point) => ({ point }));

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
            skills: skills.map((skill) => ({
              skillName: skill.skillName,
              skillLevel: skill.skillLevel,
            })),
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Resume Upload and analysis data successfully!",
      data: resumeRecord,
      resumeId: resumeRecord._id.toString(), // Send resume _id in response
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    return next(
      new ErrorHandler("An error occurred while processing the resume.", 500)
    );
  }
});

export const resumeview = async (req, res) => {
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
      // Set headers to prompt file download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
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
};

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
      resumeId: resume._id.toString(), // Send resume id as collection id from db
      filename: resume.filename, // Include the file name for response
      strengths: resume.strengths.map((s) => s.point), // Extract points for response
      weaknesses: resume.weaknesses.map((w) => w.point), // Extract points for response
      skills: resume.skills,
      uploadedAt: resume.uploadedAt,
      resume: resume.resume, // Include the path to the resume PDF
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
    return next(new ErrorHandler("User ID and file name are required.", 400));
  }

  try {
    // Define the base directory for resume uploads
    const relativeUploadsDir = "uploads";
    const resumeFilePath = resume;

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

// Helper function to get embeddings for text chunks
async function getEmbeddingsForChunks(chunks) {
  try {
    const embeddingsResponses = await Promise.all(
      chunks.map((chunk) =>
        openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk,
        })
      )
    );
    return embeddingsResponses.map((response) => response.data[0].embedding);
  } catch (error) {
    console.error("Error fetching embeddings:", error);
    throw new Error("Failed to fetch embeddings");
  }
}

// async function getLLMEvaluation(resumeText, jobDescription, fitThreshold) {
//   const prompt = `
//     Evaluate the following resume against the job description. For each criterion, provide a numerical score out of 100:
//     - Relevance to the job role
//     - Skills and expertise
//     - Experience level
//     - Presentation and clarity

//     List each score only once. After listing these, provide a single composite score. If the composite score is below ${fitThreshold}, give one recommendation on how to improve. **Do not repeat any of the criteria, scores, or recommendations. Stop after the recommendation.**

//     Format example:
//     - Relevance: 80%
//     - Skills: 75%
//     - Experience: 60%
//     - Presentation: 90%
//     - Composite Score: 76%
//     - Recommendation: [One sentence only, if needed]

//     Resume:
//     ${resumeText}

//     Job Description:
//     ${jobDescription}

//     Output format:
//     - Scores for each criterion
//     - Composite Score
//     - One recommendation if applicable
//   `;
//   try {
//     const chatSession = genAIModel.startChat({
//       history: [],
//     });

//     const result = await chatSession.sendMessage(prompt);

//     const response = result.response.text();

//     const scoreMatch = response.match(/Composite Score:\s*(\d+)/i);
//     const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

//     return { evaluationText: response, score };
//   } catch (error) {
//     console.error("Error fetching LLM evaluation:", error);
//     return {
//       evaluationText:
//         "Evaluation and improvement suggestions are not available.",
//       score: null,
//     };
//   }
// }

export async function getLLMEvaluationStats(resumeText) {
  const prompt = `
    You are an expert career coach and resume evaluator. Based on the following resume, analyze the person's strengths, weaknesses, and provide numeric skill proficiency levels (out of 100) for technical skills mentioned in the resume. Provide the analysis based on the following criteria:

    1. Relevance to the job market (how well the skills and experience fit common job roles).
    2. Technical skills and expertise (assign a skill proficiency value out of 100 for each key technical skill).
    3. Professional experience (years and quality of experience in relevant fields).
    4. Presentation and clarity (how well-structured and clear the resume is).

    Specifically provide the following:
    
    - **Strengths**: A list of strengths based on the resume content.
    - **Weaknesses**: A list of weaknesses or areas where improvement is needed.
    - **Skills and Proficiency**: Assign a numeric value out of 100 for each relevant technical skill. For example, Python, React, Machine Learning, SQL, etc.

    Resume Content:
    ${resumeText}

    Your response format should be:

    - **Strengths**: [list of strengths]
    - **Weaknesses**: [list of weaknesses]
    - **Skills and Proficiency**: [skill1: proficiency, skill2: proficiency, skill3: proficiency, ...]

    Example format:
    - Strengths: Strong Python skills, clear project descriptions.
    - Weaknesses: Limited experience in SQL.
    - Skills and Proficiency: Python: 85, React: 70, SQL: 60, Machine Learning: 55
  `;

  try {
    const chatSession = genAIModel.startChat({
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);

    const response = result.response.text();

    // Regex to extract strengths, weaknesses, and skills sections
    const strengthsMatch = response.match(
      /(?<=\*\*Strengths\*\*:\s*)([\s\S]+?)(?=\*\*Weaknesses\*\*:)/i
    );
    const weaknessesMatch = response.match(
      /(?<=\*\*Weaknesses\*\*:\s*)([\s\S]+?)(?=\*\*Skills and Proficiency\*\*:)/i
    );
    const skillsMatch = response.match(
      /(?<=\*\*Skills and Proficiency\*\*:\s*)([\s\S]+)/i
    );

    // Parse strengths and weaknesses into arrays based on dash "-" or newline delimiters
    const strengths =
      strengthsMatch && strengthsMatch[0].trim()
        ? strengthsMatch[0]
            .split(/\s*-\s+/) // Split on dash followed by whitespace
            .filter((s) => s.trim() !== "") // Filter out any empty items
        : ["No specific strengths identified."];

    const weaknesses =
      weaknessesMatch && weaknessesMatch[0].trim()
        ? weaknessesMatch[0]
            .split(/\s*-\s+/) // Split on dash followed by whitespace
            .filter((w) => w.trim() !== "")
        : ["No specific weaknesses identified."];

    // Parse skills into an array of objects with skill name and level
    const skills =
      skillsMatch && skillsMatch[0].trim()
        ? skillsMatch[0]
            .split(/\n+/) // Split by newline
            .map((skill) => {
              const match = skill.match(/([\w\s\(\)]+):\s*(\d+)/); // Capture skill name and level
              if (match) {
                return {
                  skillName: match[1].trim(),
                  skillLevel: parseInt(match[2], 10),
                };
              }
              return null;
            })
            .filter(Boolean) // Remove null values
        : [{ skillName: "No skills identified", skillLevel: 0 }];

    return {
      strengths,
      weaknesses,
      skills,
    };
  } catch (error) {
    console.error("Error fetching LLM evaluation:", error);
    return {
      strengths: ["Unable to retrieve strengths."],
      weaknesses: ["Unable to retrieve weaknesses."],
      skills: [{ skillName: "Error fetching skills", skillLevel: 0 }],
    };
  }
}

export async function getLLMEvaluationMatcher(
  resumeText,
  jobCompany,
  fitThreshold = 70
) {
  const prompt = `
    You are an expert career coach and resume evaluator. Based on the following resume, analyze the person's strengths, weaknesses, and provide numeric skill proficiency levels (out of 100) for technical skills mentioned in the resume. Extract key personal information and evaluate the fit for a role based on the job description.

    Provide the following details based on the resume:

    - **First Name**: (If available)
    - **Last Name**: (If available)
    - **Location**: (If available)
    - **Designation**: (Current job title or designation if mentioned)
    - **Email**: (If available)
    - **Phone**: (If available)
    - **Recommendation**: Based on fit, provide a recommendation message.
    - **Score**: Numeric score for job fit out of 100.

    Additionally, evaluate the following:
    
    1. **Strengths**: A list of strengths based on the resume content.
    2. **Weaknesses**: A list of weaknesses or areas where improvement is needed.
    3. **Skills and Proficiency**: Assign a numeric value out of 100 for each relevant technical skill (e.g., Python, React, SQL, Machine Learning).

    Resume Content:
    ${resumeText}

    Your response format should be:

    - **First Name**: [first name or "N/A"]
    - **Last Name**: [last name or "N/A"]
    - **Location**: [location or "N/A"]
    - **Designation**: [designation or "N/A"]
    - **Email**: [email or "N/A"]
    - **Phone**: [phone or "N/A"]
    - **Recommendation**: [recommendation based on score]
    - **Score**: [numeric score]

    Followed by:

    - **Strengths**: [list of strengths]
    - **Weaknesses**: [list of weaknesses]
    - **Skills and Proficiency**: [skill1: proficiency, skill2: proficiency, skill3: proficiency, ...]
  `;

  try {
    const chatSession = genAIModel.startChat({
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);

    const response = result.response.text();

    // Extract each field from the response using regex
    const firstName =
      response.match(/(?<=\*\*First Name\*\*:\s*)(.*)(?=\n)/i)?.[0]?.trim() ||
      "N/A";
    const lastName =
      response.match(/(?<=\*\*Last Name\*\*:\s*)(.*)(?=\n)/i)?.[0]?.trim() ||
      "N/A";
    const location =
      response.match(/(?<=\*\*Location\*\*:\s*)(.*)(?=\n)/i)?.[0]?.trim() ||
      "N/A";
    const designation =
      response.match(/(?<=\*\*Designation\*\*:\s*)(.*)(?=\n)/i)?.[0]?.trim() ||
      "N/A";
    const email =
      response.match(/(?<=\*\*Email\*\*:\s*)(.*)(?=\n)/i)?.[0]?.trim() || "N/A";
    const phone =
      response.match(/(?<=\*\*Phone\*\*:\s*)(.*)(?=\n)/i)?.[0]?.trim() || "N/A";
    const recommendation =
      response
        .match(/(?<=\*\*Recommendation\*\*:\s*)(.*)(?=\n)/i)?.[0]
        ?.trim() || "No recommendation provided.";
    const score =
      parseInt(response.match(/(?<=\*\*Score\*\*:\s*)(\d+)/i)?.[0], 10) ||
      "N/A";

    // Parse strengths, weaknesses, and skills as before
    const strengthsMatch = response.match(
      /(?<=\*\*Strengths\*\*:\s*)([\s\S]+?)(?=\*\*Weaknesses\*\*:)/i
    );
    const weaknessesMatch = response.match(
      /(?<=\*\*Weaknesses\*\*:\s*)([\s\S]+?)(?=\*\*Skills and Proficiency\*\*:)/i
    );
    const skillsMatch = response.match(
      /(?<=\*\*Skills and Proficiency\*\*:\s*)([\s\S]+)/i
    );

    const strengths = strengthsMatch
      ? strengthsMatch[0].split(/\s*-\s+/).filter((s) => s.trim())
      : ["No specific strengths identified."];
    const weaknesses = weaknessesMatch
      ? weaknessesMatch[0].split(/\s*-\s+/).filter((w) => w.trim())
      : ["No specific weaknesses identified."];
    const skills = skillsMatch
      ? skillsMatch[0]
          .split(/\n+/)
          .map((skill) => {
            const match = skill.match(/([\w\s\(\)]+):\s*(\d+)/);
            return match
              ? {
                  skillName: match[1].trim(),
                  skillLevel: parseInt(match[2], 10),
                }
              : null;
          })
          .filter(Boolean)
      : [{ skillName: "No skills identified", skillLevel: 0 }];

    return {
      firstName,
      lastName,
      location,
      designation,
      email,
      phone,
      recommendation,
      score,
      jobCompany,
      strengths,
      weaknesses,
      skills,
    };
  } catch (error) {
    console.error("Error fetching LLM evaluation:", error);
    return {
      firstName: "N/A",
      lastName: "N/A",
      location: "N/A",
      designation: "N/A",
      email: "N/A",
      phone: "N/A",
      recommendation: "Unable to retrieve recommendation.",
      score: "N/A",
      jobCompany,
      strengths: ["Unable to retrieve strengths."],
      weaknesses: ["Unable to retrieve weaknesses."],
      skills: [{ skillName: "Error fetching skills", skillLevel: 0 }],
    };
  }
}

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
