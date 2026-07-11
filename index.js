require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var { KNOWLEDGE } = require("./knowledge");
var p = require("./personality_engine");
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
    return "RIMS ESTIMATE - Ref: " + ref + "\n\n" + qty + " rims = " + sets + " set(s)\nColour: " + (rimColour === "standard" ? "Standard" : "Premium") + "\n\nExcl VAT: R" + rimTotalLow.toLocaleString() + " - R" + rimTotalHigh.toLocaleString() + "\nVAT (15%): R" + rimVatLow.toLocaleString() + " - R" + rimVatHigh.toLocaleString() + "\nIncl VAT: R" + (rimTotalLow+rimVatLow).toLocaleString() + " - R" + (rimTotalHigh+rimVatHigh).toLocaleString() + "\n\nCustomer MUST remove tyres. Estimate only. WhatsApp Ridhor: 076 760 4350.";
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
      return "BLASTING ONLY ESTIMATE - Ref: " + ref + "\n\n" + kg + "kg\nR8-R12/kg\n\nExcl VAT: R" + bl.toLocaleString() + " - R" + bh.toLocaleString() + "\nVAT: R" + bvl.toLocaleString() + " - R" + bvh.toLocaleString() + "\nIncl VAT: R" + (bl+bvl).toLocaleString() + " - R" + (bh+bvh).toLocaleString();
    }
    var vl = Math.round(coatingLow*vatRate), vh = Math.round(coatingHigh*vatRate);
    var msg = "GATE/PER KG ESTIMATE - Ref: " + ref + "\n\nWeight: " + kg + " kg\nColour: " + (isPremium ? "Premium (R"+rateLow+"-R"+rateHigh+"/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + coatingLow.toLocaleString() + " - R" + coatingHigh.toLocaleString() + "\nVAT (15%): R" + vl.toLocaleString() + " - R" + vh.toLocaleString() + "\nTOTAL (incl VAT): R" + (coatingLow+vl).toLocaleString() + " - R" + (coatingHigh+vh).toLocaleString();
    if (kg > 100) msg += "\n\nBulk discount up to 10% may apply.";
    msg += "\n\n" + p.getPersona('quote_delivery');
    return msg;
  }

  if (t.includes("sheet") || t.includes("mesh")) {
    var sqm = t.match(/(\d+)\s*sqm/); sqm = sqm ? parseInt(sqm[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 5);
    var sp = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("colour")||t.includes("color"));
    var sl = sp?251:175, sh = sp?350:250;
    var stl = sqm*sl, sth = sqm*sh;
    var svl = Math.round(stl*vatRate), svh = Math.round(sth*vatRate);
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\n" + sqm + " sqm\nColour: " + (sp?"Premium":"Standard") + "\n\nExcl VAT: R" + stl.toLocaleString() + " - R" + sth.toLocaleString() + "\nVAT: R" + svl.toLocaleString() + " - R" + svh.toLocaleString() + "\nIncl VAT: R" + (stl+svl).toLocaleString() + " - R" + (sth+svh).toLocaleString() + "\n\n" + p.getPersona('quote_delivery');
  }

  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) {
    var tl=5000, th=7500;
    return "TRUCK BLASTING ESTIMATE - Ref: " + ref + "\n\n5m flatbed\n\nExcl VAT: R"+tl.toLocaleString()+" - R"+th.toLocaleString()+"\nVAT: R"+Math.round(tl*vatRate).toLocaleString()+" - R"+Math.round(th*vatRate).toLocaleString()+"\nIncl VAT: R"+Math.round(tl*1.15).toLocaleString()+" - R"+Math.round(th*1.15).toLocaleString();
  }
  return null;
}

