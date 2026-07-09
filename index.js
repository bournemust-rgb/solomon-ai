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
  "menu": "SOLOMON COATINGS\n\nPowder Coating - all colours\nSandblasting\nPre-treatment\n\nPRICES:\nRims: R400-R600 each\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nMin job: R250\n\nMon-Fri 8AM-5PM\n060 507 4461\n\nWhat are you looking to coat?",
  "pricing": "PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nSandblasting: R300-R600/hr\nMinimum: R250",
  "colours": "COLOURS\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nWe match RAL codes.",
  "hours": "Mon-Fri 8AM-5PM. Saturday by appointment.",
  "turnaround": "Standard: 3-5 working days. Large: 1-2 weeks. Rush available.",
  "delivery": "R150 flat fee Cape Town metro. Free collection.",
  "contact": "Call 060 507 4461.",
  "help": "I can help with pricing, colours, turnaround, delivery, or booking a callback. Just ask!",
  "thanks": "Pleasure!",
  "bye": "Cheers! Sien jou later."
};

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
          console.log("Looking up quick response for: '" + text.toLowerCase().trim() + "'");

          var session = await getSession(from);
          var lower = text.toLowerCase().trim();

          if (QR[lower]) {
            console.log("Quick response found: " + lower);
            var result = await sendMessage(from, QR[lower]);
            console.log("Send result:", JSON.stringify(result));
            session.history.push({ role: "user", content: text }, { role: "model", content: QR[lower] });
            await saveSession(from, session);
            continue;
          }

          console.log("No quick response, using AI...");
          sendAcknowledgment(from);
          var ai = await processMessage(text, session.history || []);
          console.log("AI response:", ai.substring(0, 80));
          var sendResult = await sendMessage(from, ai);
          console.log("AI send result:", JSON.stringify(sendResult));
          session.history.push({ role: "user", content: text }, { role: "model", content: ai });
          await saveSession(from, session);
        }
      }
    }
  } catch (e) {
    console.error("WEBHOOK ERROR:", e.message);
    console.error(e.stack);
  }
});

app.listen(PORT, function() {
  console.log("\nSOLOMON COATINGS AI v2.1 - Port " + PORT);
  console.log("HMAC: " + (process.env.WHATSAPP_APP_SECRET ? "ENABLED" : "DISABLED"));
  console.log("Redis: " + (process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_HOST ? "CONFIGURED" : "NOT SET"));
  console.log("Gemini: " + (process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT SET"));
  console.log("");
});

process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
