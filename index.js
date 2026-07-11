require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var axios = require("axios");
var p = require("./personality_engine");
var delivery = require("./delivery");

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
var APP_URL = "https://solomon-ai-izyb.onrender.com";

var WORKLOAD_LEVEL = 3;
var WORKLOAD_MULTIPLIERS = { 1: 0.90, 2: 0.95, 3: 1.00, 4: 1.07, 5: 1.15 };

var SHELF = [
  { file: "gate-charcoal-1.jpg", tags: ["gate", "charcoal"], line: "Ja, I have got that exact charcoal right here. Did one last week in Blackheath. Came out lekker." },
  { file: "rim-gloss-black-1.jpg", tags: ["rim", "black", "gloss"], line: "Ag this black gloss rim? Finished yesterday, still warm from the oven." },
  { file: "gate-black-1.jpg", tags: ["gate", "black"], line: "Black gate — our bread and butter since 88. Look here." }
];

function findOnShelf(text) {
  var t = text.toLowerCase();
  var best = null, bestScore = 0;
  for (var i = 0; i < SHELF.length; i++) {
    var score = SHELF[i].tags.filter(function(tag) { return t.indexOf(tag) !== -1; }).length;
    if (score > bestScore) { bestScore = score; best = SHELF[i]; }
  }
  return bestScore > 0 ? best : null;
}

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

function isOwner(from) {
  return from === PERSONAL_NUMBER || from === "27605074461" || from === "0605074461";
}

function cleanPhone(phone) {
  return phone.replace(/\D/g, "");
}

function calculateQuote(text) {
  var t = (text || "").toLowerCase();
  var kg = null;
  var km = t.match(/(\d+(?:\.\d+)?)\s*kg/);
  var sm = t.match(/(\d+(?:\.\d+)?)\s*sqm/);
  if (km) kg = parseFloat(km[1]);
  if (!kg && sm) kg = parseFloat(sm[1]) * 2.5;
  if (!kg) {
    var num = t.match(/(\d+(?:\.\d+)?)/);
    if (num && /(gate|rim|panel|sheet|frame|kg)/.test(t)) kg = parseFloat(num[1]);
  }
  if (!kg) return null;

  var product = "item";
  if (t.indexOf("gate") !== -1) product = "gate";
  else if (t.indexOf("rim") !== -1) product = "rim";
  else if (t.indexOf("panel") !== -1) product = "panel";
  else if (t.indexOf("sheet") !== -1) product = "sheet";
  else if (t.indexOf("chassis") !== -1) product = "chassis";

  var colour = "standard", rate = 16;
  if (/charcoal|red|blue|green|bronze|gold|silver|metallic|colour|color/.test(t)) { colour = "premium"; rate = 18; }
  else if (/pearl|candy/.test(t)) { colour = "special"; rate = 20; }
  else if (/black|white/.test(t)) { colour = "standard black/white"; rate = 16; }

  var blastOnly = /(blast only|sandblast only|blasting only)/.test(t) && t.indexOf("coat") === -1;
  var bl = 0, bh = 0;
  if (blastOnly) { bl = Math.round(kg * 8); bh = Math.round(kg * 12); }
  var coatingLow = Math.round(kg * rate);
  var coatingHigh = Math.round(kg * (rate + 2));
  var subtotalLow = blastOnly ? bl : coatingLow;
  var subtotalHigh = blastOnly ? bh : coatingHigh;

  if (p.CONTRACTOR_MODE) {
    subtotalLow = Math.round(subtotalLow * 0.92);
    subtotalHigh = Math.round(subtotalHigh * 0.92);
  }

  var vatLow = Math.round(subtotalLow * 0.15);
  var vatHigh = Math.round(subtotalHigh * 0.15);

  return {
    kg: kg, product: product, colour: colour, rate: rate,
    coatingLow: coatingLow, coatingHigh: coatingHigh,
    vatLow: vatLow, vatHigh: vatHigh,
    inclLow: subtotalLow + vatLow, inclHigh: subtotalHigh + vatHigh,
    blastOnly: blastOnly, ref: getOrderRef()
  };
}