var QR = {
  "menu":"SOLOMON COATINGS - Since 1988\n\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461",
  "pricing":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor estimate: quote 20kg gate black",
  "colours":"Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nSee: "+FACEBOOK,
  "hours":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "turnaround":"Under 1 ton: 3 days. Over 1 ton: 5-8 days.",
  "delivery":"R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
  "contact":"060 507 4461 | Office: "+OFFICE_NUMBER+" | Email: "+OFFICE_EMAIL+" | FB: "+FACEBOOK,
  "help":"Reply with a number:\n1. Pricing\n2. Colours\n3. Quote estimate\n4. Turnaround\n5. Hours\n6. Delivery\n7. Blasting\n8. T&Cs\n9. Gallery\n10. Review\n11. Callback\n12. Talk to Ridhor\n13. Accounts\n14. TPS Daily Wisdom",
  "1":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor estimate: quote 20kg gate black",
  "2":"Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture",
  "3":"Send: quote 20kg gate charcoal, quote 4 rims metallic, quote 10sqm sheet black, quote truck blasting",
  "4":"Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "5":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "6":"R150 delivery Cape Town metro. Free collection. 7% daily storage after 7 days.",
  "7":"Blasting: R8-R12/kg (blasting only). Truck: R5,000-R7,500. Medium: Grit/slag. All at client risk.",
  "8":"T&Cs: COD only. No coastal warranties. 7% daily storage. All blasting at client risk. Items our property until paid. Full: "+OFFICE_EMAIL,
  "9":"Facebook: "+FACEBOOK+" | TikTok: "+TIKTOK,
  "10":"Review us: "+GOOGLE_REVIEW+" | Facebook: "+FACEBOOK+" | Thanks for supporting us since 1988!",
  "11":"Want a callback? Send name, number, what you need. Or call "+OFFICE_NUMBER,
  "12":"Ridhor: 076 760 4350 (WhatsApp) | "+QUOTE_EMAIL+" | Office: "+OFFICE_NUMBER,
  "13":"Accounts: "+OFFICE_EMAIL+" / "+OFFICE_NUMBER,
  "14":"TPS DAILY WISDOM - Tommy Phillip Solomon (1988)\n\nThe customer is always right... whatever the cost.\nWe never lose. We either win or we learn.\nAlways do your best to give the customer what they want.\nIf the coating is right, the rust stays away.\nQuality is remembered long after the price is forgotten.\nA man's work is his signature. Make yours worth reading.\nWe have been coating since 88. That is not luck. That is graft.\nPatience in the booth, perfection on the metal.\nYour name is on every job. Never forget that.\nDo not cut corners. Corners are where the rust starts.\nThe metal does not lie. If the prep is bad, the coat will show it.\nA happy customer is a customer for life. Since 1988, we have many.\nWe do not follow trends. We set the standard.\nEvery gate, every rim, every bracket - do it like it is your own.\nThe oven does not care who you are. The heat treats everyone the same.\nCoat it once, coat it right. Comebacks cost more than pride.\nIn this trade, your reputation is your best tool.\nFrom Tommy to Ridhor - the name changed but the pride stayed.\n\nType *help* for the menu.",
  "thanks":"Pleasure! Anything else?",
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

async function handleConversationFlow(text, from, session) {
  var t = text.toLowerCase().trim();
  var flow = session.flow || { state: p.FLOW.IDLE };
  
  if (flow.state === p.FLOW.IDLE && p.isGreeting(text)) {
    flow.state = p.FLOW.ASKED_PRODUCT;
    session.flow = flow;
    await saveSession(from, session);
    var timeOfDay = p.getTimeOfDay();
    if (p.isReturningCustomer(session)) {
      return p.getPersona('return_customer');
    }
    return p.getPersona('greetings', timeOfDay);
  }
  
  if (flow.state === p.FLOW.ASKED_PRODUCT) {
    var product = p.detectProduct(text);
    if (product !== 'unknown') {
      flow.product = product;
      flow.state = p.FLOW.ASKED_CONDITION;
      session.flow = flow;
      await saveSession(from, session);
      return p.pick(p.NEXT_QUESTIONS.asked_product);
    }
    return null;
  }
  
  if (flow.state === p.FLOW.ASKED_CONDITION) {
    var condition = p.detectCondition(text);
    flow.condition = condition;
    flow.state = p.FLOW.ASKED_WEIGHT;
    session.flow = flow;
    await saveSession(from, session);
    var condMsg = "";
    if (condition === 'heavy') condMsg = p.getPersona('rust', 'heavy');
    if (condition === 'mild') condMsg = p.getPersona('rust', 'mild');
    return (condMsg ? condMsg + "\n\n" : "") + p.pick(p.NEXT_QUESTIONS.asked_condition);
  }
  
  if (flow.state === p.FLOW.ASKED_WEIGHT) {
    var kg = t.match(/(\d+)/);
    if (kg) {
      flow.weight = parseInt(kg[1]);
      flow.state = p.FLOW.ASKED_COLOUR;
      session.flow = flow;
      await saveSession(from, session);
      return p.pick(p.NEXT_QUESTIONS.asked_weight);
    }
    return "Sorry, I need a number. How many kg roughly? Just guess — 10kg? 20kg? 50kg?";
  }
  
  if (flow.state === p.FLOW.ASKED_COLOUR) {
    var colour = t;
    var isPremium = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("red")||t.includes("blue")||t.includes("green")||t.includes("custom")||t.includes("ral"));
    var rate = isPremium ? 18 : 16;
    var productName = flow.product || 'item';
    var weight = flow.weight || 20;
    var coatingTotal = weight * rate;
    var vatAmount = Math.round(coatingTotal * 0.15);
    var total = coatingTotal + vatAmount;
    
    flow.state = p.FLOW.IDLE;
    session.flow = flow;
    await saveSession(from, session);
    
    var colourMsg = isPremium ? p.getPersona('colour_premium') : p.getPersona('colour_standard');
    var msg = (colourMsg ? colourMsg + "\n\n" : "") + "YOUR ESTIMATE - Ref: " + getOrderRef() + "\n\n" + weight + "kg " + productName + " - " + colour + "\nR" + rate + "/kg\n\nExcl VAT: R" + coatingTotal.toLocaleString() + "\nVAT (15%): R" + vatAmount.toLocaleString() + "\nTOTAL (incl VAT): R" + total.toLocaleString() + "\n\nBlasting included within reason.\n\n" + p.getPersona('quote_delivery');
    return msg;
  }
  
  return null;
}

