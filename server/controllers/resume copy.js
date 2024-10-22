import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";

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

  try {
    // Extract resume text (assuming it's in plain text format)
    const resumeText = resumeFile.buffer.toString('utf-8');

    // Step 1: Text Splitting for Embeddings with Document objects
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 500, chunkOverlap: 50 });
    const resumeDoc = new Document({ pageContent: resumeText });
    const jobDescriptionDoc = new Document({ pageContent: jobDescription });

    const resumeChunks = await splitter.splitDocuments([resumeDoc]);
    const jobDescriptionChunks = await splitter.splitDocuments([jobDescriptionDoc]);

    // Extract text content from the split Document objects
    const resumeTexts = resumeChunks.map(chunk => chunk.pageContent);
    const jobDescriptionTexts = jobDescriptionChunks.map(chunk => chunk.pageContent);

    // Generate embeddings for each chunk
    const resumeEmbeddings = await getEmbeddingsForChunks(resumeTexts);
    const jobDescriptionEmbeddings = await getEmbeddingsForChunks(jobDescriptionTexts);

    // Step 2: Calculate Cosine Similarity Score
    const averageSimilarityScore = calculateAverageSimilarity(resumeEmbeddings, jobDescriptionEmbeddings);

    // Step 3: Calculate ATS Keyword Match Score
    const atsScore = calculateATSScore(resumeText, jobDescription);

    // Step 4: Composite Score Calculation
    const finalScore = (averageSimilarityScore * 0.7) + (atsScore * 0.3);

    // Step 5: Generate an Answer from LLM Based on the Evaluation Prompt
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

// Helper function to calculate average cosine similarity between two sets of embeddings
function calculateAverageSimilarity(resumeEmbeddings, jobDescriptionEmbeddings) {
  let totalSimilarityScore = 0;
  resumeEmbeddings.forEach(resumeEmbed => {
    jobDescriptionEmbeddings.forEach(jobEmbed => {
      totalSimilarityScore += cosineSimilarity(resumeEmbed, jobEmbed);
    });
  });
  return totalSimilarityScore / (resumeEmbeddings.length * jobDescriptionEmbeddings.length);
}

// Helper function to get an LLM-based evaluation using the chat completions endpoint
async function getLLMEvaluation(resumeText, jobDescription) {
    const messages = [
      { role: "system", content: "You are an expert in evaluating resumes for job descriptions." },
      { role: "user", content: `
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
      ` }
    ];
  
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4', // or 'gpt-3.5-turbo' depending on your subscription level
        messages: messages,
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
    .replace(/[^a-z\s]/g, '') // Remove non-alphabetical characters
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 2) // Filter out short, common words
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