function formatQuote(q) {
  var prefix = p.CONTRACTOR_MODE ? "CONTRACTOR RATE " : "";
  if (q.blastOnly) {
    return prefix + "BLASTING ONLY ESTIMATE - Ref: " + q.ref + "\n\nWeight: " + q.kg + "kg\nR8-R12/kg\n\nExcl VAT: R" + q.coatingLow.toLocaleString() + " - R" + q.coatingHigh.toLocaleString() + "\nVAT (15%): R" + q.vatLow.toLocaleString() + " - R" + q.vatHigh.toLocaleString() + "\nIncl VAT: R" + q.inclLow.toLocaleString() + " - R" + q.inclHigh.toLocaleString();
  }
  var msg = prefix + "GATE/PER KG ESTIMATE - Ref: " + q.ref + "\n\nWeight: " + q.kg + "kg\nProduct: " + q.product + "\nColour: " + q.colour + " (R" + q.rate + "/kg)\n\nCoating (blasting included): R" + q.coatingLow.toLocaleString() + " - R" + q.coatingHigh.toLocaleString() + "\nVAT (15%): R" + q.vatLow.toLocaleString() + " - R" + q.vatHigh.toLocaleString() + "\nTOTAL (incl VAT): R" + q.inclLow.toLocaleString() + " - R" + q.inclHigh.toLocaleString();
  if (q.kg > 100) msg += "\n\nBulk discount up to 10% may apply.";
  msg += p.getLoadsheddingNotice();
  return msg;
}

function parseBulk(text) {
  if (text.indexOf("+") === -1) return null;
  var parts = text.split("+");
  var items = [];
  var totalIncl = 0;
  for (var i = 0; i < parts.length; i++) {
    var q = calculateQuote(parts[i]);
    if (q) { items.push(q); totalIncl += q.inclLow; }
  }
  if (items.length < 2) return null;
  var discount = totalIncl > 800 ? Math.round(totalIncl * 0.1) : 0;
  return { items: items, totalIncl: totalIncl, discount: discount, finalTotal: totalIncl - discount };
}

var QR = {
  "menu": "SOLOMON COATINGS - Since 1988\n\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nMon-Thurs 8AM-4:45PM | Fri 8AM-2:45PM\n060 507 4461",
  "pricing": "PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99",
  "colours": "Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture",
  "hours": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "turnaround": "Under 1 ton: 3 days. Over 1 ton: 5-8 days.",
  "delivery": "R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
  "contact": "060 507 4461 | Office: " + OFFICE_NUMBER + " | Email: " + OFFICE_EMAIL,
  "help": "1. Pricing\n2. Colours\n3. Quote\n4. Turnaround\n5. Hours\n6. Delivery\n7. Blasting\n8. T&Cs\n9. Gallery\n10. Review\n11. Callback\n12. Ridhor\n13. Accounts\n14. TPS Wisdom",
  "1": "PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99",
  "2": "Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+",
  "3": "Send: quote 20kg gate charcoal, quote 4 rims metallic, quote 10sqm sheet black",
  "4": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "5": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "6": "R150 delivery Cape Town metro. Free collection.",
  "7": "Blasting: R8-R12/kg. Truck: R5,000-R7,500. Client risk.",
  "8": "T&Cs: COD only. No coastal warranties. 7% daily storage. Full: " + OFFICE_EMAIL,
  "9": "Facebook: " + FACEBOOK + " | TikTok: " + TIKTOK,
  "10": "Review us: " + GOOGLE_REVIEW,
  "11": "Want a callback? Send name, number. Or call " + OFFICE_NUMBER,
  "12": "Ridhor: 076 760 4350 | " + QUOTE_EMAIL,
  "13": "Accounts: " + OFFICE_EMAIL + " / " + OFFICE_NUMBER,
  "14": "TPS DAILY WISDOM - Tommy Phillip Solomon (1988)\n\nThe customer is always right... whatever the cost.\nWe never lose. We either win or we learn.\nAlways do your best to give the customer what they want.\nIf the coating is right, the rust stays away.\nQuality is remembered long after the price is forgotten.\nA man's work is his signature. Make yours worth reading.\nWe have been coating since 88. That is not luck. That is graft.\nPatience in the booth, perfection on the metal.\nYour name is on every job. Never forget that.\nDo not cut corners. Corners are where the rust starts.\nThe metal does not lie. If the prep is bad, the coat will show it.\nA happy customer is a customer for life. Since 1988, we have many.\nWe do not follow trends. We set the standard.\nEvery gate, every rim, every bracket - do it like it is your own.\nThe oven does not care who you are. The heat treats everyone the same.\nCoat it once, coat it right. Comebacks cost more than pride.\nIn this trade, your reputation is your best tool.\nFrom Tommy to Ridhor - the name changed but the pride stayed.\n\nType *help* for the menu."
};

