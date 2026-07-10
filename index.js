require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { processMessage } = require("./brain");
var { sendMessage, sendAcknowledgment } = require("./queue");
var { KNOWLEDGE } = require("./knowledge");
var axios = require("axios");

var app = express();
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

var VT = process.env.WHATSAPP_VERIFY_TOKEN || "solomon_coatings_1988";
var PORT = process.env.PORT || 3000;
var WORK_NUMBER = "0605074461";
var PERSONAL_NUMBER = "27767604350";
var OFFICE_NUMBER = "0219052912";
var OFFICE_EMAIL = "populier@mweb.co.za";
var QUOTE_EMAIL = "infosc@mweb.co.za";
var FACEBOOK = "https://www.facebook.com/SolomonCoatings/";
var TIKTOK = "https://www.tiktok.com/@solomon.coatings";
var GOOGLE_REVIEW = "https://g.page/r/your-review-link";
var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

function getOrderRef() {
  var d = new Date();
  return "SC" + d.getFullYear().toString().slice(-2) + ("0"+(d.getMonth()+1)).slice(-2) + ("0"+d.getDate()).slice(-2) + "-" + Math.floor(Math.random()*9000+1000);
}

function isAfterHours() {
  var now = new Date();
  var day = now.getDay();
  var hour = now.getHours();
  var min = now.getMinutes();
  var t = hour * 60 + min;
  if (day === 0 || day === 6) return true;
  if (day === 5 && t >= 885) return true;
  if (day >= 1 && day <= 4 && (t < 480 || t >= 1005)) return true;
  return false;
}

function detectLanguage(text) {
  var afrWords = ["dankie","asseblief","goeie","more","middag","aand","hoe","gaan","dit","baie","lekker","ja","nee","mooi","wat","waar","wanneer","hoeveel","kan","ek","jy","ons","hulle","nie","wel","weer","nog","net","nou","dan","ook","hier","daar","so","as","vir","met","van","die","het","sal","gaan","kom","doen","maak","weet","dink","se","praat","koop","verkoop","bestel"];
  var count = 0;
  var words = text.toLowerCase().split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    if (afrWords.indexOf(words[i]) !== -1) count++;
  }
  return count >= 2 ? "af" : "en";
}

function estimatePrice(text) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  if (t.includes("rim")) {
    var qty = t.match(/(\d+)/);
    qty = qty ? parseInt(qty[1]) : 4;
    var sets = Math.ceil(qty / 4);
    var colour = "standard";
    if (t.includes("metallic") || t.includes("gold") || t.includes("bronze") || t.includes("charcoal") || t.includes("silver")) colour = "metallic";
    var perSet = colour === "standard" ? "R1,000-R1,200" : "R1,200-R1,500";
    return "Estimate: " + qty + " rims (" + sets + " set(s)), " + colour + " colour = " + perSet + " per set excl VAT.\n\nRef: " + ref + "\n\nEstimate only. Final price depends on condition and prep. Customer MUST remove tyres. Bring them in for exact quote or WhatsApp Ridhor: 076 760 4350.";
  }
  if (t.includes("gate")) return "Gate estimate: Coating R15-R23/kg + Blasting R8-R12/kg if rusted. Oversized +6m: R1,000 setup.\n\nRef: " + ref + "\n\nSend a pic for accurate estimate. WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("sheet") || t.includes("mesh")) return "Sheet metal: Standard R175-R250/sqm. Metallic R251-R350/sqm.\n\nRef: " + ref + "\n\nBring measurements for accurate quote.";
  if (t.includes("truck") || t.includes("bakkie") || t.includes("flatbed")) return "Truck blasting: R5,000-R7,500 excl VAT (5m flatbed).\n\nRef: " + ref + "\n\nFinal price depends on condition. No rubber blasted.";
  return null;
}

var SEASONAL_PROMO = "";

