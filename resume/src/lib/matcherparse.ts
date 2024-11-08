import { EvaluationDetails } from "@/types/matcher";

// Preprocess and clean the evaluationResponse string by removing the ```json syntax
export const preprocessCleanedEvaluationResponse = (evaluationResponse: string | undefined): string => {
  if (!evaluationResponse) {
    return ""; // Return an empty string if evaluationResponse is undefined or null
  }
  return evaluationResponse.replace(/^```json\s*|\s*```$/gi, "").trim();
};
  
// Safely parse the cleaned JSON string into EvaluationDetails
export const safeParseJson = (str: string): EvaluationDetails => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Invalid JSON string:", str, e);
    // Return a default EvaluationDetails object if parsing fails
    const evaluation: EvaluationDetails = {
      scores: {
        relevance: 0,
        skills: 0,
        experience: 0,
        presentation: 0,
      },
      compositeScore: 0,
      recommendation: "Something went wrong with the recommendation",
      isfit: false,
    };
    return evaluation;
  }
};

// Helper function to parse and clean evaluation response
export const parseEvaluationResponse = (evaluationResponse: string | EvaluationDetails): EvaluationDetails => {
  // If the response is an object, convert it to a JSON string
  const cleanedResponse = typeof evaluationResponse === 'string'
    ? preprocessCleanedEvaluationResponse(evaluationResponse)
    : JSON.stringify(evaluationResponse);

  return safeParseJson(cleanedResponse);
};
