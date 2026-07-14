const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash"];
const TIMEOUT_MS = 3000;

var aiClient = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch(e) { console.log("Gemini init failed:", e.message); }

function buildPrompt(context, text) {
  return "You are the WhatsApp assistant for Solomon Coatings, a powder coating business in Cape Town since 1988.\n\n" +
    "Services: powder coating R16/kg B/W, R17-R20/kg premium. Shotblasting R8-R12/kg. Rims R1000-R1500/set.\n" +
    "Hours: Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM. Closed weekends.\n" +
    "Contact: Ridhor 076 760 4350. Office 021 905 2912.\n" +
    "Payment: COD only. Delivery: R150 Cape Town metro.\n\n" +
    "Recent conversation:\n" + (context || "None") + "\n\n" +
    "Customer: " + text + "\n\n" +
    "Reply briefly (1-2 sentences). Friendly Cape Town tone. If you cannot help, say: 'Let me get Ridhor on this - WhatsApp him on 076 760 4350.'";
}

async function aiFallback(text, phone, redis) {
  if (!aiClient || process.env.AI_ENABLED === "false" || !redis) return null;
  try {
    var context = "";
    try {
      var data = await redis.get("session:" + phone);
      if (data) {
        var session = JSON.parse(data);
        if (session.history && session.history.length > 0) {
          context = session.history.slice(-6).map(function(m) {
            return (m.role === "user" ? "Customer: " : "Bot: ") + m.content;
          }).join("\n");
        }
      }
    } catch(e) { context = ""; }
    var prompt = buildPrompt(context, text);
    for (var i = 0; i < MODELS.length; i++) {
      try {
        var model = aiClient.getGenerativeModel({ model: MODELS[i] });
        var result = await Promise.race([
          model.generateContent(prompt),
          new Promise(function(_, reject) { setTimeout(function() { reject(new Error("timeout")); }, TIMEOUT_MS); })
        ]);
        var response = result.response.text().trim();
        if (response && response.length > 5) return response;
      } catch(e) { console.log("Gemini " + MODELS[i] + " failed:", e.message); }
    }
  } catch(e) { console.log("AI fallback error:", e.message); }
  return null;
}

module.exports = { aiFallback };
