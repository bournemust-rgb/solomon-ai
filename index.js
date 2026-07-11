require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var delivery = require("./delivery");
var axios = require("axios");

var app = express();
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

var VT = process.env.WHATSAPP_VERIFY_TOKEN || "solomon_coatings_1988";
var PORT = process.env.PORT || 3000;
var PERSONAL_NUMBER = "27767604350";
var OFFICE_NUMBER = "0219052912";
var OFFICE_EMAIL = "populier@mweb.co.za";
var QUOTE_EMAIL = "infosc@mweb.co.za";
var FACEBOOK = "https://www.facebook.com/SolomonCoatings/";
var TIKTOK = "https://www.tiktok.com/@solomon.coatings";
var GOOGLE_REVIEW = "https://g.page/r/your-review-link";
var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

var funFallbacks = [
  "Ag sorry, I am just a powder coating oom, not Google! \n\nTry *menu* to see my secret menu, or WhatsApp Ridhor on 076 760 4350.",
  "Eish, you got me there! I know coating, not that. \n\nType *menu* to see what I am good at, or chat to Ridhor: 076 760 4350.",
  "That one is above my pay grade! I am here for powder coating, colours, and quotes. \n\nType *menu* or WhatsApp Ridhor: 076 760 4350.",
  "Ha! If only I knew everything. I stick to what I am good at - coating. \n\nType *menu* — I know a few things or call Ridhor: 076 760 4350.",
  "Sorry my bru, that is not in my toolbox. \n\nTry *menu* to see what I know, or WhatsApp Ridhor: 076 760 4350."
];

var affirmations = [
  "Fun fact: A well-coated gate is the silent guardian of your driveway. Sleep well tonight!",
  "Did you know? Powder coating is tougher than your mother-in-law opinions.",
  "Hot tip: Black powder coat absorbs less heat than you think. Science, my bru.",
  "Life advice: When in doubt, coat it black. It matches everything.",
  "Weekend wisdom: A coated rim is a happy rim. Do not let your rims be sad. Bring them in.",
  "Solomon truth: We have been coating since 88. That is before Google. Before smartphones."
];

function randomAffirmation() { return affirmations[Math.floor(Math.random() * affirmations.length)]; }
function randomFallback() { return funFallbacks[Math.floor(Math.random() * funFallbacks.length)]; }
function randomTPS() { var q = ["The customer is always right... whatever the cost.","We never lose. We either win or we learn.","Always do your best to give the customer what they want.","If the coating is right, the rust stays away.","Quality is remembered long after the price is forgotten.","A man's work is his signature.","We have been coating since 88. That is not luck. That is graft.","Patience in the booth, perfection on the metal.","Your name is on every job. Never forget that.","Do not cut corners. Corners are where the rust starts.","The metal does not lie.","A happy customer is a customer for life.","We do not follow trends. We set the standard.","Every gate, every rim, every bracket.","The oven does not care who you are.","Coat it once, coat it right. Comebacks cost more than pride.","In this trade, your reputation is your best tool."]; return q[Math.floor(Math.random()*q.length)]; }

function getOrderRef() {
  var d = new Date();
  return "SC" + d.getFullYear().toString().slice(-2) + ("0"+(d.getMonth()+1)).slice(-2) + ("0"+d.getDate()).slice(-2) + "-" + Math.floor(Math.random()*9000+1000);
}

function isAfterHours() {
  var now = new Date();
  var day = now.getDay(), hour = now.getHours(), min = now.getMinutes();
  var t = hour * 60 + min;
  if (day === 0 || day === 6) return true;
  if (day === 5 && t >= 885) return true;
  if (day >= 1 && day <= 4 && (t < 480 || t >= 1005)) return true;
  return false;
}

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