async function handleOwnerCommand(from, text) {
  var t = text.toLowerCase().trim();

  if (t.indexOf("workload") === 0) {
    var lvl = parseInt(t.match(/\d/)[0] || "3");
    if (lvl >= 1 && lvl <= 5) {
      WORKLOAD_LEVEL = lvl;
      var desc = { 1: "10% discount — fill the shop", 2: "5% discount — steady", 3: "Normal pricing", 4: "7% premium — getting busy", 5: "15% premium — packed" };
      await sendMessage(from, "Workload set to " + lvl + "/5: " + desc[lvl] + "\nMultiplier: " + (WORKLOAD_MULTIPLIERS[lvl] * 100).toFixed(0) + "%");
      return true;
    }
  }

  if (t.indexOf("contractor") === 0) {
    if (t.indexOf("on") !== -1) { p.CONTRACTOR_MODE = true; await sendMessage(from, p.getPersona("contractor_mode", "on")); return true; }
    if (t.indexOf("off") !== -1) { p.CONTRACTOR_MODE = false; await sendMessage(from, p.getPersona("contractor_mode", "off")); return true; }
  }

  if (t.indexOf("loadshedding") === 0) {
    var stage = parseInt(t.match(/\d/)[0] || "0");
    p.LOADSHEDDING_STAGE = stage;
    await sendMessage(from, "Loadshedding set to Stage " + stage + ". Quotes will include delay notices.");
    return true;
  }

  if (t.indexOf("report") === 0) {
    var stats = await redis.get("stats:quotes:today") || "0";
    var msgs = await redis.get("stats:messages:today") || "0";
    var isFriday = p.isFriday();
    var fridayMsg = isFriday ? "\nIt's Friday! Time to wrap up the week." : "";
    await sendMessage(from, "SOLOMON COATINGS REPORT\n\nToday: " + stats + " quotes, " + msgs + " messages\nWorkload: " + WORKLOAD_LEVEL + "/5\nContractor mode: " + (p.CONTRACTOR_MODE ? "ON (8% discount)" : "OFF") + "\nLoadshedding: Stage " + p.LOADSHEDDING_STAGE + "\nShelf: " + SHELF.length + " photos" + fridayMsg);
    return true;
  }

  if (t.indexOf("done") === 0) {
    var parts = text.split(" ");
    var cust = null;
    for (var i = 0; i < parts.length; i++) {
      var cleaned = cleanPhone(parts[i]);
      if (cleaned.length >= 9) { cust = cleaned; break; }
    }
    var what = text.replace(/done/i, "").replace(cust || "", "").trim() || "job";
    if (cust) {
      await sendMessage(cust, "Your " + what + " is ready! Collection: Mon-Thurs 8-4:45, Fri 8-2:45. Ref: " + getOrderRef() + "\n\nPayment on collection (COD).");
      await sendMessage(from, "Notified " + cust + " — their " + what + " is ready.");
    } else {
      await sendMessage(from, "Use: done 0721234567 gate charcoal");
    }
    return true;
  }

  if (t.indexOf("addshelf") === 0) {
    var sp = text.split("|");
    if (sp.length >= 3) {
      SHELF.push({ file: sp[1].trim(), tags: sp[2].trim().split(","), line: sp[3] ? sp[3].trim() : "From our workshop in Blackheath." });
      await sendMessage(from, "Added to shelf. " + SHELF.length + " photos now.");
    }
    return true;
  }

  return false;
}

