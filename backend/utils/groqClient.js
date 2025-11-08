const { GroqClient } = require('groq-sdk');
const logger = require('./logger');

const groqClient = new GroqClient({
  apiKey: process.env.GROQ_API_KEY
});

const generatePrompt = (text, type) => {
  switch (type) {
    case 'suggest':
      return `Find similar questions to: "${text}"
Please provide 3 similar questions that have been commonly asked in programming forums.
Format the response as a JSON array of strings.
Each suggestion should be clear and concise, focusing on the core problem.`;
    
    case 'summarize':
      return `Summarize the following discussion thread:

${text}

Please provide a concise summary that includes:
1. The main question/problem
2. Key points from the discussion
3. The solution (if provided)
Format the response in a clear, structured way.
Keep it under 250 words.`;
    
    default:
      return text;
  }
};

const generateAIResponse = async (text, type = 'general') => {
  try {
    const prompt = generatePrompt(text, type);
    
    const response = await groqClient.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: type === 'summarize' ? 500 : 150,
      top_p: 1,
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Groq AI API Error:', error);
    throw new Error('Failed to generate AI response');
  }
};

module.exports = {
  groqClient,
  generateAIResponse
};
