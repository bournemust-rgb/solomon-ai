require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
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

// ============ FUN FALLBACKS ============
var funFallbacks = [
  "Ag sorry, I'm just a powder coating oom, not Google! \n\nTry *help* to see my secret menu of tricks, or WhatsApp Ridhor on 076 760 4350.",
  "Eish, you got me there! I know coating, not that. \n\nType *help* for what I CAN do, or chat to Ridhor: 076 760 4350.",
  "That one's above my pay grade! I'm here for powder coating, colours, and quotes. \n\nType *help* or WhatsApp Ridhor: 076 760 4350.",
  "Ha! If only I knew everything. I stick to what I'm good at - coating. \n\nType *help* for my menu or call Ridhor: 076 760 4350.",
  "Sorry my bru, that's not in my toolbox. \n\nTry *help* to see what I can answer, or WhatsApp Ridhor: 076 760 4350."
];

// ============ DAILY AFFIRMATIONS ============
var affirmations = [
  "Fun fact: A well-coated gate is the silent guardian of your driveway. Sleep well tonight!",
  "Did you know? Powder coating is tougher than your mother-in-law's opinions. And that's saying something.",
  "Hot tip: Black powder coat absorbs less heat than you'd think. Science, my bru.",
  "Random thought: Every time you powder coat something, an angel gets its wings. Or at least a rust-free gate.",
  "Life advice: When in doubt, coat it black. It matches everything. Even your soul. (Just kidding.)",
  "Weekend wisdom: A coated rim is a happy rim. Don't let your rims be sad. Bring them in.",
  "Solomon truth: We've been coating since '88. That's before Google. Before smartphones. Before... basically everything."
];