var QR = {
  "hi": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "hello": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "hey": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "howzit": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "good morning": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "menu": "SOLOMON COATINGS - Since 1988\n\nPOWDER COATING | SANDBLASTING | SHOT BLASTING\n\nPRICES (excl 15% VAT):\nRims: R1000-R1500/set of 4\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting: R5000-R7500\nMin job: R173.99 B/W, R225 hammered, R300+ metallic\nOversized +6m: R1000 setup fee\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461 | Office: " + OFFICE_NUMBER + "\n\nBulk discounts up to 10%. COD only." + (SEASONAL_PROMO ? "\n\n" + SEASONAL_PROMO : ""),
  "pricing": "PRICING (excl 15% VAT)\nRims: R1000-R1500/set of 4\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting: R5000-R7500\nMin job: R173.99 B/W, R225 hammered, R300+ metallic\nOversized +6m: R1000 setup fee\n\nBulk discounts up to 10%. COD only." + (SEASONAL_PROMO ? "\n\n" + SEASONAL_PROMO : ""),
  "colours": "COLOURS & FINISHES\nStandard: Black, White, Brown, Bronze, Charcoal - R175-R250/sqm\nHammered: from R225\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nColours may vary by batch every 4-6 months.\nSee examples: " + FACEBOOK,
  "hours": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed Saturdays & Sundays.",
  "turnaround": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days. Timelines may be affected by loadshedding/weather.",
  "delivery": "R150 delivery Cape Town metro. Free collection. Items must be collected within 7 days or 7% daily storage fee applies.",
  "contact": "WhatsApp: 060 507 4461\nOffice: " + OFFICE_NUMBER + "\nEmail: " + OFFICE_EMAIL + "\nQuotes: " + QUOTE_EMAIL + "\nFacebook: " + FACEBOOK + "\nTikTok: " + TIKTOK,
  "help": "I can help with:\n\n* Get a quick estimate\n* Pricing & quotes\n* Colours & finishes\n* Turnaround times\n* Delivery & collection\n* Blasting services\n* Account queries\n* T&Cs & warranties\n* View our gallery\n* Leave a review\n* Book a callback\n* Order status\n\nJust ask!",
  "thanks": "Pleasure! Anything else I can help with?",
  "thank you": "Only a pleasure!",
  "bye": "Cheers! Sien jou later."
};

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    return true;
  } catch(e) { return false; }
}

