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

  if (!resumeFile || !jobDescription) {
    return res.status(400).json({ error: 'Resume file and job description are required.' });
  }

  // Create a temporary file path for the PDF
  const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-resume.pdf`);

  try {
    // Write the buffer to a temporary file
    fs.writeFileSync(tempFilePath, resumeFile.buffer);

    // Load the PDF file using the temporary file path
    const pdfLoader = new PDFLoader(tempFilePath);
    const resumeDocs = await pdfLoader.load();

    // Extract text from the loaded document
    const resumeText = resumeDocs.map(doc => doc.pageContent).join(" ");

    // Split text into chunks for embeddings
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const splitResumeDocs = await textSplitter.splitDocuments([new Document({ pageContent: resumeText })]);
    const resumeTexts = splitResumeDocs.map(chunk => chunk.pageContent);

    // Split job description
    const jobDescriptionDoc = new Document({ pageContent: jobDescription });
    const splitJobDescriptionDocs = await textSplitter.splitDocuments([jobDescriptionDoc]);
    const jobDescriptionTexts = splitJobDescriptionDocs.map(chunk => chunk.pageContent);

    // Generate embeddings for resume and job description chunks
    const resumeEmbeddings = await getEmbeddingsForChunks(resumeTexts);
    const jobDescriptionEmbeddings = await getEmbeddingsForChunks(jobDescriptionTexts);

    // Calculate similarity and ATS score
    const averageSimilarityScore = calculateAverageSimilarity(resumeEmbeddings, jobDescriptionEmbeddings);
    const atsScore = calculateATSScore(resumeText, jobDescription);
    const finalScore = (averageSimilarityScore * 0.7) + (atsScore * 0.3);

    // Get LLM evaluation
    const evaluationResponse = await getLLMEvaluation(resumeText, jobDescription);

    // Return the results
    res.json({
      matchResult: `Composite Score: ${(finalScore * 100).toFixed(2)}%`,
      details: { averageSimilarityScore, atsScore },
      evaluationResponse
    });

  } catch (error) {
    console.error('Error processing resume match:', error);
    res.status(500).json({ error: 'An error occurred while processing the resume match.' });
  } finally {
    // Clean up the temporary file
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

// Helper function to get an LLM-based evaluation
async function getLLMEvaluation(resumeText, jobDescription) {
  const prompt = `
    Based on the following resume and job description, provide a detailed evaluation in terms of:
    - Relevance to the job role
    - Skills and expertise
    - Experience level
    - Overall presentation and clarity

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}

    Evaluation:
  `;
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error fetching LLM evaluation:', error);
    return "Evaluation not available.";
  }
}

// Helper function to calculate ATS Keyword Match Score
function calculateATSScore(resumeText, jobDescription) {
  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);

  let matchedKeywords = 0;
  jobKeywords.forEach(keyword => {
    if (resumeKeywords.includes(keyword)) {
      matchedKeywords += 1;
    }
  });

  return matchedKeywords / jobKeywords.length;
}

// Helper function to extract keywords
function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .reduce((acc, word) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, []);
}

// Helper function to calculate Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((acc, value, i) => acc + value * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, value) => acc + value ** 2, 0));
  const normB = Math.sqrt(vecB.reduce((acc, value) => acc + value ** 2, 0));
  return dotProduct / (normA * normB);
}

// Helper function to calculate average similarity
function calculateAverageSimilarity(resumeEmbeddings, jobDescriptionEmbeddings) {
  let totalSimilarityScore = 0;
  resumeEmbeddings.forEach(resumeEmbed => {
    jobDescriptionEmbeddings.forEach(jobEmbed => {
      totalSimilarityScore += cosineSimilarity(resumeEmbed, jobEmbed);
    });
  });
  return totalSimilarityScore / (resumeEmbeddings.length * jobDescriptionEmbeddings.length);
}
