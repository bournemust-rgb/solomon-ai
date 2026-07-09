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
  "hi": "Goeie dag! Solomon Coatings - since 1988. What can I help with?",
  "hello": "Hello! Solomon Coatings. What can I help with?",
  "hey": "Howzit! What can I do for you?",
  "howzit": "Howzit! What can I do for you?",
  "good morning": "Morning! Solomon Coatings. What can I help with today?",
  "menu": "SOLOMON COATINGS - Since 1988\n\nPowder Coating | Sandblasting | Shot Blasting | Pre-treatment\n\nPRICES (excl 15% VAT):\nRims: R1000-R1500/set of 4 (10-15\")\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting (5m): R5000-R7500\nOversized +3m: R1000 surcharge\nMin job: R200 (incl VAT)\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461 | " + OFFICE_NUMBER + "\n\nBulk discounts up to 10%. All quotes estimates subject to inspection.",
  "pricing": "PRICING (excl 15% VAT)\nRims: R1000-R1500/set of 4 (10-15\")\nSheet metal: R175-R350/sqm\nPer kg coating: R15-R23/kg\nBlasting: R8-R12/kg\nTruck blasting (5m): R5000-R7500\nOversized +3m: R1000 surcharge\nMin job: R200 (incl VAT)\n\nBulk discounts up to 10%. COD only.",
  "price": "PRICING (excl 15% VAT)\nRims: R1000-R1500/set\nSheet metal: R175-R350/sqm\nPer kg: R15-R23/kg\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R200",
  "colours": "COLOURS & FINISHES\nBlack/White: R175-R250/sqm (cheapest)\nMetallic (bronze, gold, charcoal): R251-R350/sqm\n\nStandard: Black, White, Silver, Grey, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nWe match RAL codes.",
  "colors": "COLOURS & FINISHES\nBlack/White: R175-R250/sqm (cheapest)\nMetallic: R251-R350/sqm\n\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture",
  "hours": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed Saturdays.",
  "turnaround": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days. Estimates confirmed on drop-off.",
  "time": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "delivery": "R150 delivery Cape Town metro. Free collection from workshop. COD only - payment before collection.",
  "contact": "WhatsApp: 060 507 4461 | Office: " + OFFICE_NUMBER + " | Email: " + OFFICE_EMAIL + " | Quotes: " + QUOTE_EMAIL + " | Facebook: " + FACEBOOK,
  "help": "I can help with pricing, colours, turnaround, delivery, blasting, quotes, or accounts. Just ask!",
  "thanks": "Pleasure! Anything else?",
  "thank you": "Only a pleasure!",
  "bye": "Cheers! Sien jou later."
};

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    await axios.post(
      "https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } }
    );
    console.log("Image forwarded to owner");
    return true;
  } catch(e) { console.error("Image forward failed:", e.response ? e.response.data : e.message); return false; }
}

