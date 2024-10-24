import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from "fs";
import os from "os";
import path from "path";
import { ResumeAnalysis } from "../models/resumeanalysis.js";
import { SkillProgress } from "../models/skill.js";
import { genAIModel, openai } from "../utils/chatAI.js";
import { ObjectId } from 'mongodb';

import { Job } from "../models/job.js";

export const matcher = async (req, res) => {
  const jobDescription = req.body.jobDescription;
  const resumeFile = req.file;
  const fitThreshold = 70; // Define threshold here

  if (!resumeFile || !jobDescription) {
    return res
      .status(400)
      .json({ error: "Resume file and job description are required." });
  }

  const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-resume.pdf`);

  try {
    fs.writeFileSync(tempFilePath, resumeFile.buffer);

    const pdfLoader = new PDFLoader(tempFilePath);
    const resumeDocs = await pdfLoader.load();
    const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

    // Pass fitThreshold to getLLMEvaluation
    const { evaluationText, score } = await getLLMEvaluation(
      resumeText,
      jobDescription,
      fitThreshold
    );

    let resultMessage;
    if (score !== null && score >= fitThreshold) {
      resultMessage = `You are a good fit for this role with a score of ${score}%.`;
    } else {
      resultMessage = `You are not a perfect fit for this role with a score of ${score}%. Please refer to the suggestions below for improving your application:\n\n${evaluationText}`;
    }

    res.json({
      matchResult: resultMessage,
      evaluationResponse: evaluationText,
    });
  } catch (error) {
    console.error("Error processing resume match:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the resume match." });
  } finally {
    fs.unlinkSync(tempFilePath);
  }
};

export const stats = async (req, res) => {
  const resumeFile = req.file;
  const { userId } = req.body; // Assuming userId is passed in the request body

  if (!resumeFile) {
    return res.status(400).json({ error: "Resume file is required." });
  }

  const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-resume.pdf`);

  try {
    // Write the uploaded resume file to a temporary path
    fs.writeFileSync(tempFilePath, resumeFile.buffer);

    // Load and extract text from the resume PDF
    const pdfLoader = new PDFLoader(tempFilePath);
    const resumeDocs = await pdfLoader.load();
    const resumeText = resumeDocs.map((doc) => doc.pageContent).join(" ");

    // Get LLM evaluation results (strengths, weaknesses, skills)
    const { evaluationText, strengths, weaknesses, skills } =
      await getLLMEvaluationStats(resumeText);

    // Check if a resume analysis record exists for the user
    let resumeAnalysis = await ResumeAnalysis.findOne({ userId });

    if (resumeAnalysis) {
      // Update the existing resume analysis record
      resumeAnalysis.strengths = strengths;
      resumeAnalysis.weaknesses = weaknesses;
      resumeAnalysis.evaluatedAt = new Date(); // Update the evaluation date
    } else {
      // Create a new resume analysis record if not found
      resumeAnalysis = new ResumeAnalysis({
        userId,
        strengths,
        weaknesses,
      });
    }

    await resumeAnalysis.save(); // Save the updated or new record

    // Check if skill progress record exists for the user
    let skillProgress = await SkillProgress.findOne({ userId });

    if (skillProgress) {
      // Update the existing skill progress record
      skillProgress.skills = skills.map((skill) => ({
        skillName: skill.skillName,
        skillLevel: skill.skillLevel,
      }));
      skillProgress.evaluatedAt = new Date(); // Update the evaluation date
    } else {
      // Create a new skill progress record if not found
      skillProgress = new SkillProgress({
        userId,
        skills: skills.map((skill) => ({
          skillName: skill.skillName,
          skillLevel: skill.skillLevel,
        })),
      });
    }

    await skillProgress.save(); // Save the updated or new record

    // Send response back to the client
    res.json({
      success: true,
      message: "Resume analysis and skill progress data saved successfully!",
      data: {
        resumeAnalysis: {
          strengths,
          weaknesses,
        },
        skillProgress: skills,
      },
    });
  } catch (error) {
    console.error("Error processing resume:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the resume." });
  } finally {
    // Remove the temporary resume file after processing
    fs.unlinkSync(tempFilePath);
  }
};

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