async function smartMatch(text, from, session) {
  var t = text.toLowerCase().trim();

  if (isOwner(from)) {
    var handled = await handleOwnerCommand(from, text);
    if (handled) return null;
  }

  // BULK PARSER
  if (t.indexOf("+") !== -1) {
    var bulk = parseBulk(text);
    if (bulk) {
      var lines = [];
      for (var i = 0; i < bulk.items.length; i++) {
        lines.push(bulk.items[i].kg + "kg " + bulk.items[i].product + " " + bulk.items[i].colour + " = R" + bulk.items[i].inclLow.toLocaleString());
      }
      var msg = lines.join("\n") + "\n──────────\nSubtotal: R" + bulk.totalIncl.toLocaleString();
      if (bulk.discount > 0) msg += "\nBulk -10%: -R" + bulk.discount.toLocaleString() + "\nTOTAL: R" + bulk.finalTotal.toLocaleString() + " incl VAT";
      else msg += "\nTOTAL: R" + bulk.totalIncl.toLocaleString() + " incl VAT";
      if (p.CONTRACTOR_MODE) msg += "\n\nContractor rate applied (-8%)";
      msg += p.getLoadsheddingNotice();
      msg += "\n\nCode: SC-" + from.slice(-6) + " — share for R50 off for a mate";
      await redis.hset("c:" + from, { last: text.split("+")[0], kg: "bulk", prod: "bulk", col: "mix" });
      await redis.incr("stats:quotes:today");
      return msg;
    }
  }

  // VISUAL SHELF
  if (/look|show|charcoal|black|finish|example|sample|see/.test(t)) {
    var hit = findOnShelf(text);
    if (hit) {
      try { await sendMessage(from, hit.line); } catch(e) {}
    }
  }

  // ROAST MY RUST
  if (/rust|rusted|rusty/.test(t) && /photo|image|pic|look|see|sent|this|check/.test(t)) {
    return p.getPersona("rust_roast");
  }

  // CALCULATOR
  var q = calculateQuote(text);
  if (q) {
    var lvl = WORKLOAD_LEVEL;
    var mult = WORKLOAD_MULTIPLIERS[lvl];
    if (mult !== 1) {
      q.coatingLow = Math.round(q.coatingLow * mult);
      q.coatingHigh = Math.round(q.coatingHigh * mult);
      q.vatLow = Math.round(q.coatingLow * 0.15);
      q.vatHigh = Math.round(q.coatingHigh * 0.15);
      q.inclLow = q.coatingLow + q.vatLow;
      q.inclHigh = q.coatingHigh + q.vatHigh;
    }
    await redis.hset("c:" + from, { last: q.kg + "kg " + q.product, kg: String(q.kg), prod: q.product, col: q.colour });
    await redis.incr("stats:quotes:today");
    await redis.expire("c:" + from, 1209600);
    return formatQuote(q) + (mult !== 1 && !p.CONTRACTOR_MODE ? "\n\nWorkload pricing active (" + (mult*100).toFixed(0) + "%)" : "");
  }

  // SAME THING MEMORY
  if (/same thing|dieselfde|that one|daai|again|last time/.test(t)) {
    var mem = await redis.hgetall("c:" + from);
    if (mem && mem.kg) {
      var newCol = "black";
      if (/red/.test(t)) newCol = "red";
      else if (/charcoal/.test(t)) newCol = "charcoal";
      else if (/white/.test(t)) newCol = "white";
      else if (/blue/.test(t)) newCol = "blue";
      var memQuote = calculateQuote(mem.kg + "kg " + mem.prod + " " + newCol);
      if (memQuote) {
        return "Same as your " + mem.last + " but in " + newCol + "?\n\n" + formatQuote(memQuote) + "\n\n" + p.getPersona("quote_delivery");
      }
    }
  }

  // MOOD
  var mood = p.detectMood(text);
  if (mood === "angry") {
    await sendMessage(PERSONAL_NUMBER, "ANGRY " + from + ": \"" + text + "\"");
    return "I hear you, and I am sorry. Let me get Ridhor on this right now. He will call you — what is your name and number? Or WhatsApp him directly on 076 760 4350.";
  }
  if (mood === "tired") return "Long day hey? Send weight + colour, I will do the math so you do not have to think. 20kg gate black = R368 all-in.";

  // AI QUESTION
  if (p.isAIQuestion(text)) return p.getPersona("ai_question");

  // FRIDAY VIBE
  if (p.isFriday() && p.isGreeting(text)) {
    return p.getPersona("friday_vibe") + "\n\n" + p.getPersona("greetings", p.getTimeOfDay());
  }

  // APPRECIATION
  if (p.isAppreciation(text)) return p.getPersona("appreciation");

  // GOODBYE
  if (p.isGoodbye(text)) return p.getPersona("goodbye");

  // NUMBERED OPTIONS
  if (QR[t]) return QR[t];

  // DELIVERY
  if (/deliver|delivery|courier|send|bring/.test(t) && !/estimate|quote|price/.test(t)) {
    if (session) { session.flow = { state: "delivery_asking_where" }; await saveSession(from, session); }
    return "Ja, we can deliver! Usually takes 2-3 working days. Where are you based? (Suburb or town)";
  }

  // KEYWORDS
  if (/reference|order number|job number/.test(t)) return "Your reference: " + getOrderRef();
  if (/invoice/.test(t) && /send|email/.test(t)) return "Send your reference and I will arrange your invoice. Or call " + OFFICE_NUMBER;
  if (/how busy|queue/.test(t)) return "For real-time wait time, WhatsApp Ridhor on 076 760 4350.";
  if (/review|rate|feedback/.test(t)) return "Leave a review: " + GOOGLE_REVIEW + "\nThank you since 1988!";
  if (/gallery|portfolio|past job/.test(t)) return "See our work: " + FACEBOOK + " | " + TIKTOK;
  if (/terms|t&c|conditions/.test(t)) return "T&Cs: COD only. No coastal warranties. 7% daily storage. All blasting at client risk. Full: " + OFFICE_EMAIL;
  if (/order/.test(t) && /status|update|ready/.test(t)) return "For order updates, WhatsApp Ridhor: 076 760 4350.";
  if (/book|callback|call me/.test(t)) return "Want Ridhor to call? Send name, number. Or call " + OFFICE_NUMBER;
  if (/complaint|problem|unhappy/.test(t)) return "Sorry! WhatsApp Ridhor on 076 760 4350 or email " + OFFICE_EMAIL;
  if (/how.*order|process|steps/.test(t)) return "1. Send pic 2. Get estimate 3. Bring items 4. We coat 5. Pay (COD) 6. Collect";
  if (/recommend|refer/.test(t)) return "We love referrals! Share 060 507 4461 or " + FACEBOOK;
  if (/urgent|emergency|asap/.test(t)) return "For urgent jobs, WhatsApp Ridhor: 076 760 4350.";
  if (/material|what can you coat|can you coat|do you coat/.test(t)) return "We coat metals handling 200C+: steel, aluminium, cast iron. No plastic, wood, fibreglass.";
  if (/collect|storage/.test(t)) return "Collect within 7 days. Late: 7% daily storage. No release without payment.";
  if (/coastal|sea|warranty|guarantee/.test(t)) return p.getPersona("coastal") + "\n\nNo warranties within 15km of shoreline. Coastal work at client risk.";
  if (/defect|crack|warp/.test(t)) return "Not liable for latent defects. All work at client risk.";
  if (/plastic|glass|hydraulic/.test(t)) return "Before blasting: Remove plastic, glass, hydraulics. Empty tanks.";
  if (/maintenance|clean|look after/.test(t)) return "Maintain with drying, wiping, cleaning. Keep records.";
  if (/pay|payment|cod/.test(t)) return p.getPersona("payment") || "Strict COD. No release without payment.";
  if (/intellectual|ownership/.test(t)) return "All processes remain Solomon Coatings IP. Items ours until paid.";
  if (/batch|colour match/.test(t)) return "Colours vary by batch every 4-6 months.";
  if (/primer|top coat|etch/.test(t)) return "Primed: top-coat within 12-24hrs. High-heat paints available.";
  if (/wetspray|wet spray/.test(t)) return "Wetspray: Contact Ridhor 076 760 4350 or " + QUOTE_EMAIL;
  if (/account|statement|balance/.test(t)) return "Accounts: " + OFFICE_EMAIL + " / " + OFFICE_NUMBER;
  if (/(speak|talk).*(ridhor|owner|boss)/.test(t)) return "Ridhor: 076 760 4350 | " + QUOTE_EMAIL;
  if (/bulk|discount|volume/.test(t)) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if (/facebook|social|tiktok/.test(t)) return "FB: " + FACEBOOK + " | TikTok: " + TIKTOK;
  if (/truck|bakkie|flatbed/.test(t)) return "Truck blasting: R5,000-R7,500 excl VAT. No rubber.";
  if (/blast|sandblast/.test(t)) return p.getPersona("blasting") + "\n\nBlasting: R8-R12/kg. Truck: R5,000-R7,500. Client risk.";
  if (/rust/.test(t)) return p.getPersona("rust", "heavy") || "Rusted items: Blasting R8-R12/kg.";
  if (/price|cost|how much/.test(t)) return p.getPersona("pricing_intro") || QR["pricing"];
  if (/colour|color|finish|ral/.test(t)) return QR["colours"];
  if (/hour|open|close/.test(t)) return p.getPersona("hours") || QR["hours"];
  if (/turnaround|how long/.test(t)) return QR["turnaround"];
  if (/deliver|where|address|location/.test(t)) return QR["delivery"];
  if (/contact|email|phone/.test(t)) return QR["contact"];
  if (/rim|wheel|mag/.test(t)) return "Rims: R1,000-R1,500/set of 4. Remove tyres. For estimate: quote 4 rims black";
  if (/gate|fence|burglar/.test(t)) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if (/sheet|mesh|panel/.test(t)) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if (/chassis|trailer/.test(t)) return "Chassis: R16/kg B/W, R17-R20/kg premium. WhatsApp pics: 076 760 4350.";
  if (/minimum|small job/.test(t)) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (/tyre|tire/.test(t)) return p.getPersona("tyres") || "Customer MUST remove tyres.";
  if (/vat/.test(t)) return "All prices exclude 15% VAT unless stated.";
  if (/saturday|weekend/.test(t)) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if (/oversized|large.*item/.test(t)) return "Large items (6m-7.2m): R1000 setup fee.";
  if (/loadshedding|delay/.test(t)) return "Timelines affected by loadshedding/weather.";
  if (/rain/.test(t)) return "Once cured, powder coating is weather-resistant. Fresh coating avoid rain 24hrs.";

  return p.getPersona("fallback");
}