function smartMatch(text) {
  var t = text.toLowerCase().trim();
  if (QR[t]) return QR[t];

  // Image follow-up
  if ((t.includes("image") || t.includes("photo") || t.includes("pic") || t.includes("picture")) && (t.includes("where") || t.includes("sent") || t.includes("go") || t.includes("see") || t.includes("receive")))
    return "Images go to Ridhor's personal WhatsApp (076 760 4350). He checks them directly. If urgent, WhatsApp him!";

  // WETSPRAY / CUSTOM BLASTING -> direct to Ridhor
  if (t.includes("wetspray") || t.includes("wet spray") || t.includes("wet paint") || (t.includes("custom") && t.includes("blast")))
    return "Wetspray jobs and custom shotblasting must be quoted directly by Ridhor. WhatsApp him on 076 760 4350 or email " + QUOTE_EMAIL + ". He'll assess and give you a proper quote.";

  // QUOTES
  if (t.includes("quote") || t.includes("quotation") || t.includes("estimate") || t.includes("custom"))
    return "For a proper quote, WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + ". Send a pic of what needs coating and he'll get back to you.";

  // ACCOUNTS / INVOICES
  if (t.includes("account") || t.includes("statement") || t.includes("owe") || t.includes("invoice") || t.includes("balance") || t.includes("pay") || t.includes("deposit"))
    return "For account queries: Email " + OFFICE_EMAIL + " or call the office on " + OFFICE_NUMBER + ". They'll check and get back to you.";

  // SPEAK TO RIDHOR
  if ((t.includes("speak") || t.includes("talk") || t.includes("call")) && (t.includes("ridhor") || t.includes("owner") || t.includes("boss") || t.includes("person") || t.includes("manager")))
    return "Ridhor's direct WhatsApp: 076 760 4350. Or call the office on " + OFFICE_NUMBER + " and ask for him.";

  // TECHNICAL / SALES
  if ((t.includes("technical") || t.includes("sales") || t.includes("spec")) && (t.includes("question") || t.includes("help") || t.includes("info")))
    return "For technical or sales queries, WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + ". He'll sort you out.";

  // BULK DISCOUNT
  if (t.includes("bulk") || t.includes("discount") || t.includes("large order") || t.includes("volume") || t.includes("commercial"))
    return "We offer bulk discounts up to 10% for large orders. For a bulk quote, WhatsApp Ridhor on 076 760 4350 or email " + QUOTE_EMAIL + " with your requirements.";

  // SOCIAL MEDIA
  if (t.includes("facebook") || t.includes("social") || t.includes("tiktok") || t.includes("instagram"))
    return "Follow us on Facebook: " + FACEBOOK + " | TikTok: " + TIKTOK + " | WhatsApp: 060 507 4461";

  // TRUCK BLASTING
  if ((t.includes("truck") || t.includes("bakkie") || t.includes("flatbed") || t.includes("ldv") || (t.includes("vehicle") && (t.includes("blast") || t.includes("coat")))))
    return "Shot blasting for a 5m flatbed truck: R5,000-R7,500 excl VAT. No rubber can be blasted. Price depends on condition. For custom/wetspray jobs, contact Ridhor directly on 076 760 4350.";

  // BLASTING ONLY
  if ((t.includes("blast") || t.includes("sandblast") || t.includes("shot blast")) && !t.includes("truck") && !t.includes("coating") && !t.includes("coat"))
    return "Sandblasting/shot blasting: R8-R12 per kg for rusted items (excl VAT). Truck blasting (5m): R5,000-R7,500. We can blast only or blast and coat. What do you need?";

  // BLASTING + COATING
  if (t.includes("blast") && (t.includes("coat") || t.includes("powder")))
    return "We blast first then coat. Blasting: R8-R12/kg. Coating: R15-R23/kg. Both excl VAT. Prices depend on condition. Bring it in for assessment.";

  // RUST
  if (t.includes("rust"))
    return "Rusted items need blasting first: R8-R12 per kg (excl VAT). How bad the rust is determines the final price. Bring it in and we'll assess. All quotes subject to inspection.";

  // PRICING
  if (t.includes("price") || t.includes("cost") || t.includes("how much") || t.includes("charge") || t.includes("rate")) return QR["pricing"];

  // COLOURS
  if (t.includes("colour") || t.includes("color") || t.includes("shade") || t.includes("finish") || t.includes("ral")) return QR["colours"];

  // HOURS
  if (t.includes("hour") || t.includes("open") || t.includes("close") || t.includes("what time") || t.includes("when are you")) return QR["hours"];

  // TURNAROUND
  if (t.includes("how long") || t.includes("turnaround") || t.includes("ready") || (t.includes("how") && t.includes("day")) || t.includes("week")) return QR["turnaround"];

  // DELIVERY / ADDRESS
  if (!t.includes("image") && !t.includes("photo") && !t.includes("pic")) {
    if (t.includes("deliver") || t.includes("collect") || (t.includes("where") && !t.includes("image")) || t.includes("address") || t.includes("location") || t.includes("direction")) return QR["delivery"];
  }

  // CONTACT
  if (t.includes("contact") || t.includes("email") || t.includes("phone") || t.includes("whatsapp") || t.includes("call you")) return QR["contact"];

  // SPECIFIC ITEMS
  if (t.includes("rim") || t.includes("wheel") || t.includes("mag"))
    return "Rims: R1,000-R1,500/set of 4 (10-15\"). Excl VAT. Customer MUST remove tyres. Price depends on colour and prep. Send a pic for accurate quote, or WhatsApp Ridhor on 076 760 4350.";

  if (t.includes("gate") || t.includes("fence"))
    return "Gates: Priced per kg or sqm depending on design. Blasting R8-R12/kg if rusted. Coating R15-R23/kg. Oversized +3m: R1,000 surcharge. Bulk discounts available. WhatsApp Ridhor: 076 760 4350.";

  if (t.includes("chassis") || t.includes("trailer"))
    return "Chassis/trailers: Coating R15-R23/kg, blasting R8-R12/kg if rusted. Oversized surcharge may apply. Need to see condition. WhatsApp pics to Ridhor on 076 760 4350.";

  if (t.includes("sheet") || t.includes("mesh") || t.includes("panel"))
    return "Sheet metal/mesh panels: Black/White R175-R250/sqm. Metallic colours R251-R350/sqm. Excl VAT. Bulk discounts up to 10%. Bring measurements for accurate quote.";

  if ((t.includes("minimum") || t.includes("small")) && t.includes("job"))
    return "Our minimum job charge is R200 (incl VAT). Even for small brackets or hinges. Bring it in and we'll sort you out.";

  if (t.includes("tyre") || t.includes("tire"))
    return "Customer MUST remove tyres from rims before bringing them in. We do NOT remove tyres. We only coat the rims.";

  if (t.includes("vat"))
    return "All prices exclude 15% VAT unless stated otherwise. The minimum job charge of R200 includes VAT.";

  if (t.includes("pay") || t.includes("payment") || t.includes("cod"))
    return "Payment is COD only. Money must be paid before items leave the premises. No credit. For account queries email " + OFFICE_EMAIL + " or call " + OFFICE_NUMBER + ".";

  if (t.includes("estimate") || t.includes("subject") || t.includes("change"))
    return "All prices quoted are ESTIMATES. If the item condition differs from what was described, we will re-quote on physical inspection. Ridhor reserves the right to adjust pricing.";

  if (t.includes("saturday") || t.includes("weekend"))
    return "We are closed on Saturdays and Sundays. Hours: Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM.";

  return null;
}

