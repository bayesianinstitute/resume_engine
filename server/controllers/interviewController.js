import { TryCatch } from "../middleware/error.js";
import { preparationResourcesSchema } from "../models/gemini.js";
import { genAI } from "../utils/chatAI.js";
import ErrorHandler from "../utils/utitlity.js";

// genAIModel
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: preparationResourcesSchema,
  },
});
export const generatePreparationResources = TryCatch(async (req, res, next) => {
  const { jobDescription } = req.body;

  if (!jobDescription) {
    return next(
      new ErrorHandler("Job description is required", 400)
    );
  }

const prompt = `
Based on the following job description, generate a list of key skills, potential interview questions, and preparation tips specific to this role. The output should be structured as follows:

- Key Skills: [list of key skills]  - what i should prepare for this role
- Interview Questions: [list of likely interview questions]-  give me example interview questions
- Preparation Tips: [list of preparation tips] 

Job Description:
${jobDescription}
`;


  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({data: response,message:"Successfully Generated Interview Question",success: true});
  } catch (error) {
    console.error("Error generating interview preparation resources:", error);
    return next(new ErrorHandler("An error occurred while generating interview preparation resources.",500))

  }
});
