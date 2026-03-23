import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handleAICallAnalysis(text: string) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    // Return mock data if no real key is configured
    return {
      sentiment: 'neutral',
      suggestedAction: 'Please configure OpenAI API Key in .env for real analysis.',
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant analyzing a live sales call. Based on the following customer input, provide a brief sentiment analysis (positive, neutral, negative) and one suggested action for the agent.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      response_format: { type: "json_object" },
      // Instruct model to return JSON
      // e.g. { "sentiment": "positive", "suggestedAction": "Ask about budget" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      sentiment: result.sentiment || 'neutral',
      suggestedAction: result.suggestedAction || 'Continue listening actively.',
    };
  } catch (error) {
    console.error('OpenAI Error:', error);
    return {
      sentiment: 'neutral',
      suggestedAction: 'Error analyzing conversation.',
    };
  }
}
