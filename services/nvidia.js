// ============================================================
// services/nvidia.js - NVIDIA NIM for Solomon BIT
// ============================================================
const OpenAI = require('openai');

// Hardcoded for testing - will use env in production
const apiKey = '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';

console.log('🔧 NVIDIA module loaded');
console.log('📌 API Key exists:', !!apiKey);

const nvidia = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

async function parseQuoteIntent(text) {
  console.log('🔍 parseQuoteIntent called with:', text);
  if (!nvidia) {
    console.log('❌ No NVIDIA client');
    return null;
  }
  try {
    console.log('📤 Calling NVIDIA API...');
    const response = await nvidia.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
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
    const parsed = JSON.parse(content);
    console.log('✅ Parsed:', parsed);
    return parsed;
  } catch (error) {
    console.error('❌ NIM Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data));
    }
    return null;
  }
}

// Image analysis - placeholder for future use
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
  } catch (error) {
    console.error('❌ Image analysis error:', error.message);
    return null;
  }
}

module.exports = { parseQuoteIntent, analyzeCoatingImage };