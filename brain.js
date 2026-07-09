const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_PROMPT } = require('./personality');
const { getPricing, getColours, getTurnaround, getFAQ, getBusinessInfo, getLimitations, getProcess } = require('./knowledge');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const FUNCTION_DECLARATIONS = [
  { name: 'getPricing', description: 'Get pricing for an item. ALWAYS call before quoting.', parameters: { type: 'object', properties: { category: { type: 'string', enum: ['rims','smallParts','gate','chassis','sandblastingOnly','minimumJob'] } }, required: ['category'] } },
  { name: 'getColours', description: 'Get available colours and finishes.', parameters: { type: 'object', properties: { type: { type: 'string', enum: ['standard','textures','all'] } } } },
  { name: 'getTurnaround', description: 'Get turnaround time.', parameters: { type: 'object', properties: { jobType: { type: 'string', enum: ['small','large','unknown'] } } } },
  { name: 'getFAQ', description: 'Answer FAQs about powder coating.', parameters: { type: 'object', properties: { topic: { type: 'string' } } } },
  { name: 'getBusinessInfo', description: 'Get business hours, phone, address, delivery.', parameters: { type: 'object', properties: {} } },
  { name: 'getLimitations', description: 'Get what we CANNOT do.', parameters: { type: 'object', properties: {} } },
  { name: 'getProcess', description: 'Get the powder coating process steps.', parameters: { type: 'object', properties: {} } }
];

const FUNCTION_HANDLERS = { getPricing, getColours, getTurnaround, getFAQ, getBusinessInfo, getLimitations, getProcess };

function createModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 300, topP: 0.9 }
  });
}

async function processMessage(userMessage, conversationHistory) {
  conversationHistory = conversationHistory || [];
  try {
    const model = createModel();
    const formattedHistory = conversationHistory.slice(-20).map(function(msg) {
      return { role: msg.role, parts: [{ text: msg.content }] };
    });
    const chat = model.startChat({ history: formattedHistory });
    let result = await chat.sendMessage(userMessage);
    let response = result.response;
    let safetyCounter = 0;
    while (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.some(function(p) { return p.functionCall; }) && safetyCounter < 5) {
      safetyCounter++;
      const functionCalls = response.candidates[0].content.parts.filter(function(p) { return p.functionCall; }).map(function(p) { return p.functionCall; });
      const functionResponses = functionCalls.map(function(fc) {
        const handler = FUNCTION_HANDLERS[fc.name];
        if (!handler) return { functionResponse: { name: fc.name, response: { error: 'Unknown: ' + fc.name } } };
        try {
          const args = fc.args || {};
          const result = handler(args.category || args.type || args.jobType || args.topic);
          return { functionResponse: { name: fc.name, response: result } };
        } catch (err) {
          return { functionResponse: { name: fc.name, response: { error: err.message } } };
        }
      });
      result = await chat.sendMessage(functionResponses);
      response = result.response;
    }
    const text = response.text();
    return (text && text.trim()) ? text.trim() : "Ag sorry, I didn't catch that. Try again?";
  } catch (error) {
    console.error('Gemini error:', error.message);
    if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) return "System's a bit slow. Call us on 060 507 4461.";
    if (error.message && (error.message.includes('429') || error.message.includes('quota'))) return "Busy day! Call 060 507 4461 or try later.";
    return "Systems acting up. Call 060 507 4461 to speak to Ridhor.";
  }
}
module.exports = { processMessage };
