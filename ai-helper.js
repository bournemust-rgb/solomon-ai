// AI HELPER — Not connected to bot message pipeline
// Called manually from inbox via /api/ai-suggest
const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash"];
const TIMEOUT_MS = 3000;

var aiClient = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch(e) {}

async function getAiSuggestion(customerMessage, phone, redisClient) {
  if (!aiClient || process.env.AI_ENABLED === "false") return null;
  
  try {
    // Pull last 3 messages for context
    var context = "";
    try {
      var key = "chat:" + phone;
      var raw = await redisClient.lRange(key, -6, -1);
      if (raw && raw.length > 0) {
        var msgs = raw.map(function(r) {
          try { return JSON.parse(r); } catch(e) { return null; }
        }).filter(function(m) { return m && m.content; });
        context = msgs.map(function(m) {
          return (m.role === "user" ? "Customer: " : "Bot: ") + m.content;
        }).join("\n");
      }
    } catch(e) {}
    
    var prompt = "You are the WhatsApp assistant for Solomon Coatings, Cape Town (since 1988).\n\n" +
      "Services: powder coating R16/kg B/W, R17-R20/kg premium. Shotblasting R8-R12/kg. Rims R1000-R1500/set. Sheet metal R175-R350/sqm.\n" +
      "Hours: Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM. Closed weekends.\n" +
      "Contact: Ridhor 076 760 4350. Office 021 905 2912.\n" +
      "Payment: COD only. Delivery: R150 Cape Town metro.\n\n" +
      "Recent conversation:\n" + (context || "None") + "\n\n" +
      "Customer just said: \"" + customerMessage + "\"\n\n" +
      "Reply briefly (1-2 sentences). Friendly Cape Town tone. If you cannot help, say: 'Let me get Ridhor on this — WhatsApp him on 076 760 4350.'";
    
    for (var i = 0; i < MODELS.length; i++) {
      try {
        var model = aiClient.getGenerativeModel({ model: MODELS[i] });
        var result = await Promise.race([
          model.generateContent(prompt),
          new Promise(function(_, reject) { setTimeout(function() { reject(new Error("timeout")); }, TIMEOUT_MS); })
        ]);
        var response = result.response.text().trim();
        if (response && response.length > 5) return response;
      } catch(e) {}
    }
  } catch(e) {}
  return null;
}

module.exports = { getAiSuggestion };
