import OpenAI from "openai";
import dotnet from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotnet.config();

// Initialize OpenAI with API key
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Check if the environment variable GEMINI_API_KEY is defined
if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not defined in the environment variables.");
  process.exit(1); // Exit the process with an error code
}

// Proceed with the rest of the script
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const genAIModel = genAI.getGenerativeModel({ model: "gemini-pro" });