var QR = {
  "hi":"Hi there! Solomon Coatings here - since 1988.\n\nType *menu* to see our Secret List.\n\nOr just tell me what you need:\nGates/Fencing | Rims | Chassis | Sheet Metal | Trucks\n\nFor wetspray, connect to Ridhor directly.",
  "hello":"Hi there! Solomon Coatings here.\n\nType *menu* for the list, or just tell me what you need priced — gates, rims, steel, shotblasting, trucks.\n\nFor wetspray, I will put you through to Ridhor directly.",
  "hey":"Howzit!\n\nType *menu* for our Secret List, or tell me what you need:\nGates | Rims | Chassis | Sheet Metal | Trucks",
  "howzit":"Howzit!\n\nType *menu* for our Secret List, or tell me what you need priced.",
  "good morning":"Morning! Solomon Coatings here.\n\nType *menu* to see what I can help with, or tell me what you need priced!",
  "menu":"WHAT I CAN DO — pick a number:\n\n1. Pricing\n2. Colours\n3. Get a quote estimate\n4. Turnaround times\n5. Business hours\n6. Delivery & collection\n7. Blasting services\n8. T&Cs & warranties\n9. View our gallery\n10. Leave a review\n11. Book a callback\n12. Talk to Ridhor\n13. Account queries\n14. TPS Daily Wisdom\n\nOr just tell me what you need priced — gates, rims, steel, blasting, trucks.\n\nFor wetspray, I will connect you to Ridhor directly.",
  "pricing":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor a calculated estimate: quote 20kg gate black",
  "colours":"Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nSee examples: "+FACEBOOK,
  "hours":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "turnaround":"Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "delivery":"R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
  "contact":"060 507 4461 | Office: "+OFFICE_NUMBER+" | Email: "+OFFICE_EMAIL+" | FB: "+FACEBOOK+" | TikTok: "+TIKTOK,
  "help":"WHAT I CAN DO - pick a number:\n\n1. Pricing\n2. Colours\n3. Get a quote estimate\n4. Turnaround times\n5. Business hours\n6. Delivery & collection\n7. Blasting services\n8. T&Cs & warranties\n9. View our gallery\n10. Leave a review\n11. Book a callback\n12. Talk to Ridhor\n13. Account queries\n14. TPS Daily Wisdom\n\nOr just tell me what you need priced - gates, rims, steel, blasting, trucks.\n\nFor wetspray, I will connect you to Ridhor directly.",
  "1":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor a calculated estimate: quote 20kg gate black",
  "2":"COLOURS\nStandard: Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nSee: "+FACEBOOK,
  "3":"Send me a quote request like:\n- quote 20kg gate charcoal\n- quote 4 rims metallic\n- quote 10sqm sheet black\n- quote truck blasting\n- quote 20kg blasting only\n\nI will calculate it with VAT!",
  "4":"TURNAROUND\nUnder 1 ton: 3 working days.\nOver 1 ton: 5-8 working days.\nTimelines affected by loadshedding/weather.",
  "5":"BUSINESS HOURS\nMon-Thurs: 8AM-4:45PM\nFri: 8AM-2:45PM\nClosed Saturdays and Sundays.",
  "6":"DELIVERY - For a delivery quote, just type *delivery* and I will ask where you are, size, and if you need help loading.\n\nR150 Cape Town metro delivery. Free collection. 7% daily storage after 7 days.\n\nType *menu* to go back.",
  "7":"BLASTING SERVICES\nSandblasting/Shot blasting: R8-R12/kg (blasting only)\nTruck blasting (5m): R5,000-R7,500\nMedium: Grit/slag 0.12-0.4mm, 6 bar\n\nAll blasting at client risk.\nRemove plastic/glass/hydraulics before bringing.",
  "8":"TERMS AND CONDITIONS\n- COD only - no release without payment\n- No coastal warranties (within 15km)\n- 7% daily storage after 7 days\n- All blasting at client risk\n- Items remain our property until paid\n\nFull document: email "+OFFICE_EMAIL,
  "9":"GALLERY\nCheck our work on Facebook: "+FACEBOOK+"\nTikTok: "+TIKTOK+"\n\nWe post real jobs regularly!",
  "10":"REVIEW US\nLeave a review: "+GOOGLE_REVIEW+"\nOr on Facebook: "+FACEBOOK+"\n\nThank you for supporting us since 1988!",
  "11":"BOOK A CALLBACK\nWant Ridhor to call you?\nSend your name, number, and what you need.\nOr call the office: "+OFFICE_NUMBER,
  "12":"TALK TO RIDHOR\nWhatsApp: 076 760 4350\nEmail: "+QUOTE_EMAIL+"\nOffice: "+OFFICE_NUMBER,
  "13":"ACCOUNT QUERIES\nEmail: "+OFFICE_EMAIL+"\nPhone: "+OFFICE_NUMBER+"\n\nThey will check your account and get back to you.",
  "14":"TPS_PLACEHOLDER" + randomTPS() + \"\n\nType *menu* to go back.","thanks":"Pleasure! Anything else?",
  "thank you":"Only a pleasure!",
  "bye":"Cheers! Sien jou later."
};

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    if (!WA_TOKEN || !PHONE_ID) return false;
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN, "Content-Type": "application/json" } });
    return true;
  } catch(e) { console.error("forwardImage error:", e.response?.data || e.message); return false; }
}

