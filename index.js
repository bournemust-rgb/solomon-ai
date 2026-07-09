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
var WORK_NUMBER = "0605074461";
var PERSONAL_NUMBER = "27767604350";
var OFFICE_EMAIL = "rshift21@yahoo.com";

var QR = {
  "hi": "Goeie dag! Solomon Coatings - since 1988. What can I help with?",
  "hello": "Hello! Solomon Coatings. What can I help with?",
  "hey": "Howzit! What can I do for you?",
  "howzit": "Howzit! What can I do for you?",
  "good morning": "Morning! Solomon Coatings. What can I help with today?",
  "menu": "SOLOMON COATINGS\n\nPowder Coating - all colours\nSandblasting\nPre-treatment\n\nPRICES:\nRims: R400-R600 each\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nMin job: R250\n\nMon-Fri 8AM-5PM\n060 507 4461\n\nWhat are you looking to coat?",
  "pricing": "PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nSandblasting: R300-R600/hr\nMinimum: R250\n\nNeed a custom quote? Just say 'quote'",
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

  // QUOTES - route to personal
  if (t.includes("quote") || t.includes("quotation") || t.includes("estimate") || t.includes("custom"))
    return "For a proper quote, WhatsApp Ridhor directly on 076 760 4350. He'll give you an exact price. Or send a pic of what needs coating and he'll get back to you.";

  // ACCOUNTS
  if (t.includes("account") || t.includes("statement") || t.includes("owe") || t.includes("invoice") || t.includes("balance") || t.includes("pay") || t.includes("deposit"))
    return "For account queries, please email " + OFFICE_EMAIL + " or call the office on 060 507 4461. They'll check your account and get back to you.";

  // SPEAK TO RIDHOR
  if ((t.includes("speak") || t.includes("talk") || t.includes("call")) && (t.includes("ridhor") || t.includes("owner") || t.includes("boss") || t.includes("person") || t.includes("manager")))
    return "Ridhor's direct WhatsApp: 076 760 4350. Or I can have him call you — what's your name and number?";

  // PRICING
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("charge") || t.includes("rate")) return QR["pricing"];

  // COLOURS
  if (t.includes("colour") || t.includes("color") || t.includes("shade") || t.includes("finish") || t.includes("ral")) return QR["colours"];

  // HOURS
  if (t.includes("hour") || t.includes("open") || t.includes("close") || t.includes("what time") || t.includes("when are you")) return QR["hours"];

  // TURNAROUND
  if (t.includes("how long") || t.includes("turnaround") || t.includes("ready") || t.includes("days") || t.includes("week")) return QR["turnaround"];

  // DELIVERY
  if (t.includes("deliver") || t.includes("collect") || t.includes("where") || t.includes("address") || t.includes("location") || t.includes("direction")) return QR["delivery"];

  // SPECIFIC ITEMS
  if (t.includes("rim") || t.includes("wheel") || t.includes("mag"))
    return "Rims: R400-R600 each. Steel R400-R450, alloy R500-R600. Special finishes extra. Send a pic and we'll confirm! For a custom quote, WhatsApp 076 760 4350.";

  if (t.includes("gate") || t.includes("fence"))
    return "Gates: R1500-R3500 depending on size. We sandblast, pre-treat, and coat. Send measurements or a pic for accurate quote. WhatsApp 076 760 4350.";

  if (t.includes("chassis") || t.includes("trailer") || t.includes("bakkie"))
    return "Chassis/trailers: R3000-R8000. Need to see condition. WhatsApp pics to this number or directly to Ridhor on 076 760 4350.";

  if (t.includes("sandblast"))
    return "Sandblasting is R300-R600/hr depending on the item. We can blast and coat, or blast only. What do you need done?";

  if (t.includes("minimum") || t.includes("small") && t.includes("job"))
    return "Our minimum job charge is R250. Even for small brackets or hinges. Bring it in and we'll sort you out.";

  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI", established: 1988, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/", function(req, res) {
  res.json({ service: "Solomon Coatings WhatsApp Bot", status: "running", version: "3.1" });
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
          var type = msgs[k].type;
          var text = msgs[k].text && msgs[k].text.body ? msgs[k].text.body.trim() : null;

          // Handle photos/images
          if (type === "image" || type === "video" || type === "document") {
            console.log("[" + from + "]: Sent a " + type);
            var caption = "";
            if (msgs[k][type] && msgs[k][type].caption) caption = msgs[k][type].caption;
            await sendMessage(PERSONAL_NUMBER, "Customer " + from + " sent a " + type + (caption ? ": " + caption : "") + ". Check WhatsApp Business.");
            await sendMessage(from, "Thanks! I've sent your " + type + " through to Ridhor on 076 760 4350. He'll have a look and get back to you. If it's urgent, WhatsApp him directly.");
            continue;
          }

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
  console.log("\nSOLOMON COATINGS AI v3.1 - Port " + PORT);
  console.log("Work: " + WORK_NUMBER + " | Personal: " + PERSONAL_NUMBER + " | Email: " + OFFICE_EMAIL);
  console.log("Smart routing: Quotes -> Personal | Accounts -> Office | Photos -> Forwarded");
  console.log("HMAC: " + (process.env.WHATSAPP_APP_SECRET ? "ENABLED" : "DISABLED"));
  console.log("Redis: " + (process.env.UPSTASH_REDIS_URL ? "CONFIGURED" : "NOT SET"));
  console.log("");
});

process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
