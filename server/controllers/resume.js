import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize OpenAI with API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const matcher = async (req, res) => {
  const jobDescription = req.body.jobDescription;
  const resumeFile = req.file;
  const fitThreshold = 70; // Define threshold here

  if (!resumeFile || !jobDescription) {
    return res.status(400).json({ error: 'Resume file and job description are required.' });
  }

  const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-resume.pdf`);

  try {
    fs.writeFileSync(tempFilePath, resumeFile.buffer);

    const pdfLoader = new PDFLoader(tempFilePath);
    const resumeDocs = await pdfLoader.load();
    const resumeText = resumeDocs.map(doc => doc.pageContent).join(" ");

    // Pass fitThreshold to getLLMEvaluation
    const { evaluationText, score } = await getLLMEvaluation(resumeText, jobDescription, fitThreshold);

    let resultMessage;
    if (score !== null && score >= fitThreshold) {
      resultMessage = `You are a good fit for this role with a score of ${score}%.`;
    } else {
      resultMessage = `You are not a perfect fit for this role with a score of ${score}%. Please refer to the suggestions below for improving your application:\n\n${evaluationText}`;
    }

    res.json({
      matchResult: resultMessage,
      evaluationResponse: evaluationText
    });

  } catch (error) {
    console.error('Error processing resume match:', error);
    res.status(500).json({ error: 'An error occurred while processing the resume match.' });
  } finally {
    fs.unlinkSync(tempFilePath);
  }
};



// Helper function to get embeddings for text chunks
async function getEmbeddingsForChunks(chunks) {
  try {
    const embeddingsResponses = await Promise.all(
      chunks.map(chunk => openai.embeddings.create({ model: 'text-embedding-ada-002', input: chunk }))
    );
    return embeddingsResponses.map(response => response.data[0].embedding);
  } catch (error) {
    console.error('Error fetching embeddings:', error);
    throw new Error('Failed to fetch embeddings');
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.5, // Lower temperature for more concise and deterministic output
    });
    
    const response = completion.choices[0].message.content.trim();
    const scoreMatch = response.match(/Composite Score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;
    
    return { evaluationText: response, score };
  } catch (error) {
    console.error('Error fetching LLM evaluation:', error);
    return { evaluationText: "Evaluation and improvement suggestions are not available.", score: null };
  }
}