async function getLLMEvaluation(resumeText, jobDescription, fitThreshold) {
  const prompt = `
    Evaluate the following resume against the job description. For each criterion, provide a numerical score out of 100:
    - Relevance to the job role
    - Skills and expertise
    - Experience level
    - Presentation and clarity

    List each score only once. After listing these, provide a single composite score. If the composite score is below ${fitThreshold}, give one recommendation on how to improve. **Do not repeat any of the criteria, scores, or recommendations. Stop after the recommendation.**

    Format example:
    - Relevance: 80%
    - Skills: 75%
    - Experience: 60%
    - Presentation: 90%
    - Composite Score: 76%
    - Recommendation: [One sentence only, if needed]

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}

    Output format:
    - Scores for each criterion
    - Composite Score
    - One recommendation if applicable
  `;
  try {
    const chatSession = genAIModel.startChat({
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);

    const response = result.response.text();

    const scoreMatch = response.match(/Composite Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    return { evaluationText: response, score };
  } catch (error) {
    console.error("Error fetching LLM evaluation:", error);
    return {
      evaluationText:
        "Evaluation and improvement suggestions are not available.",
      score: null,
    };
  }
}

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

    // Log raw response for debugging
    console.log(
      "Raw Response for Debugging:",
      JSON.stringify(response, null, 2)
    );

    // Updated regex to handle potential hidden spaces or line breaks
    const strengthsMatch = response.match(
      /(?<=\*\*Strengths\*\*:\s*)([\s\S]+?)(?=\*\*Weaknesses\*\*:)/
    );
    const weaknessesMatch = response.match(
      /(?<=\*\*Weaknesses\*\*:\s*)([\s\S]+?)(?=\*\*Skills and Proficiency\*\*:)/
    );
    const skillsMatch = response.match(
      /(?<=\*\*Skills and Proficiency\*\*:\s*)([\s\S]+)/
    );

    // Log matches for debugging
    console.log("Strengths Match:", strengthsMatch);
    console.log("Weaknesses Match:", weaknessesMatch);
    console.log("Skills Match:", skillsMatch);

    // Parsing strengths, weaknesses, and skills into arrays
    const strengths =
      strengthsMatch && strengthsMatch[0].trim()
        ? strengthsMatch[0].split(/\n\s*\d+\.\s*/).filter((s) => s.trim()) // Split by numbers (1., 2., etc.)
        : ["No specific strengths identified."];

    const weaknesses =
      weaknessesMatch && weaknessesMatch[0].trim()
        ? weaknessesMatch[0].split(/\n\s*\d+\.\s*/).filter((w) => w.trim()) // Split by numbers (1., 2., etc.)
        : ["No specific weaknesses identified."];

    // Updated skills parsing
    const skills =
      skillsMatch && skillsMatch[0].trim()
        ? skillsMatch[0]
            .split(/\n\s*\d+\.\s*/)
            .map((skill) => {
              const match = skill.match(/([\w\s\(\)]+):\s*(\d+)/); // Capture skill name and level
              if (match) {
                const skillName = match[1].trim();
                const skillLevel = parseInt(match[2], 10);
                return { skillName, skillLevel };
              }
              return null;
            })
            .filter(Boolean) // Remove any null values
        : [{ skillName: "No skills identified", skillLevel: 0 }];

    console.log("Parsed Strengths:", strengths);
    console.log("Parsed Weaknesses:", weaknesses);
    console.log("Parsed Skills:", skills);

    return {
      evaluationText: response,
      strengths,
      weaknesses,
      skills,
    };
  } catch (error) {
    console.error("Error fetching LLM evaluation:", error);
    return {
      evaluationText: "An error occurred while processing the evaluation.",
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
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Convert userId to ObjectId since it's stored as ObjectId in the database
    const userObjectId = new ObjectId(userId);

    // Aggregate job statuses by userId
    const statusCount = await Job.aggregate([
      { $match: { userId: userObjectId } }, // Match userId as ObjectId
      { 
        $group: { 
          _id: "$status", 
          count: { $sum: 1 } 
        } 
      }
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
    res.status(500).json({ message: 'Error retrieving job status count', error });
  }
};