async function handleConversationFlow(text, from, session) {
  var t = text.toLowerCase().trim();
  var flow = session.flow || { state: "idle" };

  if (flow.state === "delivery_asking_where") {
    var dist = delivery.findDistance(t);
    if (dist) {
      flow.deliveryKm = dist;
      flow.deliveryLocation = t;
      flow.state = "delivery_asking_size";
      session.flow = flow;
      await saveSession(from, session);
      return "Got it, " + t + " is about " + dist + "km from our workshop in Blackheath. Now — is the item under 1 ton and under 3m long? Or bigger? Reply SMALL or LARGE.";
    }
    return "I could not find that area. Can you try a nearby town or suburb? For example: Bellville, Durbanville, Stellenbosch, Cape Town CBD.";
  }

  if (flow.state === "delivery_asking_size") {
    var isLarge = /large|big|over|more|truck/.test(t);
    var calc = delivery.calculateDelivery(flow.deliveryKm, isLarge);
    flow.state = "idle";
    session.flow = flow;
    await saveSession(from, session);
    return "DELIVERY ESTIMATE\n\nDistance: " + calc.km + "km\nVehicle: " + calc.vehicle + "\n\nBase cost: R" + calc.baseCost.toLocaleString() + "\nSurcharge (13%): R" + calc.surcharge.toLocaleString() + "\nTOTAL: R" + calc.total.toLocaleString() + "\n\nDelivery usually takes 2-3 working days.\n\nThis is an ESTIMATE ONLY. Contact Ridhor on 076 760 4350 for an exact delivery quote.";
  }

  if (flow.state === "idle" && p.isGreeting(text)) {
    flow.state = "asked_product";
    session.flow = flow;
    await saveSession(from, session);
    var timeOfDay = p.getTimeOfDay();
    if (p.isReturningCustomer(session)) return p.getPersona("return_customer");
    return p.getPersona("greetings", timeOfDay);
  }

  if (flow.state === "asked_product") {
    var product = p.detectProduct(text);
    if (product !== "unknown") {
      flow.product = product;
      flow.state = "asked_condition";
      session.flow = flow;
      await saveSession(from, session);
      return p.pick(p.NEXT_QUESTIONS.asked_product);
    }
    return null;
  }

  if (flow.state === "asked_condition") {
    var condition = p.detectCondition(text);
    flow.condition = condition;
    flow.state = "asked_weight";
    session.flow = flow;
    await saveSession(from, session);
    var condMsg = condition === "heavy" ? p.getPersona("rust", "heavy") : (condition === "mild" ? p.getPersona("rust", "mild") : "");
    return (condMsg ? condMsg + "\n\n" : "") + p.pick(p.NEXT_QUESTIONS.asked_condition);
  }

  if (flow.state === "asked_weight") {
    var kg = t.match(/(\d+)/);
    if (kg) {
      flow.weight = parseInt(kg[1]);
      flow.state = "asked_colour";
      session.flow = flow;
      await saveSession(from, session);
      return p.pick(p.NEXT_QUESTIONS.asked_weight);
    }
    return "Sorry, I need a number. How many kg roughly? Just guess — 10kg? 20kg? 50kg?";
  }

  if (flow.state === "asked_colour") {
    var isPremium = /charcoal|metallic|bronze|gold|red|blue|green|custom|ral/.test(t);
    var rate = isPremium ? 18 : 16;
    var productName = flow.product || "item";
    var weight = flow.weight || 20;
    var coatingTotal = weight * rate;
    var vatAmount = Math.round(coatingTotal * 0.15);
    var total = coatingTotal + vatAmount;
    flow.state = "idle";
    session.flow = flow;
    await saveSession(from, session);
    var colourMsg = isPremium ? p.getPersona("colour_premium") : p.getPersona("colour_standard");
    return (colourMsg ? colourMsg + "\n\n" : "") + "YOUR ESTIMATE - Ref: " + getOrderRef() + "\n\n" + weight + "kg " + productName + "\nR" + rate + "/kg\n\nExcl VAT: R" + coatingTotal.toLocaleString() + "\nVAT (15%): R" + vatAmount.toLocaleString() + "\nTOTAL (incl VAT): R" + total.toLocaleString() + "\n\n" + p.getPersona("quote_delivery");
  }

  return null;
}

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    return true;
  } catch(e) { return false; }
}

