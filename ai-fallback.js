const { GoogleGenerativeAI } = require("@google/generative-ai");
const MODELS = ["gemini-flash-latest", "gemini-3.5-flash", "gemini-2.5-flash"];
const TIMEOUT_MS = 3000;
var aiClient = null;
try { if (process.env.GEMINI_API_KEY) { aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); } } catch(e) {}
async function aiFallback(text, phone, redis) {
  if (!aiClient || process.env.AI_ENABLED === "false" || !redis) return null;
  try {
    var ctx = ""; try { var d = await redis.get("session:"+phone); if(d) { var s = JSON.parse(d); if(s.history) { ctx = s.history.slice(-6).map(function(m){ return (m.role==="user"?"Customer: ":"Bot: ")+m.content; }).join("\n"); } } } catch(e) {}
    var prompt = "You are the WhatsApp assistant for Solomon Coatings, Cape Town (since 1988).\n\nServices: powder coating R16/kg B/W, R17-R20/kg premium. Shotblasting R8-R12/kg. Rims R1000-R1500/set. Sheet metal R175-R350/sqm.\nHours: Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM. Closed weekends.\nContact: Ridhor 076 760 4350.\nPayment: COD only.\n\nRecent conversation:\n"+(ctx||"None")+"\n\nCustomer: "+text+"\n\nReply briefly (1-2 sentences). Friendly Cape Town tone. If you cannot help, say: 'Let me get Ridhor on this - WhatsApp him on 076 760 4350.'";
    for (var i=0; i<MODELS.length; i++) { try { var m = aiClient.getGenerativeModel({model:MODELS[i]}); var r = await Promise.race([m.generateContent(prompt), new Promise(function(_,rej){setTimeout(function(){rej(new Error("timeout"))},TIMEOUT_MS)})]); var t = r.response.text().trim(); if(t&&t.length>5) return t; } catch(e) {} }
  } catch(e) {}
  return null;
}
module.exports = { aiFallback };
