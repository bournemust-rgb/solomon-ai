require("dotenv").config();
var express = require("express");
var axios = require("axios");
var { createClient } = require("redis");

var app = express();
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

var VT = process.env.WHATSAPP_VERIFY_TOKEN || "solomon_coatings_1988";
var PORT = process.env.PORT || 3000;
var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
var OWNER_PERSONAL = "27767604350"; // Your personal for quotes/pics
var OWNER_BUSINESS = "27605074461"; // Business number

var redis = createClient({ url: process.env.UPSTASH_REDIS_URL });
redis.connect().catch(console.error);

async function sendWhatsApp(to, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: "whatsapp", to: to, text: { body: text } },
      { headers: { Authorization: `Bearer ${WA_TOKEN}` } }
    );
  } catch(e) { console.error("Send failed:", e.message); }
}

var QR = {
  "hi": "Goeie dag! Solomon Coatings - since 1988. What can I help with?",
  "hello": "Hello! Solomon Coatings. What can I help with?",
  "howzit": "Howzit! What can I do for you?",
  "menu": "SOLOMON COATINGS\n\nPowder Coating - all colours\nSandblasting\nPre-treatment\n\nPRICES:\nRims: R400-R600 each\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nMin job: R250\n\nMon-Fri 8AM-5PM\n060 507 4461\n\nWhat are you looking to coat?",
  "pricing": "PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1500-R3500\nChassis: R3000-R8000\nSandblasting: R300-R600/hr\nMinimum: R250\n\nNeed a quote? Just say 'quote'",
  "colours": "COLOURS & FINISHES\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nWe match RAL codes. Most popular: Gloss Black & Satin Black.",
  "hours": "Mon-Fri 8AM-5PM. Saturday by appointment. Call 060 507 4461",
  "turnaround": "Standard: 3-5 working days. Large: 1-2 weeks. Rush available.",
  "delivery": "R150 flat fee Cape Town metro. Free collection from workshop.",
  "contact": "Call 060 507 4461 or WhatsApp us here.",
  "thanks": "Pleasure! Anything else?",
  "bye": "Cheers! Sien jou later."
};

function smartMatch(text) {
  var t = text.toLowerCase().trim();
  if (QR[t]) return QR[t];

  // QUOTES - route to personal
  if (t.includes("quote") || t.includes("quotation") || t.includes("estimate"))
    return "For a proper quote, Ridhor will call you personally on 076 760 4350. What's the best time to call? Or send a pic of what needs coating.";

  // ACCOUNTS - route to office
  if (t.includes("account") || t.includes("statement") || t.includes("owe") || t.includes("invoice") || t.includes("balance") || t.includes("pay"))
    return "For accounts: Call office 060 507 4461 or email accounts@solomoncoatings.co.za. They'll sort you out.";

  // PRICING
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("charge")) return QR["pricing"];

  // COLOURS
  if (t.includes("colour") || t.includes("color")) return QR["colours"];

  // HOURS
  if (t.includes("hour") || t.includes("open") || t.includes("close") || t.includes("what time")) return QR["hours"];

  // TURNAROUND
  if (t.includes("how long") || t.includes("turnaround") || t.includes("when") && t.includes("ready") || t.includes("days")) return QR["turnaround"];

  // DELIVERY
  if (t.includes("deliver") || t.includes("collect") || t.includes("where") || t.includes("address") || t.includes("location")) return QR["delivery"];

  // SPECIFIC ITEMS
  if (t.includes("rim") || t.includes("wheel") || t.includes("mag"))
    return "Rims: R400-R600 each. Steel R400-R450, alloy R500-R600. Special finishes extra. Send a pic and we'll confirm!";

  if (t.includes("gate") || t.includes("fence"))
    return "Gates: R1500-R3500 depending on size. We sandblast, pre-treat, and coat. Send measurements or a pic for accurate quote.";

  if (t.includes("chassis") || t.includes("trailer") || t.includes("bakkie"))
    return "Chassis/trailers: R3000-R8000. Need to see condition. WhatsApp pics to this number.";

  if (t.includes("speak") && (t.includes("ridhor") || t.includes("owner") || t.includes("boss") || t.includes("person")))
    return "Ridhor's direct: 076 760 4350. Or I can have him call you – what's it about?";

  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI v3.0", established: 1988 });
});

app.get("/webhook", function(req, res) {
  var m = req.query["hub.mode"];
  var t = req.query["hub.verify_token"];
  var c = req.query["hub.challenge"];
  if (m === "subscribe" && t === VT) return res.status(200).send(c);
  res.sendStatus(403);
});

app.post("/webhook", async function(req, res) {
  res.sendStatus(200);
  try {
    var entries = req.body.entry || [];
    for (var e of entries) {
      for (var ch of e.changes || []) {
        for (var msg of (ch.value.messages || [])) {
          var from = msg.from;
          var text = msg.text?.body?.trim();
          var hasImage = msg.image || msg.type === "image";

          console.log(`[${from}]: ${text || "[IMAGE]"}`);

          // HANDLE IMAGES - forward to you
          if (hasImage) {
            var imageId = msg.image?.id;
            await sendWhatsApp(from, "Thanks! Forwarded your pic to Ridhor. He'll check it now on 076 760 4350.");
            await sendWhatsApp(OWNER_PERSONAL, `📸 NEW PIC from ${from}. Check WhatsApp Business.`);
            // Forward the actual image
            if (imageId) {
              await axios.post(
                `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
                { messaging_product: "whatsapp", to: OWNER_PERSONAL, type: "image", image: { id: imageId }, context: { message_id: msg.id } },
                { headers: { Authorization: `Bearer ${WA_TOKEN}` } }
              ).catch(()=>{});
            }
            continue;
          }

          if (!text) continue;

          var match = smartMatch(text);
          if (match) {
            await sendWhatsApp(from, match);
            await redis.setEx(`chat:${from}`, 86400, JSON.stringify({ last: text, time: Date.now() }));
          } else {
            await sendWhatsApp(from, "I can help with pricing, colours, hours, or quotes. What do you need?");
          }
        }
      }
    }
  } catch (e) {
    console.error("WEBHOOK ERROR:", e.message);
  }
});

app.listen(PORT, function() {
  console.log("\nSOLOMON COATINGS AI v3.0 - Port " + PORT);
  console.log("Smart routing: ENABLED");
  console.log("Image forwarding: ENABLED");
  console.log("Owner personal: 0767604350");
});