function smartMatch(text, fromNumber, session) {
  var t = text.toLowerCase().trim();
  
  // CALCULATOR - RUNS FIRST
  var calc = estimatePrice(text);
  if (calc) return calc;
  
  // MOOD DETECTION
  var mood = p.detectMood(text);
  if (mood === 'angry') return "I hear you, and I'm sorry. Let me get Ridhor on this right now. He'll call you — what's your name and number? Or WhatsApp him directly on 076 760 4350.";
  if (mood === 'tired') return "Late night coating thoughts? 😄 I get it. What's on your mind? I'm here.";
  
  // AI QUESTION
  if (p.isAIQuestion(text)) return p.getPersona('ai_question');
  
  // APPRECIATION
  if (p.isAppreciation(text)) return p.getPersona('appreciation');
  
  // GOODBYE
  if (p.isGoodbye(text)) return p.getPersona('goodbye');
  
  // NUMBERED OPTIONS
  if (QR[t]) return QR[t];
  
  if (t.includes("reference")||t.includes("order number")||t.includes("job number")) return "Your reference: " + getOrderRef() + "\n\nUse this when contacting us.";
  if (t.includes("invoice")&&(t.includes("send")||t.includes("email"))) return "Send your order reference and I will arrange your invoice. Or call "+OFFICE_NUMBER+".";
  if (t.includes("how busy")||t.includes("queue")) return "For real-time wait time, WhatsApp Ridhor on 076 760 4350.";
  if ((t.includes("show")||t.includes("see")||t.includes("example"))&&(t.includes("colour")||t.includes("black")||t.includes("white")||t.includes("red")||t.includes("blue"))) return "See colours on Facebook: "+FACEBOOK+" and TikTok: "+TIKTOK;
  if (t.includes("review")||t.includes("rate")||t.includes("feedback")) return "Leave a review: "+GOOGLE_REVIEW+"\nThank you since 1988!";
  if (t.includes("gallery")||t.includes("portfolio")||t.includes("past job")) return "See our work: "+FACEBOOK+" | "+TIKTOK;
  if (t.includes("terms")||t.includes("t&c")||t.includes("conditions")) return "T&Cs: COD only. No coastal warranties. 7% daily storage. All blasting at client risk. Full: "+OFFICE_EMAIL;
  if (t.includes("order")&&(t.includes("status")||t.includes("update")||t.includes("ready"))) return "For order updates, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("book")||t.includes("callback")||t.includes("call me")) return "Want Ridhor to call? Send name, number, and what you need. Or call "+OFFICE_NUMBER;
  if (t.includes("complaint")||t.includes("problem")||t.includes("unhappy")) return "Sorry! WhatsApp Ridhor on 076 760 4350 or email "+OFFICE_EMAIL;
  if ((t.includes("how")&&t.includes("order"))||t.includes("process")||t.includes("steps")) return "1. Send pic 2. Get estimate 3. Bring items 4. We coat 5. Pay (COD) 6. Collect";
  if (t.includes("recommend")||t.includes("refer")) return "We love referrals! Share 060 507 4461 or "+FACEBOOK;
  if (t.includes("urgent")||t.includes("emergency")||t.includes("asap")) return "For urgent jobs, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("material")||t.includes("what can you coat")||t.includes("can you coat")||t.includes("do you coat")) return "We coat metals handling 200C+: steel, aluminium, cast iron. No plastic, wood, fibreglass.";
  if (t.includes("collect")||t.includes("storage")) return "Collect within 7 days. Late: 7% daily storage. No release without payment.";
  if (t.includes("coastal")||t.includes("sea")||t.includes("warranty")||t.includes("guarantee")) {
    return p.getPersona('coastal') + "\n\nNo warranties within 15km of shoreline. Coastal work at client risk. Epoxy + 2-coat available.";
  }
  if (t.includes("defect")||t.includes("crack")||t.includes("warp")) return "Not liable for latent defects. All work at client risk.";
  if (t.includes("plastic")||t.includes("glass")||t.includes("hydraulic")) return "Before blasting: Remove plastic, glass, hydraulics. Empty tanks.";
  if (t.includes("maintenance")||t.includes("clean")||t.includes("look after")) return "Maintain with drying, wiping, cleaning. Keep records.";
  if (t.includes("pay")||t.includes("payment")||t.includes("cod")) return p.getPersona('payment') || "Strict COD. No release without payment.";
  if (t.includes("intellectual")||t.includes("ownership")) return "All processes remain Solomon Coatings IP. Items ours until paid.";
  if (t.includes("batch")||t.includes("colour match")) return "Colours vary by batch every 4-6 months.";
  if (t.includes("primer")||t.includes("top coat")||t.includes("etch")) return "Primed: top-coat within 12-24hrs. High-heat paints available.";
  if (t.includes("wetspray")||t.includes("wet spray")) return "Wetspray: Contact Ridhor 076 760 4350 or "+QUOTE_EMAIL;
  if (t.includes("account")||t.includes("statement")||t.includes("balance")) return "Accounts: "+OFFICE_EMAIL+" / "+OFFICE_NUMBER;
  if ((t.includes("speak")||t.includes("talk"))&&(t.includes("ridhor")||t.includes("owner")||t.includes("boss"))) return "Ridhor: 076 760 4350 | "+QUOTE_EMAIL;
  if (t.includes("bulk")||t.includes("discount")||t.includes("volume")) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("facebook")||t.includes("social")||t.includes("tiktok")) return "FB: "+FACEBOOK+" | TikTok: "+TIKTOK;
  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) return "Truck blasting: R5,000-R7,500 excl VAT. No rubber.";
  if (t.includes("blast")||t.includes("sandblast")) return p.getPersona('blasting') + "\n\nBlasting: R8-R12/kg. Truck: R5,000-R7,500. Client risk.";
  if (t.includes("rust")) return p.getPersona('rust', 'heavy') || "Rusted items: Blasting R8-R12/kg.";
  if (t.includes("price")||t.includes("cost")||t.includes("how much")) return p.getPersona('pricing_intro') || QR["pricing"];
  if (t.includes("colour")||t.includes("color")||t.includes("finish")||t.includes("ral")) return QR["colours"];
  if (t.includes("hour")||t.includes("open")||t.includes("close")) return p.getPersona('hours') || QR["hours"];
  if (t.includes("turnaround")||t.includes("how long")) return QR["turnaround"];
  if (t.includes("deliver")||t.includes("where")||t.includes("address")) return QR["delivery"];
  if (t.includes("contact")||t.includes("email")||t.includes("phone")) return QR["contact"];
  if (t.includes("rim")||t.includes("wheel")||t.includes("mag")) return "Rims: R1,000-R1,500/set of 4. Remove tyres. For estimate: quote 4 rims black";
  if (t.includes("gate")||t.includes("fence")||t.includes("burglar")) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if (t.includes("sheet")||t.includes("mesh")||t.includes("panel")) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if (t.includes("chassis")||t.includes("trailer")) return "Chassis: R16/kg B/W, R17-R20/kg premium. WhatsApp pics: 076 760 4350.";
  if (t.includes("minimum")||t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (t.includes("tyre")||t.includes("tire")) return p.getPersona('tyres') || "Customer MUST remove tyres.";
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if (t.includes("saturday")||t.includes("weekend")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if ((t.includes("oversized")||t.includes("large"))&&t.includes("item")) return "Large items (6m-7.2m): R1000 setup fee.";
  if (t.includes("loadshedding")||t.includes("delay")) return "Timelines affected by loadshedding/weather.";
  if (t.includes("rain")) return "Once cured, powder coating is weather-resistant. Fresh coating avoid rain 24hrs.";
  
  return p.getPersona('fallback');
}

app.get("/health", function(req, res) { res.json({ status:"healthy", service:"Solomon Coatings AI", version:"11.0 - The Workshop Lad" }); });
app.get("/", function(req, res) { res.json({ service:"Solomon Coatings", version:"11.0 - Oom Solly with opinions" }); });
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
            await forwardImageToOwner(imageId, from);
            await sendMessage(PERSONAL_NUMBER, "Image from "+from);
            await sendMessage(from, "Got your photo! Forwarding to Ridhor now. He'll check it and get back to you.");
            continue;
          }
          if (!text) continue;

          console.log("["+from+"]: \""+text+"\""+(afterHours?" [AFTER HOURS]":""));
          var session = await getSession(from);
          
          // Send thinking delay for longer responses
          if (text.length > 15 || text.includes("quote") || text.includes("price")) {
            await sendMessage(from, p.pick(p.PERSONA.thinking));
          }
          
          // Try conversational flow first
          var match = await handleConversationFlow(text, from, session);
          
          // Fall back to smartMatch
          if (!match) {
            match = smartMatch(text, from, session);
          }
          
          if (match) {
            if (afterHours) {
              match = "Workshop closed (Mon-Thurs 8-4:45, Fri 8-2:45). But I got you!\n\n" + match;
              await sendMessage(PERSONAL_NUMBER, "After-hours from "+from+": "+text);
            }
            await sendMessage(from, match);
            if (!session.history) session.history = [];
            session.history.push({role:"user",content:text},{role:"model",content:match});
            await saveSession(from, session);
          }
        }
      }
    }
  } catch(e) { console.error("WEBHOOK ERROR:", e.message); }
});

app.listen(PORT, function() { console.log("\nSOLOMON COATINGS v11.0 - The Workshop Lad With Opinions - Port "+PORT); });
