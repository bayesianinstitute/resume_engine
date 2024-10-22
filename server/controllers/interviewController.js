import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generatePreparationResources = async (req, res) => {
  const { jobDescription } = req.body;

  if (!jobDescription) {
    return res.status(400).json({ error: 'Job description is required.' });
  }

  try {
    const prompt = `
      Based on the following job description, generate a list of key skills, potential interview questions, and preparation tips specific to this role. The output should be structured as follows:

      - Key Skills: [list of key skills]
      - Interview Questions: [list of likely interview questions]
      - Preparation Tips: [list of preparation tips]

      Job Description:
      ${jobDescription}
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const preparationResources = completion.choices[0].message.content.trim();
    console.log("Preparation",preparationResources);
    res.json({ preparationResources });
  } catch (error) {
    console.error('Error generating interview preparation resources:', error);
    res.status(500).json({ error: 'An error occurred while generating interview preparation resources.' });
  }
};