function smartMatch(text, fromNumber, session) {
  var t = text.toLowerCase().trim();
  var calcResult = estimatePrice(text);
  if (calcResult) return calcResult;
  if (t === "14") return "TPS DAILY WISDOM - Tommy Phillip Solomon (1988)\n\n" + randomTPS() + "\n\nType *menu* to go back to the main list.";
  if (QR[t] && QR[t] !== "TPS_PLACEHOLDER") return QR[t];
  if (t.includes("affirmation")||t.includes("fact")||t.includes("wisdom")||t.includes("tip")) return randomAffirmation();
  if (t.includes("reference")||t.includes("order number")||t.includes("job number")) return "Your reference: " + getOrderRef();
  if (t.includes("invoice")&&(t.includes("send")||t.includes("email"))) return "Send your order reference and I will arrange your invoice. Or call "+OFFICE_NUMBER+".";
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
  if (t.includes("gate")||t.includes("fence")||t.includes("burglar")||t.includes("steel")||t.includes("security")) return "Gates/Steel/Security: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if (t.includes("sheet")||t.includes("mesh")||t.includes("panel")) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if (t.includes("chassis")||t.includes("trailer")) return "Chassis: R16/kg B/W, R17-R20/kg premium. WhatsApp pics: 076 760 4350.";
  if (t.includes("minimum")||t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (t.includes("tyre")||t.includes("tire")) return "Customer MUST remove tyres. We do NOT remove tyres.";
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if (t.includes("saturday")||t.includes("weekend")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if ((t.includes("oversized")||t.includes("large"))&&t.includes("item")) return "Large items (6m-7.2m): R1000 setup fee.";
  if (t.includes("loadshedding")||t.includes("delay")) return "Timelines affected by loadshedding/weather.";
  if (t.includes("rain")) return "Once cured, powder coating is weather-resistant. Fresh coating avoid rain 24hrs.";
  if (t.includes("pizza")||t.includes("sun")||t.includes("google")) return "Ha! I am a coating oom, not Google. But I CAN tell you about powder coating! Type *menu* — I know a few things.";
  return randomFallback();
}

async function handleMessage(text, from, session) {
  var t = text.toLowerCase().trim();
  var flow = session.flow || { state: "idle" };

  if (flow.state !== "idle" && /^(cancel|menu|help|stop)$/.test(t)) {
    flow.state = "idle"; session.flow = flow; await saveSession(from, session);
    return "No problem, cancelled.\n\n" + smartMatch(text, from, session);
  }

  // CONVERSATIONAL FLOW
  if (flow.state === "idle" && /^(hi|hello|hey|howzit|good morning|sup|yo|aweh)$/i.test(t)) {
    flow.state = "asked_product";
    session.flow = flow; await saveSession(from, session);
    return "Howzit! What can I help you with today?\n\nGates/Fencing | Rims | Chassis | Sheet Metal | Trucks\n\nType *menu* to see our Secret List.";
  }

  if (flow.state === "asked_product") {
    var product = "item";
    if (t.includes("gate") || t.includes("fence") || t.includes("burglar") || t.includes("steel") || t.includes("security") || t.includes("fencing")) {
      product = "gate";
      flow.product = product; flow.state = "asked_condition";
      session.flow = flow; await saveSession(from, session);
      return "Gates/Fencing — lekker. What is the condition? Fresh metal, light rust, or badly rusted?";
    }
    else if (t.includes("rim") || t.includes("wheel") || t.includes("mag")) {
      product = "rims";
      flow.product = product; flow.state = "idle";
      session.flow = flow; await saveSession(from, session);
      return "Rims! We charge R1,000-R1,500 per set of 4 (10-15 inch). Black/white is cheapest, metallic colours cost more. Customer MUST remove tyres.\n\nWant an exact estimate? Tell me: how many rims and what colour?";
    }
    else if (t.includes("chassis") || t.includes("trailer")) {
      product = "chassis";
      flow.product = product; flow.state = "idle";
      session.flow = flow; await saveSession(from, session);
      return "Chassis and trailers — these need proper assessment. I am going to connect you to Ridhor directly for this one.\n\nWhatsApp Ridhor: 076 760 4350\nEmail: " + QUOTE_EMAIL + "\n\nHe will check the condition, size, and give you an exact quote for blasting and spraying.";
    }
    else if (t.includes("sheet") || t.includes("mesh") || t.includes("panel")) {
      product = "sheet metal";
      flow.product = product; flow.state = "idle";
      session.flow = flow; await saveSession(from, session);
      return "Sheet metal! We charge per square meter:\n- Black/White: R175-R250/sqm\n- Metallic/Charcoal: R251-R350/sqm\n- Hammered finishes: R225+\n\nAll prices excl VAT. Blasting included within reason.\n\nWant an estimate? Tell me how many square meters and what colour.";
    }
    else if (t.includes("truck") || t.includes("bakkie") || t.includes("flatbed")) {
      product = "truck";
      flow.product = product; flow.state = "idle";
      session.flow = flow; await saveSession(from, session);
      return "Truck blasting! We charge R5,000-R7,500 for a 5m flatbed truck (excl VAT).\n\nImportant: No rubber can be blasted — must be removed first.\n\nWant to book or need more info? WhatsApp Ridhor: 076 760 4350.";
    }
    flow.product = product; flow.state = "asked_condition";
    session.flow = flow; await saveSession(from, session);
    return "Lekker. What is the condition? Fresh metal, light rust, or badly rusted?";
  }

  if (flow.state === "asked_condition") {
    var condition = "clean";
    if (/heavy|bad|proper|severe|pitted|flaking|rust|rusty|badly/.test(t)) condition = "rusty";
    else if (/light|surface|bit|little/.test(t)) condition = "light rust";
    flow.condition = condition;
    flow.state = "asked_weight";
    flow.rustSurcharge = (condition === "rusty");
    session.flow = flow; await saveSession(from, session);
    if (condition === "rusty") return "Agh, those are the best ones. Full blasting job — that will add about R4-R8 per kg extra for rust removal. But worth it! Rough weight? If you are not sure, just guess — medium gate is usually 15-25kg.";
    if (condition === "light rust") return "Light rust — quick blast and she is clean. No extra charge. Rough weight?";
    return "Cool, no rust — standard rate applies. Rough weight? Do not stress — ballpark is fine. 10kg? 20kg? 50kg?";
  }

  if (flow.state === "asked_weight") {
    var kg = t.match(/(\d+)/);
    if (kg) {
      flow.weight = parseInt(kg[1]); flow.state = "asked_colour";
      session.flow = flow; await saveSession(from, session);
      return "And colour? Black, white, charcoal, or something wild?";
    }
    return "Sorry, I need a number. How many kg roughly? Just guess — 10kg? 20kg? 50kg?";
  }

  if (flow.state === "asked_colour") {
    var isPremium = /charcoal|metallic|bronze|gold|red|blue|green|custom|ral|colour|color/.test(t);
    var rate = isPremium ? 18 : 16;
    var productName = flow.product || "item";
    var weight = flow.weight || 20;
    var coatingTotal = weight * rate;
    var rustExtra = 0;
    if (flow.rustSurcharge) {
      rustExtra = weight * 6;
      coatingTotal += rustExtra;
    }
    var vatAmount = Math.round(coatingTotal * 0.15);
    var total = coatingTotal + vatAmount;
    flow.state = "idle"; session.flow = flow; await saveSession(from, session);
    var colourMsg = isPremium ? "Ooh, fancy! That gives a modern look." : "Classic choice. Black never goes out of style.";
    var msg = colourMsg + "\n\nYOUR ESTIMATE - Ref: " + getOrderRef() + "\n\n" + weight + "kg " + productName + "\nBase rate: R" + rate + "/kg";
    if (flow.rustSurcharge && rustExtra > 0) {
      msg += "\nRust removal surcharge: R" + rustExtra.toLocaleString() + " (R4-R8/kg extra)";
    }
    msg += "\n\nExcl VAT: R" + coatingTotal.toLocaleString() + "\nVAT (15%): R" + vatAmount.toLocaleString() + "\nTOTAL (incl VAT): R" + total.toLocaleString() + "\n\nBlasting included within reason. Estimate only.\n\nWant to book? Reply YES with your name. Or WhatsApp Ridhor: 076 760 4350.";
    return msg;
  }

  // DELIVERY FLOW
  if (flow.state === "delivery_asking_where") {
    var dist = (delivery && typeof delivery.findDistance === "function") ? delivery.findDistance(t) : null;
    if (dist) {
      flow.deliveryKm = dist; flow.deliveryLocation = t; flow.state = "delivery_asking_size";
      session.flow = flow; await saveSession(from, session);
      return "Got it, " + t + " is about " + dist + "km from our workshop in Blackheath. Now - is the item under 1 ton and under 3m long? Or bigger? Reply SMALL or LARGE.";
    }
    var nearby = (delivery && typeof delivery.getNearbyAreas === "function") ? delivery.getNearbyAreas().join(", ") : "Bellville, Durbanville, Stellenbosch, Cape Town CBD";
    return "I could not find that area. Try a nearby town: " + nearby;
  }

  if (flow.state === "delivery_asking_size") {
    var isLarge = /large|big|over|more|truck/.test(t);
    flow.deliveryIsLarge = isLarge; flow.state = "delivery_asking_labour";
    session.flow = flow; await saveSession(from, session);
    return "Got it. One more thing - do you have people to help load at your side? Or do you need us to send a labourer? Reply YES (I have help) or NO (send labourer).";
  }

  if (flow.state === "delivery_asking_labour") {
    var needsLabour = /no|need|send|don|dont|help|labour|please/.test(t) && !/yes|have|got|sorted|fine|okay|covered/.test(t);
    var calc = (delivery && typeof delivery.calculateDelivery === "function") ? delivery.calculateDelivery(flow.deliveryKm, flow.deliveryIsLarge, needsLabour) : null;
    var responseMsg = (calc && delivery && typeof delivery.formatDeliveryResponse === "function") ? delivery.formatDeliveryResponse(calc, flow.deliveryLocation) : "Delivery to " + flow.deliveryLocation + " calculated. WhatsApp Ridhor 076 760 4350 for exact quote.";
    flow.state = "idle"; session.flow = flow; await saveSession(from, session);
    return responseMsg;
  }

  var normalMatch = smartMatch(text, from, session);
  if (normalMatch === QR["delivery"]) {
    flow.state = "delivery_asking_where"; session.flow = flow; await saveSession(from, session);
    return "Sure! Which area or town are you in? (e.g. Bellville, Durbanville, Stellenbosch, Cape Town CBD) I will work out the delivery cost and time for you.";
  }
  return normalMatch;
}

app.get("/health", function(req, res) { res.json({ status:"healthy", service:"Solomon Coatings AI", version:"11.2" }); });
app.get("/", function(req, res) { res.json({ service:"Solomon Coatings", version:"11.2 - Rust Surcharge + Conversational Flow + Delivery" }); });
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
            try { await sendMessage(PERSONAL_NUMBER, "Image from "+from+(cap?" - "+cap:"")); } catch(e){}
            await sendMessage(from, "Thanks! Forwarded to Ridhor on 076 760 4350. He will check now.");
            continue;
          }
          if (!text) continue;

          console.log("["+from+"]: \""+text+"\""+(afterHours?" [AFTER HOURS]":""));
          var session = await getSession(from);
          var match = await handleMessage(text, from, session);
          
          if (afterHours) {
            var showClosed = Math.floor(Math.random() * 4) === 0;
            if (showClosed) {
              match = "Our workshop is closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n" + match;
            }
            try { await sendMessage(PERSONAL_NUMBER, "After-hours from "+from+": "+text); } catch(e){}
          }
          await sendMessage(from, match);
          session.history = session.history || [];
          session.history.push({role:"user",content:text},{role:"model",content:match});
          if (session.history.length > 40) session.history = session.history.slice(-20);
          await saveSession(from, session);
        }
      }
    }
  } catch(e) { console.error("WEBHOOK ERROR:", e.message); }
});

app.listen(PORT, function() { console.log("\nSOLOMON COATINGS v11.2 - Port "+PORT+"\nCalculator: LOCKED | Delivery: LIVE | Conversational: LIVE | Rust Surcharge: ACTIVE\n"); });