app.get("/health", function(req, res) {
  res.json({ status: "healthy", service: "Solomon Coatings AI", established: 1988, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get("/", function(req, res) {
  res.json({ service: "Solomon Coatings WhatsApp Bot", status: "running", version: "4.1" });
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
          var imageId = msgs[k].image ? msgs[k].image.id : null;

          if (type === "image" && imageId) {
            console.log("[" + from + "]: Sent an image (ID: " + imageId + ")");
            var caption = msgs[k].image.caption || "";
            var forwarded = await forwardImageToOwner(imageId, from);
            if (forwarded) {
              await sendMessage(PERSONAL_NUMBER, "New image from customer " + from + (caption ? " - Caption: " + caption : "") + ". Image forwarded above.");
            } else {
              await sendMessage(PERSONAL_NUMBER, "Customer " + from + " sent an image but forwarding failed. Check WhatsApp Business. Image ID: " + imageId);
            }
            await sendMessage(from, "Thanks! Forwarded your photo to Ridhor on 076 760 4350. He'll check it now. If urgent, WhatsApp him directly!");
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
  console.log("\nSOLOMON COATINGS AI v4.1 - Port " + PORT);
  console.log("Work: " + WORK_NUMBER + " | Office: " + OFFICE_NUMBER + " | Personal: " + PERSONAL_NUMBER);
  console.log("Email: " + OFFICE_EMAIL + " | Quotes: " + QUOTE_EMAIL);
  console.log("Hours: Mon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM | Closed Sat");
  console.log("Facebook: " + FACEBOOK);
  console.log("Bulk discounts: Up to 10%");
  console.log("");
});

process.on("unhandledRejection", function(r) { console.error("Unhandled:", r); });
process.on("uncaughtException", function(e) { console.error("Uncaught:", e); });
