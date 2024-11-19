import { resume_evaluation_schema, resume_matchschema } from "../models/gemini.js";
import { genAI } from "../utils/chatAI.js";
import { isValidJSON } from "../helpers/utils.js";

export async function getLLMEvaluation(resumeText, jobDescription, fitThreshold) {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: resume_matchschema,
      },
    });
    const prompt = `
    Evaluate the following resume against the job description. For each criterion, provide a score out of 100:
    - Relevance to the job role
    - Skills and expertise
    - Experience level
    - Presentation and clarity
  
    Use a positive and supportive scoring approach, emphasizing strengths and giving the benefit of the doubt for minor gaps. Aim to highlight areas where the candidate shows potential even if direct experience or skills are slightly lacking.
  
    For the composite score, calculate it based on the following weightages:
    - Relevance: 20%
    - Skills: 35%
    - Experience: 35%
    - Presentation: 10%
  
    Ensure that the composite score leans towards fit unless there are major discrepancies.
  
    Resume:
    ${resumeText}
  
    Job Description:
    ${jobDescription}
  
    Note: 
    Respond strictly in the following JSON format:
    {
      "scores": {
        "relevance": <score>,
        "skills": <score>,
        "experience": <score>,
        "presentation": <score>
      },
      "compositeScore": <weighted score>,
      "recommendation": "<one concise suggestion if applicable>",
      "isfit": true/false
    }
  `;
  
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
  
      // If response is not valid JSON, resend the request
      if (!isValidJSON(response)) {
        console.warn("Response was not in JSON format. Resending request.");
        response = await chatSession.sendMessage(
          prompt + "\n\nPlease ensure your response is in valid JSON format."
        );
        response = response.response.text().trim();
      }
  
      // Parse the validated JSON response
      const jsonResponse = JSON.parse(response);
  
      return {
        evaluationText: response,
        scores: jsonResponse.scores,
        compositeScore: jsonResponse.compositeScore,
        recommendation: jsonResponse.recommendation,
        isfit: jsonResponse.isfit,
      };
    } catch (error) {
      console.error("Error during evaluation:", error.message);
  
      return {
        evaluationText: "Evaluation results not found.",
        scores: {
          relevance: 0,
          skills: 0,
          experience: 0,
          presentation: 0,
        },
        compositeScore: 0,
        recommendation: null,
        isfit: false,
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
    
    - Strengths: A list of strengths based on the resume content.
    - Weaknesses: A list of weaknesses or areas where improvement is needed.
    - Skills and Proficiency: Assign a numeric value out of 100 for each relevant technical skill. For example, Python, React, Machine Learning, SQL, etc.

    Resume Content:
    ${resumeText}

    Your response format should be in JSON as follows:
    {
      "strengths": ["list of strengths"],
      "weaknesses": ["list of weaknesses"],
      "skills": [
        {"skillName": "Python", "skillLevel": 85},
        {"skillName": "React", "skillLevel": 70}
        ...
      ]
    }
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: resume_evaluation_schema,
      },
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Check if the response is valid JSON and parse it
    let responseJson = isValidJSON(text) ? JSON.parse(text) : null;

    // Retry once if the response is not valid JSON
    if (!responseJson) {
      console.log("Retrying API call due to invalid JSON response...");
      const retryResult = await model.generateContent(prompt);
      text = retryResult.response.text();
      responseJson = isValidJSON(text) ? JSON.parse(text) : null;
    }

    // Validate the JSON structure
    if (
      responseJson.strengths &&
      Array.isArray(responseJson.strengths) &&
      responseJson.weaknesses &&
      Array.isArray(responseJson.weaknesses) &&
      responseJson.skills &&
      Array.isArray(responseJson.skills)
    ) {
      return responseJson;
    } else {
      throw new Error("Invalid response format from LLM");
    }
  } catch (error) {
    console.error("Error fetching LLM evaluation:", error);
    return {
      strengths: ["Unable to retrieve strengths."],
      weaknesses: ["Unable to retrieve weaknesses."],
      skills: [{ skillName: "Error fetching skills", skillLevel: 0 }],
    };
  }
}