function smartMatch(text, fromNumber, session) {
  var t = text.toLowerCase().trim();
  var lang = detectLanguage(text);
  var promoMsg = SEASONAL_PROMO ? "\n\n" + SEASONAL_PROMO : "";

  if (QR[t]) return QR[t] + promoMsg;

  // PRICE CALCULATOR
  if ((t.includes("quote") || t.includes("estimate") || t.includes("how much") || t.includes("cost") || t.includes("price")) && (t.includes("rim") || t.includes("gate") || t.includes("sheet") || t.includes("mesh") || t.includes("4") || t.includes("2") || t.includes("set"))) {
    var est = estimatePrice(text);
    if (est) return est;
  }

  // LOYALTY
  if (session && session.history && session.history.length > 2 && (t === "hi" || t === "hello" || t === "hey")) {
    var lastMsg = "";
    for (var hi = session.history.length-1; hi >= 0; hi--) {
      if (session.history[hi].role === "user") { lastMsg = session.history[hi].content; break; }
    }
    if (lastMsg) return "Welcome back! Last time we chatted about: \"" + lastMsg.substring(0,60) + "...\"\n\nWhat can I help with today?";
  }

  // INVOICE
  if (t.includes("invoice") && (t.includes("send") || t.includes("email") || t.includes("copy"))) {
    var ref = t.match(/SC\d{6}-\d{4}/);
    if (ref) return "I will request invoice " + ref[0] + " to be emailed. Confirm your email or we will use the one on file. Urgent? Call " + OFFICE_NUMBER + ".";
    return "Please provide your order reference (e.g. SC240712-5821) and I will arrange your invoice. Or call " + OFFICE_NUMBER + ".";
  }

  // WORKSHOP STATUS
  if (t.includes("how busy") || t.includes("queue") || t.includes("wait time") || (t.includes("how long") && t.includes("wait")))
    return "We process orders daily. For real-time wait time, WhatsApp Ridhor on 076 760 4350 with what you need done.";

  // COLOUR VISUALISER
  if ((t.includes("show me") || t.includes("see") || t.includes("look like") || t.includes("example") || t.includes("sample")) && (t.includes("colour") || t.includes("color") || t.includes("black") || t.includes("white") || t.includes("red") || t.includes("blue") || t.includes("finish")))
    return "Check our colour examples on Facebook: " + FACEBOOK + " and TikTok: " + TIKTOK + "\n\nWe post real jobs regularly. Want a specific colour? WhatsApp Ridhor on 076 760 4350 for samples.";

  // GOOGLE REVIEW
  if (t.includes("review") || t.includes("rate") || t.includes("feedback") || t.includes("testimonial"))
    return "We would love your feedback! Leave a review: " + GOOGLE_REVIEW + "\n\nOr share on Facebook: " + FACEBOOK + "\n\nThank you for supporting Solomon Coatings since 1988!";

  // GALLERY
  if (t.includes("gallery") || t.includes("see your work") || t.includes("past job") || t.includes("portfolio") || t.includes("examples") || t.includes("what have you done"))
    return "Check out our work on Facebook: " + FACEBOOK + " and TikTok: " + TIKTOK + ". We post regularly!" + promoMsg;

  // TERMS
  if (t.includes("terms") || t.includes("t&c") || t.includes("conditions") || t.includes("policy") || t.includes("legal"))
    return "Full T&Cs:\n- COD only, no release without payment\n- No coastal warranties (within 15km)\n- 7% daily storage after 7 days\n- All blasting at client's risk\n- Items remain our property until paid\n\nFull document: email " + OFFICE_EMAIL + " or WhatsApp Ridhor on 076 760 4350.";

  // ORDER STATUS
  if (t.includes("order") && (t.includes("status") || t.includes("update") || t.includes("progress") || t.includes("ready") || t.includes("track")))
    return "For order updates, WhatsApp Ridhor on 076 760 4350 with your reference number.";

  // BOOK CALLBACK
  if (t.includes("book") || t.includes("callback") || t.includes("call me") || t.includes("appointment") || t.includes("visit") || t.includes("come in"))
    return "Want Ridhor to call you? Send your name, number, and what you need. Or call " + OFFICE_NUMBER + " to book.";

  // COMPLAINT
  if (t.includes("complaint") || t.includes("problem") || t.includes("unhappy") || t.includes("not happy") || t.includes("issue") || t.includes("wrong"))
    return "Sorry to hear that. WhatsApp Ridhor on 076 760 4350 or email " + OFFICE_EMAIL + " with details. He will sort it out.";

  // HOW TO ORDER
  if ((t.includes("how") && t.includes("order")) || t.includes("process") || t.includes("steps") || t.includes("how does it work"))
    return "How it works:\n1. Send pic/description\n2. Get estimate (subject to inspection)\n3. Bring items during business hours\n4. We blast, pre-treat, coat\n5. We notify when ready\n6. Pay (COD) and collect\n\nGot something in mind?";

  // REFERENCE (must come before referral to avoid conflict)
  if (t.includes("reference") || t.includes("order number") || t.includes("job number") || t.includes("ref"))
    return "Your reference: " + getOrderRef() + "\n\nUse this when contacting us. Save it! For a quote, WhatsApp Ridhor: 076 760 4350.";

  // REFERRAL
  if (t.includes("recommend") || t.includes("refer") || t.includes("friend") || t.includes("family"))
    return "We love referrals! Share 060 507 4461 or " + FACEBOOK + " with them. Word of mouth since 1988!";

  // URGENT
  if (t.includes("urgent") || t.includes("emergency") || t.includes("asap") || t.includes("rush"))
    return "For urgent jobs, WhatsApp Ridhor directly on 076 760 4350. Rush surcharge may apply.";

  // MATERIALS (must be checked early)
  if (t.includes("material") || t.includes("what can you coat") || t.includes("can you coat") || t.includes("can you do") || t.includes("do you coat"))
    return "We coat all metals handling 200C+: steel, aluminium, cast iron, stainless steel. No plastic, wood, or fibreglass. Items unable to withstand 200C must be declared before work begins.";

  // OLD MATERIALS CHECK (remove duplicate)
  if (t.includes("material") || t.includes("what can you coat") || (t.includes("can you do") && (t.includes("wood") || t.includes("plastic") || t.includes("aluminium") || t.includes("steel"))))
    return "We coat all metals handling 200C+: steel, aluminium, cast iron, stainless steel. No plastic, wood, or fibreglass.";

  // COLLECTION
  if (t.includes("collect") || t.includes("pickup") || t.includes("storage") || t.includes("uncollected"))
    return "Items must be collected within 7 working days. Late collection: 7% daily storage fee. No release without full payment.";

  // COASTAL
  if (t.includes("coastal") || t.includes("sea") || t.includes("beach") || t.includes("salt") || t.includes("warranty") || t.includes("guarantee"))
    return "No warranties within 15km of shoreline. Powder coating is decorative, not anti-corrosive. Coastal work at client's risk.";

  // DEFECTS
  if (t.includes("defect") || t.includes("crack") || t.includes("warp") || t.includes("distort") || t.includes("hidden"))
    return "Not liable for latent defects (cracked welds, corrosion, delamination, warping). All work at client's risk.";

  // SHOTBLAST RISK
  if ((t.includes("shotblast") || t.includes("shot blast")) && (t.includes("risk") || t.includes("liable") || t.includes("damage")))
    return "Shotblasting strictly at client's risk. May expose underlying defects. Not liable for cracking, chipping, pitting.";

  // PRE-BLAST
  if (t.includes("prepare") || t.includes("plastic") || t.includes("glass") || t.includes("hydraulic"))
    return "Before blasting: Remove plastic, brittle, malleable parts. Disconnect hydraulics. Empty/declare tanks. Remove glass/lights. No liability for breakage.";

  // MAINTENANCE
  if (t.includes("maintenance") || t.includes("clean") || t.includes("care") || t.includes("look after") || t.includes("last longer"))
    return "Longevity needs maintenance: drying, wiping, cleaning, rinsing, protective treatments. Keep records.";

  // PAYMENT
  if (t.includes("pay") || t.includes("payment") || t.includes("cod") || t.includes("release"))
    return "Strict COD - no release without full payment. Custom materials paid upfront. Accounts: " + OFFICE_EMAIL + " / " + OFFICE_NUMBER;

  // IP
  if (t.includes("intellectual") || t.includes("ip") || t.includes("ownership") || t.includes("design"))
    return "All processes/colour formulations remain Solomon Coatings IP. Items remain our property until paid in full.";

  // COLOUR VARIATION
  if (t.includes("batch") || t.includes("colour match") || t.includes("color match") || t.includes("variation"))
    return "Colours may vary by batch every 4-6 months. Standard: 2-ton batches. Specials: 500kg. Customs: 100kg.";

  // PRIMER
  if (t.includes("primer") || t.includes("top coat") || t.includes("etch"))
    return "If primed: top-coat within 12-24hrs. Etch primers 15-40um DFT. High-heat paints (700-900C), MIO, polyurethane, DTM available.";

  // WETSPRAY
  if (t.includes("wetspray") || t.includes("wet spray") || t.includes("wet paint") || (t.includes("custom") && t.includes("blast")))
    return "Wetspray/custom blasting: Contact Ridhor on 076 760 4350 or " + QUOTE_EMAIL;

  // ACCOUNTS
  if (t.includes("account") || t.includes("statement") || t.includes("invoice") || t.includes("balance"))
    return "Accounts: " + OFFICE_EMAIL + " / " + OFFICE_NUMBER;

  // RIDHOR
  if ((t.includes("speak") || t.includes("talk") || t.includes("call")) && (t.includes("ridhor") || t.includes("owner") || t.includes("boss")))
    return "Ridhor: 076 760 4350 (WhatsApp/call) or " + QUOTE_EMAIL + ". Office: " + OFFICE_NUMBER;

  // BULK
  if (t.includes("bulk") || t.includes("discount") || t.includes("volume") || t.includes("commercial"))
    return "Bulk discounts up to 10%. WhatsApp Ridhor on 076 760 4350 or " + QUOTE_EMAIL + " for a tailored quote.";

  // SOCIAL
  if (t.includes("facebook") || t.includes("social") || t.includes("tiktok"))
    return "Facebook: " + FACEBOOK + "\nTikTok: " + TIKTOK + "\nWhatsApp: 060 507 4461";

  // TRUCK
  if (t.includes("truck") || t.includes("bakkie") || t.includes("flatbed") || t.includes("ldv"))
    return "Shot blasting 5m flatbed: R5,000-R7,500 excl VAT. No rubber. Grit/slag 0.12-0.4mm, 6 bar. Custom: contact Ridhor 076 760 4350.";

  // BLASTING
  if (t.includes("blast") || t.includes("sandblast") || t.includes("shot blast"))
    return "Blasting: R8-R12/kg. Truck: R5,000-R7,500. Medium: Grit/slag 0.12-0.4mm, 6 bar, 10mm nozzle. All at client's risk.";

  // RUST
  if (t.includes("rust")) return "Rusted items: Blasting R8-R12/kg excl VAT. May reveal hidden defects. Quotes subject to inspection.";

  // PRICING
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("charge") || t.includes("rate")) return QR["pricing"] + promoMsg;

  // COLOURS
  if (t.includes("colour") || t.includes("color") || t.includes("finish") || t.includes("ral")) return QR["colours"];

  // HOURS
  if (t.includes("hour") || t.includes("open") || t.includes("close") || t.includes("what time")) return QR["hours"];

  // TURNAROUND
  if (t.includes("how long") || t.includes("turnaround") || t.includes("ready")) return QR["turnaround"];

  // DELIVERY
  if (t.includes("deliver") || t.includes("where") || t.includes("address") || t.includes("location")) return QR["delivery"];

  // CONTACT
  if (t.includes("contact") || t.includes("email") || t.includes("phone") || t.includes("whatsapp")) return QR["contact"];

  // RIMS
  if (t.includes("rim") || t.includes("wheel") || t.includes("mag"))
    return "Rims: R1,000-R1,500/set of 4 (10-15\"). Excl VAT. MUST remove tyres. WhatsApp Ridhor: 076 760 4350.";

  // GATES
  if (t.includes("gate") || t.includes("fence") || t.includes("burglar"))
    return "Gates/bars/rails: Per kg. Coating R15-R23/kg, Blasting R8-R12/kg. Oversized +6m: R1000. WhatsApp: 076 760 4350.";

  // SHEET
  if (t.includes("sheet") || t.includes("mesh") || t.includes("panel"))
    return "Sheet metal: Standard R175-R250/sqm. Hammered R225+. Metallics R300+. Excl VAT. Bulk discounts up to 10%.";

  // CHASSIS
  if (t.includes("chassis") || t.includes("trailer"))
    return "Chassis/trailers: Coating R15-R23/kg, Blasting R8-R12/kg. Oversized surcharge. WhatsApp pics: 076 760 4350.";

  // MINIMUM
  if ((t.includes("minimum") || t.includes("small")) && t.includes("job"))
    return "Minimum: R173.99 black/white, R225 hammered, R300+ metallics. Excl VAT.";

  // TYRES
  if (t.includes("tyre") || t.includes("tire")) return "Customer MUST remove tyres. We do NOT remove tyres.";

  // VAT
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated. Minimum charges exclude VAT.";

  // SATURDAY
  if (t.includes("saturday") || t.includes("weekend") || t.includes("sunday"))
    return "Closed weekends. Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM.";

  // OVERSIZED
  if ((t.includes("oversized") || t.includes("large")) && (t.includes("item") || t.includes("job")))
    return "Large items (6m-7.2m): higher rate. Minimum R1000 setup fee excl VAT.";

  // LOADSHEDDING
  if (t.includes("loadshedding") || t.includes("power") || t.includes("delay") || t.includes("weather"))
    return "Timelines may be affected by loadshedding/weather. We will keep you updated.";

  // REFERENCE
  if (t.includes("reference") || t.includes("order number") || t.includes("job number") || t.includes("ref"))
    return "Your reference: " + getOrderRef() + "\n\nUse this when contacting us. Save it! For a quote, WhatsApp Ridhor: 076 760 4350.";

  // PROMO SET
  if (t.includes("admin set promo") && fromNumber === PERSONAL_NUMBER) {
    var promo = text.replace(/admin set promo/i, "").trim();
    if (promo) { SEASONAL_PROMO = promo; return "Promo set: \"" + promo + "\"\n\nIt will now appear on menu and pricing replies."; }
  }

  // RAIN
  if (t.includes("rain") || (t.includes("weather") && t.includes("coat")))
    return "Once cured, powder coating is weather-resistant. Fresh coating should not be exposed to rain for 24 hours. We advise collecting when weather is clear.";

  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI", established: 1988, version: "7.1" });
});
app.get("/", function(req, res) {
  res.json({ service: "Solomon Coatings WhatsApp Bot", status: "running", version: "7.1" });
});
app.get("/webhook", function(req, res) {
  var m = req.query["hub.mode"], t = req.query["hub.verify_token"], c = req.query["hub.challenge"];
  if (m === "subscribe" && t === VT) { console.log("Webhook verified"); return res.status(200).send(c); }
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
          var from = msgs[k].from, type = msgs[k].type;
          var text = msgs[k].text && msgs[k].text.body ? msgs[k].text.body.trim() : null;
          var imageId = msgs[k].image ? msgs[k].image.id : null;
          var voiceNote = msgs[k].audio;
          var afterHours = isAfterHours();

          // VOICE NOTE
          if (type === "audio" || voiceNote) {
            console.log("[" + from + "]: Voice note");
            await sendMessage(from, "I received your voice note! I cannot transcribe it yet, but I have notified Ridhor. He will listen and get back to you. For quick answers, please text. Or WhatsApp him directly on 076 760 4350.");
            await sendMessage(PERSONAL_NUMBER, "Voice note from " + from + ". Check WhatsApp Business.");
            continue;
          }

          // IMAGE
          if (type === "image" && imageId) {
            console.log("[" + from + "]: Image " + imageId);
            var cap = msgs[k].image.caption || "";
            var fwd = await forwardImageToOwner(imageId, from);
            if (fwd) await sendMessage(PERSONAL_NUMBER, "New image from " + from + (cap ? " - " + cap : "") + ". Forwarded above.");
            else await sendMessage(PERSONAL_NUMBER, "Customer " + from + " sent image. Check WhatsApp Business. ID: " + imageId);
            await sendMessage(from, "Thanks! Forwarded to Ridhor on 076 760 4350. He will check now. Urgent? WhatsApp him directly!");
            continue;
          }

          if (!text) continue;

          console.log("[" + from + ']: "' + text + '"' + (afterHours ? " [AFTER HOURS]" : ""));
          var session = await getSession(from);
          var match = smartMatch(text, from, session);

          if (match) {
            // Add after-hours notice if applicable
            if (afterHours) {
              match = "Our workshop is currently closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n" + match;
              await sendMessage(PERSONAL_NUMBER, "After-hours query from " + from + ": \"" + text + "\"\nBot replied with answer.");
            }
            console.log("Smart match found");
            await sendMessage(from, match);
            session.history.push({ role: "user", content: text }, { role: "model", content: match });
            await saveSession(from, session);
            continue;
          }

          // No match - use AI
          if (afterHours) await sendMessage(PERSONAL_NUMBER, "After-hours from " + from + " (using AI): \"" + text + "\"");
          console.log("No match, using AI...");
          sendAcknowledgment(from);
          var ai = await processMessage(text, session.history || []);
          if (afterHours) ai = "Our workshop is currently closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n" + ai;
          await sendMessage(from, ai);
          session.history.push({ role: "user", content: text }, { role: "model", content: ai });
          await saveSession(from, session);
        }
      }
    }
  } catch (e) { console.error("WEBHOOK ERROR:", e.message); }
});

app.listen(PORT, function() {
  console.log("\nSOLOMON COATINGS AI v7.1 - Port " + PORT);
  console.log("After-hours: Answers queries + adds closed notice + notifies owner");
  console.log("");
});
process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