function randomAffirmation() {
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

function randomFallback() {
  return funFallbacks[Math.floor(Math.random() * funFallbacks.length)];
}

// ============ UTILITIES ============
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

// ============ PRICE CALCULATOR - DO NOT TOUCH ============
function estimatePrice(text) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  var vatRate = 0.15;

  if (t.includes("rim")) {
    var qty = t.match(/(\d+)/); qty = qty ? parseInt(qty[1]) : 4;
    var sets = Math.ceil(qty / 4);
    var rimColour = (t.includes("metallic")||t.includes("gold")||t.includes("bronze")||t.includes("charcoal")||t.includes("silver")||t.includes("color")||t.includes("colour")) ? "premium" : "standard";
    var rimLow = rimColour === "standard" ? 1000 : 1200;
    var rimHigh = rimColour === "standard" ? 1200 : 1500;
    var rimTotalLow = rimLow * sets, rimTotalHigh = rimHigh * sets;
    var rimVatLow = Math.round(rimTotalLow * vatRate), rimVatHigh = Math.round(rimTotalHigh * vatRate);
    return "RIMS ESTIMATE - Ref: " + ref + "\n\n" + qty + " rims = " + sets + " set(s)\nColour: " + (rimColour === "standard" ? "Standard" : "Premium") + "\n\nExcl VAT: R" + rimTotalLow.toLocaleString() + " - R" + rimTotalHigh.toLocaleString() + "\nVAT (15%): R" + rimVatLow.toLocaleString() + " - R" + rimVatHigh.toLocaleString() + "\nIncl VAT: R" + (rimTotalLow+rimVatLow).toLocaleString() + " - R" + (rimTotalHigh+rimVatHigh).toLocaleString() + "\n\nCustomer MUST remove tyres. Estimate only. WhatsApp Ridhor: 076 760 4350.\n\n" + randomAffirmation();
  }

  if (t.includes("kg") || t.includes("gate") || t.includes("burglar") || t.includes("fence") || t.includes("railing") || t.includes("balustrade")) {
    var kg = t.match(/(\d+)\s*kg/); kg = kg ? parseInt(kg[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 10);
    var isPremium = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("silver")||t.includes("blue")||t.includes("red")||t.includes("green")||t.includes("yellow")||t.includes("colour")||t.includes("color"));
    var rateLow = isPremium ? 17 : 16, rateHigh = isPremium ? 20 : 16;
    var coatingLow = kg * rateLow, coatingHigh = kg * rateHigh;
    var blastOnly = ((t.includes("blast only")||t.includes("sandblast only")||t.includes("blasting only")) && !t.includes("coat"));
    if (blastOnly) {
      var bl = kg*8, bh = kg*12;
      var bvl = Math.round(bl*vatRate), bvh = Math.round(bh*vatRate);
      return "BLASTING ONLY ESTIMATE - Ref: " + ref + "\n\n" + kg + "kg\nR8-R12/kg\n\nExcl VAT: R" + bl.toLocaleString() + " - R" + bh.toLocaleString() + "\nVAT: R" + bvl.toLocaleString() + " - R" + bvh.toLocaleString() + "\nIncl VAT: R" + (bl+bvl).toLocaleString() + " - R" + (bh+bvh).toLocaleString() + "\n\nEstimate only.\n\n" + randomAffirmation();
    }
    var vl = Math.round(coatingLow*vatRate), vh = Math.round(coatingHigh*vatRate);
    var msg = "GATE/PER KG ESTIMATE - Ref: " + ref + "\n\nWeight: " + kg + " kg\nColour: " + (isPremium ? "Premium (R"+rateLow+"-R"+rateHigh+"/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + coatingLow.toLocaleString() + " - R" + coatingHigh.toLocaleString() + "\nVAT (15%): R" + vl.toLocaleString() + " - R" + vh.toLocaleString() + "\nTOTAL (incl VAT): R" + (coatingLow+vl).toLocaleString() + " - R" + (coatingHigh+vh).toLocaleString();
    if (kg > 100) msg += "\n\nBulk discount up to 10% may apply.";
    msg += "\n\nEstimate only. WhatsApp Ridhor: 076 760 4350.\n\n" + randomAffirmation();
    return msg;
  }

  if (t.includes("sheet") || t.includes("mesh")) {
    var sqm = t.match(/(\d+)\s*sqm/); sqm = sqm ? parseInt(sqm[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 5);
    var sp = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("colour")||t.includes("color"));
    var sl = sp?251:175, sh = sp?350:250;
    var stl = sqm*sl, sth = sqm*sh;
    var svl = Math.round(stl*vatRate), svh = Math.round(sth*vatRate);
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\n" + sqm + " sqm\nColour: " + (sp?"Premium":"Standard") + "\n\nExcl VAT: R" + stl.toLocaleString() + " - R" + sth.toLocaleString() + "\nVAT: R" + svl.toLocaleString() + " - R" + svh.toLocaleString() + "\nIncl VAT: R" + (stl+svl).toLocaleString() + " - R" + (sth+svh).toLocaleString() + "\n\n" + randomAffirmation();
  }

  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) {
    var tl=5000, th=7500;
    return "TRUCK BLASTING ESTIMATE - Ref: " + ref + "\n\n5m flatbed\n\nExcl VAT: R"+tl.toLocaleString()+" - R"+th.toLocaleString()+"\nVAT: R"+Math.round(tl*vatRate).toLocaleString()+" - R"+Math.round(th*vatRate).toLocaleString()+"\nIncl VAT: R"+Math.round(tl*1.15).toLocaleString()+" - R"+Math.round(th*1.15).toLocaleString()+"\n\n" + randomAffirmation();
  }
  return null;
}
// ============ END CALCULATOR - DO NOT TOUCH ============

