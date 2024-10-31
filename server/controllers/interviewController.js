import { TryCatch } from "../middleware/error.js";
import { genAIModel } from "../utils/chatAI.js";
import ErrorHandler from "../utils/utitlity.js";

// genAIModel
export const generatePreparationResources = TryCatch(async (req, res, next) => {
  const { jobDescription } = req.body;

  if (!jobDescription) {
    return next(
      new ErrorHandler("Job description is required", 400)
    );
  }
//   const prompt = `
//   Based on the following job description, generate a comprehensive guide to help the user prepare for their interview. The output should be structured as follows:

//   1. **Key Skills**: 
//      - Provide a detailed list of essential skills required for this role. 
//      - Include explanations of why each skill is important for success in this position.

//   2. **Interview Questions**: 
//      - Generate a diverse list of at least **15 to 20 likely interview questions** for each categorized into the following types:
//        - **Technical Questions**: Focused on the specific technical skills and knowledge required for the role.
//        - **Behavioral Questions**: Aimed at understanding the candidate's past experiences and interpersonal skills.
//        - **Situational Questions**: Designed to assess how the candidate might handle hypothetical scenarios relevant to the role.

//   3. **Preparation Tips**: 
//      - Offer actionable tips and resources for preparing effectively for the interview.
//      - Include suggestions on how to research the company, practice responses, and any recommended study materials.

//   **Job Description**:
//   ${jobDescription}
// `;
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
    res.json({data: preparationResources,message:"Successfully Generated Interview Question",success: true});
  } catch (error) {
    console.error("Error generating interview preparation resources:", error);
    return next(new ErrorHandler("An error occurred while generating interview preparation resources.",500))

  }
});
