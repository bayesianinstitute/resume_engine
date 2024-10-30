import { genAIModel } from "../utils/chatAI.js";

// genAIModel
export const generatePreparationResources = async (req, res) => {
  const { jobDescription } = req.body;

  if (!jobDescription) {
    return res.status(400).json({ error: "Job description is required." });
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
    const chatSession = genAIModel.startChat({
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);

    const preparationResources = result.response.text();
    res.json({ preparationResources });
  } catch (error) {
    console.error("Error generating interview preparation resources:", error);
    res
      .status(500)
      .json({
        error:
          "An error occurred while generating interview preparation resources.",
      });
  }
};