var QR = {
  "hi":"Hi there! Solomon Coatings here - since 1988.\n\nNeed pricing, a quote, or just curious? Just ask! Type *help* to see everything I can do.",
  "hello":"Hi there! Solomon Coatings here.\n\nAsk me anything about powder coating, or type *help* for the secret menu.",
  "hey":"Howzit! What can I help with?\n\nType *help* for the full list of tricks I can do.",
  "howzit":"Howzit! What can I help with?\n\nType *help* for the full menu.",
  "good morning":"Morning! Solomon Coatings here.\n\nType *help* to see what I can do, or just ask your question!",
  "menu":"SOLOMON COATINGS - Since 1988\n\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461\n\nType *help* for more options!",
  "pricing":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor a calculated estimate: quote 20kg gate black",
  "colours":"Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nSee examples: "+FACEBOOK,
  "hours":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "turnaround":"Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "delivery":"R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
  "contact":"060 507 4461 | Office: "+OFFICE_NUMBER+" | Email: "+OFFICE_EMAIL+" | FB: "+FACEBOOK+" | TikTok: "+TIKTOK,
  "help":"SECRET MENU - Reply with a number:\n\n1. Pricing\n2. Colours\n3. Get a quote estimate\n4. Turnaround times\n5. Business hours\n6. Delivery & collection\n7. Blasting services\n8. T&Cs & warranties\n9. View our gallery\n10. Leave a review\n11. Book a callback\n12. Talk to Ridhor\n13. Account queries\n\nOr just ask your question!",
  "1":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor a calculated estimate: quote 20kg gate black",
  "2":"COLOURS\nStandard: Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nSee: "+FACEBOOK,
  "3":"Send me a quote request like:\n- quote 20kg gate charcoal\n- quote 4 rims metallic\n- quote 10sqm sheet black\n- quote truck blasting\n- quote 20kg blasting only\n\nI'll calculate it with VAT!",
  "4":"TURNAROUND\nUnder 1 ton: 3 working days.\nOver 1 ton: 5-8 working days.\nTimelines affected by loadshedding/weather.",
  "5":"BUSINESS HOURS\nMon-Thurs: 8AM-4:45PM\nFri: 8AM-2:45PM\nClosed Saturdays & Sundays.",
  "6":"DELIVERY & COLLECTION\nR150 delivery Cape Town metro.\nFree collection from workshop.\nItems must be collected within 7 days.\nLate collection: 7% daily storage fee.",
  "7":"BLASTING SERVICES\nSandblasting/Shot blasting: R8-R12/kg (blasting only)\nTruck blasting (5m): R5,000-R7,500\nMedium: Grit/slag 0.12-0.4mm, 6 bar\n\nAll blasting at client's risk.\nRemove plastic/glass/hydraulics before bringing.",
  "8":"TERMS & CONDITIONS\n- COD only - no release without payment\n- No coastal warranties (within 15km)\n- 7% daily storage after 7 days\n- All blasting at client's risk\n- Items remain our property until paid\n\nFull document: email "+OFFICE_EMAIL,
  "9":"GALLERY\nCheck our work on Facebook: "+FACEBOOK+"\nTikTok: "+TIKTOK+"\n\nWe post real jobs regularly!",
  "10":"REVIEW US\nLeave a review: "+GOOGLE_REVIEW+"\nOr on Facebook: "+FACEBOOK+"\n\nThank you for supporting us since 1988!",
  "11":"BOOK A CALLBACK\nWant Ridhor to call you?\nSend your name, number, and what you need.\nOr call the office: "+OFFICE_NUMBER,
  "12":"TALK TO RIDHOR\nWhatsApp: 076 760 4350\nEmail: "+QUOTE_EMAIL+"\nOffice: "+OFFICE_NUMBER,
  "13":"ACCOUNT QUERIES\nEmail: "+OFFICE_EMAIL+"\nPhone: "+OFFICE_NUMBER+"\n\nThey'll check your account and get back to you.",
  "thanks":"Pleasure! Anything else?",
  "thank you":"Only a pleasure!",
  "bye":"Cheers! Sien jou later."
};

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    return true;
  } catch(e) { return false; }
}

