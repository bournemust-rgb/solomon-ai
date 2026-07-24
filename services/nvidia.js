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
    const response = await nvidia.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Extract JSON only: {"weight_kg": number|null, "colour": string|null, "category": "security"|"sheet"|"auto"|null}. Return ONLY valid JSON. No explanation.'
        },
        { role: 'user', content: text }
      ]
    });
    const content = response.choices[0].message.content;
    console.log('📦 NIM Raw:', content);
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ NIM Error:', error.message);
    return null;
  }
}

async function analyzeCoatingImage(base64Jpeg) {
  if (!nvidia) return null;
  try {
    const response = await nvidia.chat.completions.create({
      model: 'meta/llama-3.2-11b-vision-instruct',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Gate, fence, sheet, rim? Colour? Rust? One sentence.' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` } }
        ]
      }]
    });
    return response.choices[0].message.content;
  } catch {
    return null;
  }
}

module.exports = { parseQuoteIntent, analyzeCoatingImage };
