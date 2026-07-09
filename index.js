require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { processMessage } = require("./brain");
var { sendMessage, sendAcknowledgment } = require("./queue");
var { KNOWLEDGE } = require("./knowledge");

var app = express();
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

var VT = process.env.WHATSAPP_VERIFY_TOKEN || "solomon_coatings_1988";
var PORT = process.env.PORT || 3000;

var QR = {
  "hi": "Goeie dag! Solomon Coatings - since 1988. What can I help with?",
  "hello": "Hello! Solomon Coatings. What can I help with?",
  "hey": "Howzit! What can I do for you?",
  "howzit": "Howzit! What can I do for you?",
  "good morning": "Morning! Solomon Coatings. What can I help with today?",
  "menu": "SOLOMON COATINGS\n\nPowder Coating - all colours\nSandblasting\nPre-treatment\n\nPRICES:\nRims: R400-R600 each\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nMin job: R250\n\nMon-Fri 8AM-5PM\n060 507 4461\n\nWhat are you looking to coat?",
  "pricing": "PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nSandblasting: R300-R600/hr\nMinimum: R250",
  "price": "PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nMinimum: R250",
  "colours": "COLOURS & FINISHES\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nWe match RAL codes. Most popular: Gloss Black & Satin Black.",
  "colors": "COLOURS & FINISHES\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture",
  "hours": "Mon-Fri 8AM-5PM. Saturday by appointment.",
  "turnaround": "Standard: 3-5 working days. Large: 1-2 weeks. Rush available.",
  "time": "Standard: 3-5 working days. Large: 1-2 weeks. Rush available.",
  "delivery": "R150 flat fee Cape Town metro. Free collection from workshop.",
  "contact": "Call 060 507 4461 or WhatsApp us here.",
  "help": "I can help with pricing, colours, turnaround, delivery, or booking a callback from Ridhor. Just ask!",
  "thanks": "Pleasure! Anything else?",
  "thank you": "Only a pleasure!",
  "bye": "Cheers! Sien jou later."
};

function smartMatch(text) {
  var t = text.toLowerCase().trim();
  if (QR[t]) return QR[t];
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("quote") || t.includes("charge")) return QR["pricing"];
  if (t.includes("colour") || t.includes("color") || t.includes("what col")) return QR["colours"];
  if (t.includes("hour") || t.includes("open") || t.includes("close") || t.includes("what time")) return QR["hours"];
  if (t.includes("time") || t.includes("how long") || t.includes("turnaround") || t.includes("when will") || t.includes("how many days")) return QR["turnaround"];
  if (t.includes("deliver") || t.includes("collect") || t.includes("drop off") || t.includes("bring") || t.includes("where are you")) return QR["delivery"];
  if (t.includes("contact") || t.includes("phone") || t.includes("call") || t.includes("number")) return QR["contact"];
  if (t.includes("menu") || t.includes("services") || t.includes("what do you")) return QR["menu"];
  if (t.includes("rim") || t.includes("wheel") || t.includes("mags")) return "Rims are R400-R600 each. Steel R400-R450, alloy R500-R600. Special finishes extra. Bring them in and we'll have a look!";
  if (t.includes("gate") || t.includes("fence")) return "Gates range R1500-R3500 depending on size and condition. We sandblast, pre-treat, and coat. Bring it in for a proper quote!";
  if (t.includes("chassis") || t.includes("trailer")) return "Chassis and trailers are R3000-R8000 depending on size and prep work. We'll need to see it to give an exact quote.";
  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI", established: 1988, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/", function(req, res) {
  res.json({ service: "Solomon Coatings WhatsApp Bot", status: "running" });
});

app.get("/webhook", function(req, res) {
  var m = req.query["hub.mode"];
  var t = req.query["hub.verify_token"];
  var c = req.query["hub.challenge"];
  if (m === "subscribe" && t === VT) {
    console.log("Webhook verified");
    return res.status(200).send(c);
  }
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
  try {
    var entries = req.body && req.body.entry ? req.body.entry : [];
    for (var i = 0; i < entries.length; i++) {
      var changes = entries[i].changes || [];
      for (var j = 0; j < changes.length; j++) {
        var msgs = (changes[j].value && changes[j].value.messages) ? changes[j].value.messages : [];
        for (var k = 0; k < msgs.length; k++) {
          var from = msgs[k].from;
          var text = msgs[k].text && msgs[k].text.body ? msgs[k].text.body.trim() : null;
          if (!text) continue;

          console.log("[" + from + ']: "' + text + '"');
          var session = await getSession(from);
          var match = smartMatch(text);

          if (match) {
            console.log("Smart match found");
            await sendMessage(from, match);
            session.history.push({ role: "user", content: text }, { role: "model", content: match });
            await saveSession(from, session);
            continue;
          }

          console.log("No match, using AI...");
          sendAcknowledgment(from);
          var ai = await processMessage(text, session.history || []);
          await sendMessage(from, ai);
          session.history.push({ role: "user", content: text }, { role: "model", content: ai });
          await saveSession(from, session);
        }
      }
    }
  } catch (e) {
    console.error("WEBHOOK ERROR:", e.message);
  }
});

app.listen(PORT, function() {
  console.log("\nSOLOMON COATINGS AI v2.2 - Port " + PORT);
  console.log("HMAC: " + (process.env.WHATSAPP_APP_SECRET ? "ENABLED" : "DISABLED"));
  console.log("Redis: " + (process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_HOST ? "CONFIGURED" : "NOT SET"));
  console.log("Gemini: " + (process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT SET"));
  console.log("");
});

process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