// ============ SMART MATCH - CALCULATOR RUNS FIRST - DO NOT TOUCH LINE BELOW ============
function smartMatch(text, fromNumber, session) {
  var t = text.toLowerCase().trim();
  var calcResult = estimatePrice(text);
  if (calcResult) return calcResult;
  // ============ END CALCULATOR FIRST - DO NOT TOUCH LINE ABOVE ============
  
  if (QR[t]) return QR[t];
  
  if (t.includes("affirmation")||t.includes("fact")||t.includes("wisdom")||t.includes("tip")) return randomAffirmation();
  if (t.includes("reference")||t.includes("order number")||t.includes("job number")) return "Your reference: " + getOrderRef() + "\n\nUse this when contacting us.";
  if (t.includes("invoice")&&(t.includes("send")||t.includes("email"))) return "Send your order reference and I'll arrange your invoice. Or call "+OFFICE_NUMBER+".";
  if (t.includes("how busy")||t.includes("queue")) return "For real-time wait time, WhatsApp Ridhor on 076 760 4350.";
  if ((t.includes("show")||t.includes("see")||t.includes("example"))&&(t.includes("colour")||t.includes("black")||t.includes("white")||t.includes("red")||t.includes("blue"))) return "See colours on Facebook: "+FACEBOOK+" and TikTok: "+TIKTOK;
  if (t.includes("review")||t.includes("rate")||t.includes("feedback")) return "Leave a review: "+GOOGLE_REVIEW+"\nThank you since 1988!";
  if (t.includes("gallery")||t.includes("portfolio")||t.includes("past job")) return "See our work: "+FACEBOOK+" | "+TIKTOK;
  if (t.includes("terms")||t.includes("t&c")||t.includes("conditions")) return QR["8"];
  if (t.includes("order")&&(t.includes("status")||t.includes("update")||t.includes("ready"))) return "For order updates, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("book")||t.includes("callback")||t.includes("call me")) return QR["11"];
  if (t.includes("complaint")||t.includes("problem")||t.includes("unhappy")) return "Sorry! WhatsApp Ridhor on 076 760 4350 or email "+OFFICE_EMAIL;
  if ((t.includes("how")&&t.includes("order"))||t.includes("process")||t.includes("steps")) return "1. Send pic 2. Get estimate 3. Bring items 4. We coat 5. Pay (COD) 6. Collect";
  if (t.includes("recommend")||t.includes("refer")) return "We love referrals! Share 060 507 4461 or "+FACEBOOK;
  if (t.includes("urgent")||t.includes("emergency")||t.includes("asap")) return "For urgent jobs, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("material")||t.includes("what can you coat")||t.includes("can you coat")||t.includes("do you coat")) return "We coat metals handling 200C+: steel, aluminium, cast iron. No plastic, wood, fibreglass.";
  if (t.includes("collect")||t.includes("storage")) return "Collect within 7 days. Late: 7% daily storage. No release without payment.";
  if (t.includes("coastal")||t.includes("sea")||t.includes("warranty")||t.includes("guarantee")) return "No warranties within 15km of shoreline. Coastal work at client risk.";
  if (t.includes("defect")||t.includes("crack")||t.includes("warp")) return "Not liable for latent defects. All work at client risk.";
  if (t.includes("plastic")||t.includes("glass")||t.includes("hydraulic")) return "Before blasting: Remove plastic, glass, hydraulics. Empty tanks.";
  if (t.includes("maintenance")||t.includes("clean")||t.includes("look after")) return "Maintain with drying, wiping, cleaning. Keep records.";
  if (t.includes("pay")||t.includes("payment")||t.includes("cod")) return "Strict COD. No release without payment. Accounts: "+OFFICE_EMAIL;
  if (t.includes("intellectual")||t.includes("ownership")) return "All processes remain Solomon Coatings IP. Items ours until paid.";
  if (t.includes("batch")||t.includes("colour match")) return "Colours vary by batch every 4-6 months.";
  if (t.includes("primer")||t.includes("top coat")||t.includes("etch")) return "Primed: top-coat within 12-24hrs. High-heat paints available.";
  if (t.includes("wetspray")||t.includes("wet spray")) return "Wetspray: Contact Ridhor 076 760 4350 or "+QUOTE_EMAIL;
  if (t.includes("account")||t.includes("statement")||t.includes("balance")) return QR["13"];
  if ((t.includes("speak")||t.includes("talk"))&&(t.includes("ridhor")||t.includes("owner")||t.includes("boss"))) return QR["12"];
  if (t.includes("bulk")||t.includes("discount")||t.includes("volume")) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("facebook")||t.includes("social")||t.includes("tiktok")) return "FB: "+FACEBOOK+" | TikTok: "+TIKTOK;
  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) return "Truck blasting: R5,000-R7,500 excl VAT. No rubber.";
  if (t.includes("blast")||t.includes("sandblast")) return "Blasting: R8-R12/kg (only). Truck: R5,000-R7,500. Client risk.";
  if (t.includes("rust")) return "Rusted items: Blasting R8-R12/kg. May reveal defects.";
  if (t.includes("price")||t.includes("cost")||t.includes("how much")) return QR["pricing"];
  if (t.includes("colour")||t.includes("color")||t.includes("finish")||t.includes("ral")) return QR["colours"];
  if (t.includes("hour")||t.includes("open")||t.includes("close")) return QR["hours"];
  if (t.includes("turnaround")||t.includes("how long")) return QR["turnaround"];
  if (t.includes("deliver")||t.includes("where")||t.includes("address")) return QR["delivery"];
  if (t.includes("contact")||t.includes("email")||t.includes("phone")) return QR["contact"];
  if (t.includes("rim")||t.includes("wheel")||t.includes("mag")) return "Rims: R1,000-R1,500/set of 4. Remove tyres. For estimate: quote 4 rims black";
  if (t.includes("gate")||t.includes("fence")||t.includes("burglar")) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if (t.includes("sheet")||t.includes("mesh")||t.includes("panel")) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if (t.includes("chassis")||t.includes("trailer")) return "Chassis: R16/kg B/W, R17-R20/kg premium. WhatsApp pics: 076 760 4350.";
  if (t.includes("minimum")||t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (t.includes("tyre")||t.includes("tire")) return "Customer MUST remove tyres. We do NOT remove tyres.";
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if (t.includes("saturday")||t.includes("weekend")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if ((t.includes("oversized")||t.includes("large"))&&t.includes("item")) return "Large items (6m-7.2m): R1000 setup fee.";
  if (t.includes("loadshedding")||t.includes("delay")) return "Timelines affected by loadshedding/weather.";
  if (t.includes("rain")) return "Once cured, powder coating is weather-resistant. Fresh coating avoid rain 24hrs.";
  if (t.includes("pizza")||t.includes("sun")||t.includes("google")) return "Ha! I'm a coating oom, not Google. But I CAN tell you about powder coating! Type *help* for my menu.";
  
  return randomFallback();
}

app.get("/health", function(req, res) { res.json({ status:"healthy", service:"Solomon Coatings AI", version:"10.0" }); });
app.get("/", function(req, res) { res.json({ service:"Solomon Coatings", version:"10.0" }); });
app.get("/webhook", function(req, res) {
  if (req.query["hub.mode"]==="subscribe"&&req.query["hub.verify_token"]===VT) return res.status(200).send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
  try {
    var entries = (req.body&&req.body.entry)?req.body.entry:[];
    for (var i=0; i<entries.length; i++) {
      var changes = entries[i].changes||[];
      for (var j=0; j<changes.length; j++) {
        var msgs = (changes[j].value&&changes[j].value.messages)?changes[j].value.messages:[];
        for (var k=0; k<msgs.length; k++) {
          var from=msgs[k].from, type=msgs[k].type;
          var text=(msgs[k].text&&msgs[k].text.body)?msgs[k].text.body.trim():null;
          var imageId=msgs[k].image?msgs[k].image.id:null;
          var afterHours=isAfterHours();

          if (type==="image"&&imageId) {
            var cap=msgs[k].image.caption||"";
            await forwardImageToOwner(imageId, from);
            await sendMessage(PERSONAL_NUMBER, "Image from "+from+(cap?" - "+cap:""));
            await sendMessage(from, "Thanks! Forwarded to Ridhor on 076 760 4350. He'll check now.");
            continue;
          }
          if (!text) continue;

          console.log("["+from+"]: \""+text+"\""+(afterHours?" [AFTER HOURS]":""));
          var session = await getSession(from);
          var match = smartMatch(text, from, session);
          
          if (afterHours) {
            match = "Our workshop is closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n" + match;
            await sendMessage(PERSONAL_NUMBER, "After-hours from "+from+": "+text);
          }
          await sendMessage(from, match);
          session.history.push({role:"user",content:text},{role:"model",content:match});
          await saveSession(from, session);
        }
      }
    }
  } catch(e) { console.error("WEBHOOK ERROR:", e.message); }
});

app.listen(PORT, function() { console.log("\nSOLOMON COATINGS v10.0 - Port "+PORT+"\nCalculator: LOCKED | Fallbacks: Fun | Menu: Numbered | Affirmations: Random\n"); });
