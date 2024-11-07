// Import necessary modules
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// Initialize Google Generative AI with API key
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Define schema for evaluation response
const schema = {
  description: "Evaluation of resume against job description",
  type: SchemaType.OBJECT,
  properties: {
    scores: {
      type: SchemaType.OBJECT,
      properties: {
        relevance: { type: SchemaType.NUMBER, description: "Score for relevance to job role" },
        skills: { type: SchemaType.NUMBER, description: "Score for skills and expertise" },
        experience: { type: SchemaType.NUMBER, description: "Score for experience level" },
        presentation: { type: SchemaType.NUMBER, description: "Score for presentation and clarity" }
      },
      required: ["relevance", "skills", "experience", "presentation"]
    },
    compositeScore: { type: SchemaType.NUMBER, description: "Overall composite score" },
    recommendation: { type: SchemaType.STRING, description: "Improvement suggestion if composite score is below threshold" },
    isfit: { type: SchemaType.BOOLEAN, description: "Indicates if the resume meets the fit threshold" }
  },
  required: ["scores", "compositeScore", "recommendation", "isfit"]
};

// Define model with schema and prompt generation configuration
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

// Define prompt for evaluation
const generateEvaluation = async (resumeText, jobDescription, fitThreshold) => {
  const prompt = `
    Evaluate the following resume against the job description. For each criterion, provide a score out of 100:
    - Relevance to the job role
    - Skills and expertise
    - Experience level
    - Presentation and clarity

    Also, calculate a composite score. If the composite score is below ${fitThreshold}, include a recommendation for improvement.

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
      "compositeScore": <score>,
      "recommendation": "<one concise suggestion if applicable>",
      "isfit": true/false
    }
  `;

  try {
    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log(response);
  } catch (error) {
    console.error("Error generating content:", error.message);
  }
};

const resume=`
John Doe
Email: john.doe@example.com | Phone: (123) 456-7890

Professional Summary:
Software engineer with 5+ years of experience in developing scalable web applications. Proficient in JavaScript, Python, and cloud services. Passionate about building robust backend systems and improving code efficiency.

Experience:
- Software Engineer at Tech Solutions Inc. (2019 - Present)
  - Developed and maintained scalable web applications using JavaScript, Node.js, and MongoDB.
  - Collaborated with cross-functional teams to enhance application performance, achieving a 30% improvement in load times.
  - Implemented RESTful APIs and optimized existing code, reducing server response time by 20%.

- Junior Developer at Web Innovators (2017 - 2019)
  - Assisted in the development of front-end features using React.js and CSS.
  - Participated in code reviews and contributed to improving project documentation.

Skills:
- Programming Languages: JavaScript, Python, Java
- Web Technologies: React.js, Node.js, HTML, CSS
- Databases: MongoDB, MySQL
- Tools: Git, Docker, Jenkins
- Cloud Services: AWS, Google Cloud

Education:
Bachelor of Science in Computer Science
University of XYZ, 2016

`
const JD=`
Position: Software Engineer

We are seeking a skilled Software Engineer to join our team. The ideal candidate should have experience in developing and maintaining web applications, strong problem-solving skills, and the ability to work in a collaborative environment. Candidates with a background in backend development, API integration, and cloud technologies will be given priority.

Responsibilities:
- Design, develop, and maintain scalable web applications
- Collaborate with front-end developers and other team members to improve overall product performance
- Write clean, efficient, and maintainable code
- Troubleshoot, test, and deploy applications and databases to ensure optimal performance
- Work with cloud services such as AWS or Google Cloud for application deployment

Requirements:
- Proficiency in JavaScript, Python, or a similar programming language
- Experience with RESTful API development and database management
- Familiarity with cloud platforms like AWS or Google Cloud
- Strong understanding of version control systems, preferably Git
- Excellent communication skills and a team-player attitude
- Bachelor’s degree in Computer Science or a related field

`
// Example usage
generateEvaluation(resume, JD, 70);
