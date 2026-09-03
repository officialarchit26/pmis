// Gemini AI Service
// Handles communication with Google's Gemini API

async function askGemini(userMessage, context = '') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  // Build prompt
  const systemPrompt = `You are an AI assistant for Project Pulse, a government project monitoring platform.
You help administrators and officers understand their project data.

${context ? `Here is the project data context:\n${context}\n` : ''}

Instructions:
- Answer concisely and accurately based on the data provided
- If you don't have enough information, say so
- Be helpful and professional
- Format responses clearly with bullet points or short paragraphs
- Do not make up information that isn't in the context`;

  const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

  try {
    // Try gemini-1.5-flash first (more widely available)
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: fullPrompt }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
          }
        }
        // If not ok, try next model
      } catch (modelError) {
        // Try next model
        continue;
      }
    }

    throw new Error('All Gemini models failed');
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw error;
  }
}

module.exports = {
  askGemini
};
