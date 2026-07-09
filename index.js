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

var QR = {
  "hi": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions. Feel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "hello": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions. Feel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "hey": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions. Feel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "howzit": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions. Feel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "good morning": "Hi there! Welcome to the Solomon Coatings digital desk. We are busy keeping things looking sharp, but I am always here to handle your questions. Feel free to ask about our pricing, available colours, or trading hours - I am ready when you are!",
  "menu": "SOLOMON COATINGS - Since 1988\n\nPowder Coating | Sandblasting | Shot Blasting\n\nPRICES (excl 15% VAT):\nRims: R1000-R1500/set of 4\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting: R5000-R7500\nMin job: R173.99 black/white, R225 hammered, R300+ metallic\nOversized: R1000 setup fee\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461 | Office: " + OFFICE_NUMBER + "\n\nBulk discounts up to 10%. COD only. All quotes estimates subject to inspection.",
  "pricing": "PRICING (excl 15% VAT)\nRims: R1000-R1500/set of 4\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting: R5000-R7500\nMin job: R173.99 B/W, R225 hammered, R300+ metallic\nOversized +6m: R1000 setup fee\n\nBulk discounts up to 10%. COD only.",
  "colours": "COLOURS & FINISHES\nStandard: Black, White, Brown, Bronze, Charcoal - R175-R250/sqm\nHammered finishes: from R225\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nColours may vary by batch every 4-6 months.",
  "hours": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed Saturdays & Sundays.",
  "turnaround": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days. Timelines may be affected by loadshedding/weather.",
  "delivery": "R150 delivery Cape Town metro. Free collection from workshop. Items must be collected within 7 days of completion or 7% daily storage fee applies.",
  "contact": "WhatsApp: 060 507 4461 | Office: " + OFFICE_NUMBER + " | Email: " + OFFICE_EMAIL + " | Quotes: " + QUOTE_EMAIL + " | FB: " + FACEBOOK + " | TikTok: " + TIKTOK,
  "help": "I can help with pricing, colours, turnaround, delivery, blasting, quotes, accounts, T&Cs, or booking a callback from Ridhor. Just ask!",
  "thanks": "Pleasure! Anything else?",
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

  // COLLECTION / STORAGE
  if (t.includes("collect") || t.includes("pickup") || t.includes("storage") || t.includes("uncollected"))
    return "Items must be collected within 7 working days of completion. Late collection incurs a 7% daily storage surcharge. Damage during storage may require recoating fees. No items released without full payment.";

  // COASTAL / WARRANTY
  if (t.includes("coastal") || t.includes("sea") || t.includes("beach") || t.includes("salt") || t.includes("warranty") || t.includes("guarantee"))
    return "No warranties apply to items installed in coastal or sea-facing environments (within 15km of shoreline). Suppliers do not guarantee corrosion resistance in high-salinity zones. All coastal work at client's risk. Powder coating is decorative, not anti-corrosive.";

  // LATENT DEFECTS / LIABILITY
  if (t.includes("defect") || t.includes("crack") || t.includes("warp") || t.includes("distort") || t.includes("heat damage") || t.includes("hidden"))
    return "The Company is not liable for latent defects or concealed weaknesses discovered during work (cracked welds, corrosion, delamination, warping, heat distortion). All blasting and coating is done at the client's own risk. Items unable to withstand 200C must be declared.";

  // SHOTBLASTING LIABILITY
  if ((t.includes("shotblast") || t.includes("shot blast")) && (t.includes("risk") || t.includes("liable") || t.includes("damage") || t.includes("defect")))
    return "Shotblasting is done strictly at the client's risk. Blasting is abrasive and may expose or worsen underlying defects. The Company is not liable for cracking, chipping, pitting, delamination, or structural weaknesses revealed during blasting.";

  // PRE-BLASTING REQUIREMENTS
  if (t.includes("prepare") || t.includes("before blast") || t.includes("bring") && (t.includes("plastic") || t.includes("glass") || t.includes("hydraulic")))
    return "Before blasting: Remove plastic, brittle, or malleable components. Disconnect hydraulics. Empty tanks or declare contents. Remove glass/lights/windows where possible. No liability for breakage.";

  // MAINTENANCE
  if (t.includes("maintenance") || t.includes("clean") || t.includes("care") || t.includes("look after") || t.includes("last longer"))
    return "Coating longevity depends on regular maintenance: drying, wiping, cleaning, rinsing, and protective treatments. Keep maintenance records. The Company may advise but is not liable for failure to maintain. Outdoor items should be stainless steel, aluminium, or galvanised.";

  // PAYMENT / COD
  if (t.includes("pay") || t.includes("payment") || t.includes("cod") || t.includes("release"))
    return "Strict COD policy - no work released without full payment. Payment must reflect before collection. Custom materials must be paid upfront. Uncollected items may be sold to recover costs. For account queries: " + OFFICE_EMAIL + " or " + OFFICE_NUMBER + ".";

  // OWNERSHIP / IP
  if (t.includes("intellectual") || t.includes("ip") || t.includes("ownership") || t.includes("design") || t.includes("copy"))
    return "All processes, colour formulations, and specialised finishes remain the intellectual property of Solomon Coatings. Custom designs do not transfer to the client unless agreed in writing. All items remain Company property until paid in full.";

  // COLOUR VARIATIONS
  if (t.includes("batch") || t.includes("colour match") || t.includes("color match") || t.includes("shade") || t.includes("variation"))
    return "Colours may vary by batch every 4-6 months. Standard colours: 2-ton batches. Specials: 500kg. Customs: 100kg. Decorative finishes may differ from digital references. We'll match as close as possible.";

  // PRIMER / TOP COAT
  if (t.includes("primer") || t.includes("top coat") || t.includes("etch") || t.includes("paint"))
    return "If primed: customer must top-coat within 12-24 hours. Etch primers 15-40um DFT. We can apply high-heat paints (700-900C), MIO, polyurethane, DTM on request. Client-supplied spec sheets preferred.";

  // IMAGE FOLLOW-UP
  if ((t.includes("image") || t.includes("photo") || t.includes("pic")) && (t.includes("where") || t.includes("sent") || t.includes("go")))
    return "Images go to Ridhor's personal WhatsApp (076 760 4350). He checks them directly.";

  // SOCIAL MEDIA CONSENT
  if (t.includes("photo") && (t.includes("publish") || t.includes("social") || t.includes("post") || t.includes("permission")))
    return "By accepting our quotation, you grant permission for us to photograph and publish images of your items on social media. No personal information is disclosed (POPIA compliant). If you prefer we don't, let Ridhor know.";

  // WETSPRAY / CUSTOM BLASTING
  if (t.includes("wetspray") || t.includes("wet spray") || t.includes("wet paint") || (t.includes("custom") && t.includes("blast")))
    return "Wetspray jobs and custom shotblasting must be quoted directly by Ridhor. WhatsApp him on 076 760 4350 or email " + QUOTE_EMAIL + ".";

  // QUOTES
  if (t.includes("quote") || t.includes("quotation") || t.includes("estimate"))
    return "For a proper quote, WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + ". All quotations based on info provided and may be amended if specs change. Acceptance of quote = agreement to full T&Cs.";

  // ACCOUNTS
  if (t.includes("account") || t.includes("statement") || t.includes("invoice") || t.includes("balance"))
    return "For account queries: Email " + OFFICE_EMAIL + " or call " + OFFICE_NUMBER + ".";

  // SPEAK TO RIDHOR
  if ((t.includes("speak") || t.includes("talk") || t.includes("call")) && (t.includes("ridhor") || t.includes("owner") || t.includes("boss")))
    return "Ridhor's direct WhatsApp: 076 760 4350. Or call " + OFFICE_NUMBER + " and ask for him.";

  // BULK DISCOUNT
  if (t.includes("bulk") || t.includes("discount") || t.includes("volume") || t.includes("commercial"))
    return "We offer bulk discounts up to 10% for large orders. WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + " with your requirements.";

  // SOCIAL MEDIA
  if (t.includes("facebook") || t.includes("social") || t.includes("tiktok"))
    return "Facebook: " + FACEBOOK + " | TikTok: " + TIKTOK + " | WhatsApp: 060 507 4461";

  // TRUCK BLASTING
  if ((t.includes("truck") || t.includes("bakkie") || t.includes("flatbed") || t.includes("ldv")))
    return "Shot blasting 5m flatbed truck: R5,000-R7,500 excl VAT. No rubber blasted. Blasting medium: Grit/slag 0.12mm-0.4mm at 6 bar. For custom/wetspray jobs contact Ridhor: 076 760 4350.";

  // BLASTING
  if (t.includes("blast") || t.includes("sandblast") || t.includes("shot blast"))
    return "Blasting: R8-R12/kg excl VAT. Truck: R5,000-R7,500. Medium: Grit/slag 0.12-0.4mm, 6 bar, 10mm nozzle. All blasting at client's risk. Remove plastic/glass/hydraulics before bringing items.";

  // RUST
  if (t.includes("rust"))
    return "Rusted items: Blasting R8-R12/kg excl VAT. Severity determines final price. Blasting may reveal hidden defects. All quotes subject to inspection.";

  // PRICING
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("charge") || t.includes("rate")) return QR["pricing"];

  // COLOURS
  if (t.includes("colour") || t.includes("color") || t.includes("shade") || t.includes("finish") || t.includes("ral")) return QR["colours"];

  // HOURS
  if (t.includes("hour") || t.includes("open") || t.includes("close") || t.includes("what time")) return QR["hours"];

  // TURNAROUND
  if (t.includes("how long") || t.includes("turnaround") || t.includes("ready") || t.includes("day") || t.includes("week")) return QR["turnaround"];

  // DELIVERY
  if (t.includes("deliver") || t.includes("where") || t.includes("address") || t.includes("location")) return QR["delivery"];

  // CONTACT
  if (t.includes("contact") || t.includes("email") || t.includes("phone") || t.includes("whatsapp")) return QR["contact"];

  // RIMS
  if (t.includes("rim") || t.includes("wheel") || t.includes("mag"))
    return "Rims: R1,000-R1,500/set of 4 (10-15\"). Excl VAT. Customer MUST remove tyres. Price depends on colour and prep. WhatsApp Ridhor: 076 760 4350.";

  // GATES
  if (t.includes("gate") || t.includes("fence"))
    return "Gates/burglar bars/rails/balustrades charged per kg: Coating R15-R23/kg, Blasting R8-R12/kg. Oversized +6m: R1000 setup fee. WhatsApp Ridhor: 076 760 4350.";

  // SHEET METAL
  if (t.includes("sheet") || t.includes("mesh") || t.includes("panel"))
    return "Sheet metal/mesh: Black/White/Brown/Bronze/Charcoal R175-R250/sqm. Hammered R225+. Metallics R300+. Excl VAT. Bulk discounts up to 10%.";

  // CHASSIS / TRAILER
  if (t.includes("chassis") || t.includes("trailer"))
    return "Chassis/trailers: Coating R15-R23/kg, Blasting R8-R12/kg. Oversized surcharge may apply. WhatsApp pics to Ridhor on 076 760 4350.";

  // MINIMUM JOB
  if ((t.includes("minimum") || t.includes("small")) && t.includes("job"))
    return "Minimum charges: R173.99 for black/white, R225 for hammered finishes, R300+ for metallics. Excl VAT.";

  // TYRES
  if (t.includes("tyre") || t.includes("tire"))
    return "Customer MUST remove tyres from rims before bringing them in. We do NOT remove tyres.";

  // VAT
  if (t.includes("vat"))
    return "All prices exclude 15% VAT unless stated otherwise. Minimum charges exclude VAT.";

  // ESTIMATE / SUBJECT TO CHANGE
  if (t.includes("estimate") || t.includes("subject") || t.includes("change") || t.includes("revised"))
    return "All prices are ESTIMATES. Quotations based on info provided and may be amended if specs, quantities, or conditions change. Revised pricing communicated before continuation. Acceptance of quote = agreement to full T&Cs.";

  // SATURDAY / WEEKEND
  if (t.includes("saturday") || t.includes("weekend") || t.includes("sunday"))
    return "We are closed Saturdays and Sundays. Hours: Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM.";

  // OVERSIZED / LARGE ITEMS
  if (t.includes("oversized") || t.includes("large") && (t.includes("item") || t.includes("job")))
    return "Large items (6m-7.2m long, 2.2m-2.5m high) charged at higher rate. Minimum setup fee R1000 excl VAT for large items.";

  // LOADSHEDDING / DELAYS
  if (t.includes("loadshedding") || t.includes("power") || t.includes("delay") || t.includes("weather"))
    return "Timelines may be affected by loadshedding or weather conditions. We'll keep you updated if there are delays.";

  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI", established: 1988, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/", function(req, res) {
  res.json({ service: "Solomon Coatings WhatsApp Bot", status: "running", version: "5.0" });
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

          if (type === "image" && imageId) {
            console.log("[" + from + "]: Image " + imageId);
            var cap = msgs[k].image.caption || "";
            var fwd = await forwardImageToOwner(imageId, from);
            if (fwd) await sendMessage(PERSONAL_NUMBER, "New image from " + from + (cap ? " - " + cap : "") + ". Forwarded above.");
            else await sendMessage(PERSONAL_NUMBER, "Customer " + from + " sent image. Check WhatsApp Business. ID: " + imageId);
            await sendMessage(from, "Thanks! Forwarded to Ridhor on 076 760 4350. He'll check now. Urgent? WhatsApp him directly!");
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
  console.log("\nSOLOMON COATINGS AI v5.0 - Port " + PORT);
  console.log("T&Cs: Loaded | Coastal: No warranty | COD: Strict | Storage: 7 days");
  console.log("");
});
process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