app.get("/health", function(req, res) { res.json({ status: "healthy", service: "Solomon Coatings AI", version: "13.0", contractor: p.CONTRACTOR_MODE, loadshedding: p.LOADSHEDDING_STAGE }); });
app.get("/", function(req, res) { res.json({ service: "Solomon Coatings", version: "13.0 - Roast My Rust + Voice + Contractor Mode" }); });
app.get("/webhook", function(req, res) {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VT) return res.status(200).send(req.query["hub.challenge"]);
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
  try {
    var entries = (req.body && req.body.entry) ? req.body.entry : [];
    for (var i = 0; i < entries.length; i++) {
      var changes = entries[i].changes || [];
      for (var j = 0; j < changes.length; j++) {
        var msgs = (changes[j].value && changes[j].value.messages) ? changes[j].value.messages : [];
        for (var k = 0; k < msgs.length; k++) {
          var from = msgs[k].from, type = msgs[k].type;
          var text = (msgs[k].text && msgs[k].text.body) ? msgs[k].text.body.trim() : null;
          var imageId = msgs[k].image ? msgs[k].image.id : null;
          var isVoice = (type === "audio" || type === "voice" || msgs[k].audio);
          var afterHours = isAfterHours();

          // VOICE NOTE
          if (isVoice) {
            console.log("[" + from + "]: Voice note");
            await sendMessage(from, p.getPersona("voice_note"));
            await sendMessage(PERSONAL_NUMBER, "Voice note from " + from + ". Check WhatsApp Business.");
            continue;
          }

          // IMAGE WITH ROAST DETECTION
          if (type === "image" && imageId) {
            var cap = (msgs[k].image && msgs[k].image.caption) ? msgs[k].image.caption.toLowerCase() : "";
            await forwardImageToOwner(imageId, from);
            await sendMessage(PERSONAL_NUMBER, "Image from " + from + (cap ? " - " + cap : ""));
            if (/rust|rusted|rusty|terrible|bad|old|damage/.test(cap) || /rust|rusted|rusty/.test(text || "")) {
              await sendMessage(from, p.getPersona("rust_roast"));
            } else {
              await sendMessage(from, "Got your photo! Forwarding to Ridhor now. He will check it and get back to you. If you want a quick quote, send me the weight and colour.");
            }
            continue;
          }

          if (!text) continue;

          console.log("[" + from + "]: \"" + text + "\"" + (afterHours ? " [AFTER HOURS]" : ""));
          await redis.incr("stats:messages:today");
          var session = await getSession(from);

          if (text.length > 15 || /quote|price|estimate/.test(text)) {
            await sendMessage(from, p.pick(p.PERSONA.thinking));
          }

          var match = await handleConversationFlow(text, from, session);
          if (!match) match = await smartMatch(text, from, session);

          if (match) {
            if (afterHours) {
              match = "Workshop closed (Mon-Thurs 8-4:45, Fri 8-2:45). But I got you!\n\n" + match;
              await sendMessage(PERSONAL_NUMBER, "After-hours from " + from + ": " + text);
            }
            await sendMessage(from, match);
            if (!session.history) session.history = [];
            session.history.push({ role: "user", content: text }, { role: "model", content: match });
            await saveSession(from, session);
          }
        }
      }
    }
  } catch(e) { console.error("WEBHOOK ERROR:", e.message); }
});

app.listen(PORT, function() { console.log("\nSOLOMON COATINGS v13.0 - Roast My Rust + Voice + Contractor Mode - Port " + PORT); });
