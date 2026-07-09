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

var QR = {
  "hi": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "hello": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "hey": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "howzit": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "good morning": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions.\n\nFeel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "menu": "SOLOMON COATINGS - Since 1988\n\nPOWDER COATING | SANDBLASTING | SHOT BLASTING\n\nPRICES (excl 15% VAT):\nRims: R1000-R1500/set of 4\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting: R5000-R7500\nMin job: R173.99 B/W, R225 hammered, R300+ metallic\nOversized +6m: R1000 setup fee\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461 | Office: " + OFFICE_NUMBER + "\n\nBulk discounts up to 10%. COD only.",
  "pricing": "PRICING (excl 15% VAT)\nRims: R1000-R1500/set of 4\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting: R5000-R7500\nMin job: R173.99 B/W, R225 hammered, R300+ metallic\nOversized +6m: R1000 setup fee\n\nBulk discounts up to 10%. COD only. All quotes subject to inspection.",
  "colours": "COLOURS & FINISHES\nStandard: Black, White, Brown, Bronze, Charcoal - R175-R250/sqm\nHammered: from R225\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nColours may vary by batch every 4-6 months.",
  "hours": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed Saturdays & Sundays.",
  "turnaround": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days. Timelines may be affected by loadshedding/weather.",
  "delivery": "R150 delivery Cape Town metro. Free collection. Items must be collected within 7 days or 7% daily storage fee applies.",
  "contact": "WhatsApp: 060 507 4461\nOffice: " + OFFICE_NUMBER + "\nEmail: " + OFFICE_EMAIL + "\nQuotes: " + QUOTE_EMAIL + "\nFacebook: " + FACEBOOK + "\nTikTok: " + TIKTOK,
  "help": "I can help with:\n\n* Pricing & quotes\n* Colours & finishes\n* Turnaround times\n* Delivery & collection\n* Blasting services\n* Account queries\n* T&Cs & warranties\n* Booking a callback\n* View our work\n\nJust ask!",
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

function smartMatch(text) {
  var t = text.toLowerCase().trim();
  if (QR[t]) return QR[t];

  // GALLERY / SEE OUR WORK / PAST JOBS
  if (t.includes("gallery") || t.includes("see your work") || t.includes("past job") || t.includes("portfolio") || t.includes("examples") || t.includes("photos of") || t.includes("pictures of") || t.includes("what have you done"))
    return "Check out our work on Facebook: " + FACEBOOK + " and TikTok: " + TIKTOK + ". We post regularly! Want to see something specific? Ask and I will let Ridhor know.";

  // TERMS & CONDITIONS LINK
  if (t.includes("terms") || t.includes("t&c") || t.includes("conditions") || t.includes("policy") || t.includes("legal"))
    return "Our full Terms & Conditions are available on request. Key points:\n- COD only, no release without payment\n- No coastal warranties\n- 7% daily storage after 7 days\n- All blasting at client's risk\n- Items remain our property until paid\n\nFor the full document, email " + OFFICE_EMAIL + " or WhatsApp Ridhor on 076 760 4350.";

  // ORDER STATUS / REFERENCE
  if (t.includes("order") && (t.includes("status") || t.includes("update") || t.includes("progress") || t.includes("ready") || t.includes("track")))
    return "For order updates, WhatsApp Ridhor directly on 076 760 4350 with your order reference number. He will check the workshop and let you know. If you do not have a reference yet, send your name and what you dropped off.";

  // BOOK A CALL / CALLBACK
  if (t.includes("book") || t.includes("callback") || t.includes("call me") || t.includes("appointment") || t.includes("visit") || t.includes("come in"))
    return "Want Ridhor to call you? Send me your name, number, and what you need done. I will pass it straight to him. Or call the office on " + OFFICE_NUMBER + " to book a time to bring items in.";

  // COMPLAINT / PROBLEM
  if (t.includes("complaint") || t.includes("problem") || t.includes("unhappy") || t.includes("not happy") || t.includes("issue") || t.includes("wrong"))
    return "I am sorry to hear that. Please WhatsApp Ridhor directly on 076 760 4350 or email " + OFFICE_EMAIL + " with details. He takes quality seriously and will sort it out. Your order reference will help speed things up.";

  // HOW TO ORDER / PROCESS
  if ((t.includes("how") && t.includes("order")) || t.includes("process") || t.includes("steps") || t.includes("how does it work") || t.includes("what do i do"))
    return "How it works:\n1. Send a pic or description of what you need coated\n2. Get an estimate (subject to inspection)\n3. Bring items to our workshop during business hours\n4. We blast, pre-treat, and coat\n5. We let you know when it is ready\n6. Pay (COD) and collect\n\nEasy! Got something in mind?";

  // RECOMMEND / REFER
  if (t.includes("recommend") || t.includes("refer") || t.includes("friend") || t.includes("family") || t.includes("someone"))
    return "We love referrals! Share our number 060 507 4461 or Facebook page " + FACEBOOK + " with them. Word of mouth keeps us going since 1988!";

  // EMERGENCY / URGENT
  if (t.includes("urgent") || t.includes("emergency") || t.includes("asap") || t.includes("rush"))
    return "For urgent jobs, WhatsApp Ridhor directly on 076 760 4350. He can assess if we can fast-track your order. Rush jobs may incur a surcharge.";

  // MATERIAL TYPES
  if (t.includes("material") || t.includes("what can you coat") || t.includes("can you do") && (t.includes("wood") || t.includes("plastic") || t.includes("aluminium") || t.includes("steel")))
    return "We coat all metals that can handle 200C+: steel, aluminium, cast iron, stainless steel. No plastic, wood, or fibreglass. Items unable to withstand 200C must be declared before work begins.";

  // COLLECTION / STORAGE
  if (t.includes("collect") || t.includes("pickup") || t.includes("storage") || t.includes("uncollected"))
    return "Items must be collected within 7 working days of completion. Late collection incurs 7% daily storage surcharge. No items released without full payment. Uncollected items may be sold to recover costs.";

  // COASTAL / WARRANTY
  if (t.includes("coastal") || t.includes("sea") || t.includes("beach") || t.includes("salt") || t.includes("warranty") || t.includes("guarantee"))
    return "No warranties apply within 15km of shoreline. Powder coating is decorative, not anti-corrosive. Coastal work at client's risk. Outdoor items should be stainless steel, aluminium, or galvanised.";

  // LATENT DEFECTS
  if (t.includes("defect") || t.includes("crack") || t.includes("warp") || t.includes("distort") || t.includes("hidden"))
    return "We are not liable for latent defects revealed during work (cracked welds, corrosion, delamination, warping). All blasting and coating at client's risk. Items unable to withstand 200C must be declared.";

  // SHOTBLASTING LIABILITY
  if ((t.includes("shotblast") || t.includes("shot blast")) && (t.includes("risk") || t.includes("liable") || t.includes("damage")))
    return "Shotblasting is strictly at client's risk. Abrasive process may expose underlying defects. We are not liable for cracking, chipping, pitting, or structural weaknesses revealed during blasting.";

  // PRE-BLASTING PREP
  if (t.includes("prepare") || t.includes("before blast") || t.includes("plastic") || t.includes("glass") || t.includes("hydraulic"))
    return "Before blasting: Remove plastic, brittle, or malleable components. Disconnect hydraulics. Empty tanks or declare contents. Remove glass/lights/windows where possible. No liability for breakage.";

  // MAINTENANCE
  if (t.includes("maintenance") || t.includes("clean") || t.includes("care") || t.includes("look after") || t.includes("last longer"))
    return "Coating longevity depends on maintenance: drying, wiping, cleaning, rinsing, protective treatments. Keep maintenance records. Outdoor items should be stainless steel, aluminium, or galvanised.";

  // PAYMENT / COD
  if (t.includes("pay") || t.includes("payment") || t.includes("cod") || t.includes("release"))
    return "Strict COD - no work released without full payment. Payment must reflect before collection. Custom materials paid upfront. Uncollected items may be sold. Accounts: " + OFFICE_EMAIL + " / " + OFFICE_NUMBER;

  // OWNERSHIP / IP
  if (t.includes("intellectual") || t.includes("ip") || t.includes("ownership") || t.includes("design") || t.includes("copy"))
    return "All processes, colour formulations, and finishes remain Solomon Coatings intellectual property. Custom designs do not transfer to client unless agreed in writing. Items remain our property until paid in full.";

  // COLOUR VARIATIONS
  if (t.includes("batch") || t.includes("colour match") || t.includes("color match") || t.includes("shade") || t.includes("variation"))
    return "Colours may vary by batch every 4-6 months. Standard: 2-ton batches. Specials: 500kg. Customs: 100kg. Decorative finishes may differ from digital references.";

  // PRIMER / TOP COAT
  if (t.includes("primer") || t.includes("top coat") || t.includes("etch") || t.includes("paint"))
    return "If primed: top-coat within 12-24 hours. Etch primers 15-40um DFT. We can apply high-heat paints (700-900C), MIO, polyurethane, DTM. Client-supplied spec sheets preferred.";

  // WETSPRAY
  if (t.includes("wetspray") || t.includes("wet spray") || t.includes("wet paint") || (t.includes("custom") && t.includes("blast")))
    return "Wetspray jobs and custom shotblasting: contact Ridhor directly on 076 760 4350 or email " + QUOTE_EMAIL + " for assessment and quote.";

  // QUOTES
  if (t.includes("quote") || t.includes("quotation") || t.includes("estimate"))
    return "For a quote: WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + ". Send a pic and description. All quotes based on info provided, subject to change on inspection. Acceptance = agreement to full T&Cs.";

  // ACCOUNTS
  if (t.includes("account") || t.includes("statement") || t.includes("invoice") || t.includes("balance"))
    return "For accounts: Email " + OFFICE_EMAIL + " or call " + OFFICE_NUMBER + ". They will check and get back to you.";

  // RIDHOR
  if ((t.includes("speak") || t.includes("talk") || t.includes("call")) && (t.includes("ridhor") || t.includes("owner") || t.includes("boss")))
    return "Ridhor: 076 760 4350 (WhatsApp/call) or " + QUOTE_EMAIL + ". Office: " + OFFICE_NUMBER + " - ask for him.";

  // BULK
  if (t.includes("bulk") || t.includes("discount") || t.includes("volume") || t.includes("commercial"))
    return "Bulk discounts up to 10%. WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + " with your requirements for a tailored quote.";

  // SOCIAL
  if (t.includes("facebook") || t.includes("social") || t.includes("tiktok"))
    return "Facebook: " + FACEBOOK + "\nTikTok: " + TIKTOK + "\nWhatsApp: 060 507 4461\nSee our work and latest projects!";

  // TRUCK
  if (t.includes("truck") || t.includes("bakkie") || t.includes("flatbed") || t.includes("ldv"))
    return "Shot blasting 5m flatbed: R5,000-R7,500 excl VAT. No rubber. Grit/slag 0.12-0.4mm at 6 bar. For custom/wetspray contact Ridhor: 076 760 4350.";

  // BLASTING
  if (t.includes("blast") || t.includes("sandblast") || t.includes("shot blast"))
    return "Blasting: R8-R12/kg excl VAT. Truck: R5,000-R7,500. Medium: Grit/slag 0.12-0.4mm, 6 bar, 10mm nozzle. All blasting at client's risk. Remove plastic/glass/hydraulics before bringing.";

  // RUST
  if (t.includes("rust")) return "Rusted items: Blasting R8-R12/kg excl VAT. Severity determines price. May reveal hidden defects. All quotes subject to inspection.";

  // PRICING
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("charge") || t.includes("rate")) return QR["pricing"];

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
    return "Rims: R1,000-R1,500/set of 4 (10-15\"). Excl VAT. Customer MUST remove tyres. Price depends on colour and prep. WhatsApp Ridhor: 076 760 4350.";

  // GATES
  if (t.includes("gate") || t.includes("fence") || t.includes("burglar"))
    return "Gates/bars/rails/balustrades: Per kg. Coating R15-R23/kg, Blasting R8-R12/kg. Oversized +6m: R1000 setup. WhatsApp Ridhor: 076 760 4350.";

  // SHEET METAL
  if (t.includes("sheet") || t.includes("mesh") || t.includes("panel"))
    return "Sheet metal/mesh: Standard colours R175-R250/sqm. Hammered R225+. Metallics R300+. Excl VAT. Bulk discounts up to 10%.";

  // CHASSIS
  if (t.includes("chassis") || t.includes("trailer"))
    return "Chassis/trailers: Coating R15-R23/kg, Blasting R8-R12/kg. Oversized surcharge may apply. WhatsApp pics to Ridhor: 076 760 4350.";

  // MINIMUM
  if ((t.includes("minimum") || t.includes("small")) && t.includes("job"))
    return "Minimum charges: R173.99 black/white, R225 hammered, R300+ metallics. Excl VAT.";

  // TYRES
  if (t.includes("tyre") || t.includes("tire")) return "Customer MUST remove tyres from rims. We do NOT remove tyres.";

  // VAT
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated. Minimum charges exclude VAT.";

  // SATURDAY
  if (t.includes("saturday") || t.includes("weekend") || t.includes("sunday"))
    return "Closed Saturdays & Sundays. Hours: Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM.";

  // OVERSIZED
  if ((t.includes("oversized") || t.includes("large")) && (t.includes("item") || t.includes("job")))
    return "Large items (6m-7.2m long, 2.2m-2.5m high): higher rate. Minimum R1000 setup fee excl VAT.";

  // LOADSHEDDING
  if (t.includes("loadshedding") || t.includes("power") || t.includes("delay") || t.includes("weather"))
    return "Timelines may be affected by loadshedding or weather. We will keep you updated if there are delays.";

  // ORDER REFERENCE GENERATOR
  if (t.includes("reference") || t.includes("order number") || t.includes("job number") || t.includes("ref"))
    return "Your reference number is: " + getOrderRef() + "\n\nUse this when contacting us about your order. Save it! For a formal quote, WhatsApp Ridhor on 076 760 4350.";

  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI", established: 1988, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/", function(req, res) {
  res.json({ service: "Solomon Coatings WhatsApp Bot", status: "running", version: "6.0", features: ["Smart replies", "T&Cs", "Gallery links", "Order references", "Callback booking", "Photo forwarding", "After-hours auto-reply"] });
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

          // AFTER HOURS CHECK
          if (isAfterHours() && type !== "image") {
            console.log("[" + from + "]: After-hours message");
            await sendMessage(from, "Thanks for your message! Our workshop is currently closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). I will pass your details to Ridhor and he will get back to you during business hours. For urgent matters, WhatsApp him directly on 076 760 4350.\n\nIn the meantime, you can ask me about pricing, colours, or our services - I am always here!");
            if (text) {
              await sendMessage(PERSONAL_NUMBER, "After-hours message from " + from + ": " + text);
            }
            continue;
          }

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
  } catch (e) { console.error("WEBHOOK ERROR:", e.message); }
});
app.listen(PORT, function() {
  console.log("\nSOLOMON COATINGS AI v6.0 - Port " + PORT);
  console.log("Features: Gallery | T&Cs | Order Refs | Callbacks | Complaints | After-hours | Referrals");
  console.log("Hours: Mon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM | Sat-Sun: After-hours mode");
  console.log("");
});
process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
