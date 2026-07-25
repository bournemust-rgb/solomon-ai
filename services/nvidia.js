const OpenAI = require('openai');

const nvidia = process.env.NVIDIA_API_KEY
  ? new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1'
    })
  : null;

async function parseQuoteIntent(text) {
  if (!nvidia) return null;
  try {
    const r = await nvidia.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Extract JSON only: {"weight_kg":number|null,"colour":string|null,"category":"security"|"sheet"|"auto"|null}'
        },
        { role: 'user', content: text }
      ]
    });
    return JSON.parse(r.choices[0].message.content);
  } catch {
    return null;
  }
}

async function askLLM(question) {
  if (!nvidia) return null;
  try {
    const r = await nvidia.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You are Solomon Coatings, a powder coating business in Cape Town. You do quotes for gates, fences, sheet metal, and rims. Prices: R17/kg B/W, R20/kg premium colours. Minimum charge R200 B/W, R250 premium. Never make up prices for things you dont coat. Be helpful and direct.'
        },
        { role: 'user', content: question }
      ]
    });
    return r.choices[0].message.content;
  } catch {
    return null;
  }
}

module.exports = { parseQuoteIntent, askLLM };
