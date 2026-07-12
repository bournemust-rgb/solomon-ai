require("dotenv").config();
var express = require("express");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var delivery = require('./delivery');
var { fullTerms } = require('./terms');
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

// ===== SOCIALS =====
function getSocialsResponse() {
  return "🌐 FOLLOW SOLOMON COATINGS!\n\n📱 Facebook\n" + FACEBOOK + "\n\n🎵 TikTok\n" + TIKTOK + "\n\n🌐 Website\nhttps://solomoncoatings.co.za\n\nSee our latest projects, before/after photos, and coating tips!\n\nType *menu* to go back.";
}

// ===== GALLERY WITH PAGINATION =====
const GALLERY_COLORS = [
  { id: "1", name: "🔴 Red", images: ["https://solomon-ai-izyb.onrender.com/photos/red-gloss-001.jpg", "https://solomon-ai-izyb.onrender.com/photos/red-gloss-002.jpg"] },
  { id: "2", name: "🟡 Yellow", images: ["https://solomon-ai-izyb.onrender.com/photos/yellow-001.jpg"] },
  { id: "3", name: "🟢 Green", images: ["https://solomon-ai-izyb.onrender.com/photos/green-001.jpg"] },
  { id: "4", name: "🔵 Blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-001.jpg"] },
  { id: "5", name: "💙 Light Blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-light-001.jpg"] },
  { id: "6", name: "🟦 Dark Blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-dark-001.jpg"] },
  { id: "7", name: "⬛ Black", images: ["https://solomon-ai-izyb.onrender.com/photos/black-gloss-001.jpg", "https://solomon-ai-izyb.onrender.com/photos/black-gloss-002.jpg"] },
  { id: "8", name: "⚫ Matt Black", images: ["https://solomon-ai-izyb.onrender.com/photos/black-matte-001.jpg"] },
  { id: "9", name: "🔨 Hammered Black", images: ["https://solomon-ai-izyb.onrender.com/photos/hammered-black-001.jpg"] },
  { id: "10", name: "⚪ White", images: ["https://solomon-ai-izyb.onrender.com/photos/white-001.jpg"] },
  { id: "11", name: "🩶 Grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-001.jpg"] },
  { id: "12", name: "🌫️ Dark Grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-dark-001.jpg"] },
  { id: "13", name: "☁️ Light Grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-light-001.jpg"] },
  { id: "14", name: "🟤 Brown", images: ["https://solomon-ai-izyb.onrender.com/photos/brown-001.jpg"] },
  { id: "15", name: "🥉 Bronze", images: ["https://solomon-ai-izyb.onrender.com/photos/bronze-001.jpg"] },
  { id: "16", name: "✨ Charcoal", images: ["https://solomon-ai-izyb.onrender.com/photos/charcoal-001.jpg", "https://solomon-ai-izyb.onrender.com/photos/charcoal-002.jpg"] },
  { id: "17", name: "🟪 Purple", images: ["https://solomon-ai-izyb.onrender.com/photos/purple-001.jpg"] },
  { id: "18", name: "🌅 Orange", images: ["https://solomon-ai-izyb.onrender.com/photos/orange-001.jpg"] },
  { id: "19", name: "🎨 Silver", images: ["https://solomon-ai-izyb.onrender.com/photos/silver-001.jpg"] },
  { id: "20", name: "🥇 Gold", images: ["https://solomon-ai-izyb.onrender.com/photos/gold-001.jpg"] }
];

function getGalleryMenu(pageNumber) {
  pageNumber = pageNumber || 1;
  var itemsPerPage = 10;
  var totalPages = Math.ceil(GALLERY_COLORS.length / itemsPerPage);
  var startIdx = (pageNumber - 1) * itemsPerPage;
  var endIdx = Math.min(startIdx + itemsPerPage, GALLERY_COLORS.length);
  var pageItems = GALLERY_COLORS.slice(startIdx, endIdx);

  var menu = "🎨 COLOUR GALLERY - Page " + pageNumber + "/" + totalPages + "\n\n";
  for (var i = 0; i < pageItems.length; i++) {
    var cat = pageItems[i];
    var number = startIdx + i + 1;
    menu += number + ". " + cat.name + "\n";
  }

  if (pageNumber === 1 && totalPages > 1) menu += "\n➡️ Type *S2* for page 2.";
  else if (pageNumber === 2 && totalPages > 2) menu += "\n➡️ Type *S3* for page 3.";

  menu += "\n\n📌 Reply with a number (e.g., *1* for Red)\n\n🔗 View full gallery:\nhttps://drive.google.com/drive/folders/YOUR-FOLDER-ID\n\nType *menu* to go back.";
  return menu;
}

function getColorResponse(colorId) {
  var category = GALLERY_COLORS.find(function(cat) { return cat.id === String(colorId); });
  if (!category) return "Sorry, that colour not found. Type *gallery* to see all colours.";
  var msg = category.name + "\n\n";
  for (var i = 0; i < category.images.length; i++) {
    msg += "📸 Example " + (i + 1) + ":\n" + category.images[i] + "\n\n";
  }
  msg += "Want this colour? Type: quote 20kg gate\n\nType *menu* to go back.";
  return msg;
}

// ===== FALLBACKS & WISDOM =====
var funFallbacks = [
  "Ag sorry, I'm just a powder coating oom, not Google! \n\nTry *menu* to see my Secret List, or WhatsApp Ridhor on 076 760 4350.",
  "Eish, you got me there! I know coating, not that. \n\nType *menu* for what I CAN do, or chat to Ridhor: 076 760 4350.",
  "That one's above my pay grade! I'm here for powder coating, colours, and quotes. \n\nType *menu* or WhatsApp Ridhor: 076 760 4350."
];

var affirmations = [
  "Fun fact: A well-coated gate is the silent guardian of your driveway.",
  "Did you know? Powder coating is tougher than your mother-in-law's opinions.",
  "Hot tip: Black powder coat absorbs less heat than you'd think. Science, my bru.",
  "Solomon truth: We've been coating since '88. That's before Google."
];

var TPS_QUOTES = [
  "TPS 1988: Started in a garage with one compressor and a dream.",
  "TPS: Prep is 90% of the job. The coating is the easy part.",
  "TPS: If you can see rust, it's already too late — blast it properly.",
  "TPS: Black never goes out of style, but charcoal hides dust better.",
  "TPS: Coastal air eats cheap coating. Do it once, do it right.",
  "TPS: A clean gate before coating is like a clean plate — everything sticks better.",
  "TPS: We don't cut corners, we coat them.",
  "TPS: 36 years taught me one thing — the customer remembers the finish, not the price.",
  "TPS: Loadshedding can't stop rust, but it can delay us. We work around it.",
  "TPS: If it can handle 200C, we can coat it. If it melts, we can't.",
  "TPS: Good blasting is noisy, dusty, and worth every cent.",
  "TPS: The cheapest quote is usually the most expensive redo.",
  "TPS: Satin hides fingerprints. Gloss shows off. Choose your battle.",
  "TPS: Measure twice, blast once, coat once.",
  "TPS: A gate coated in winter lasts longer than excuses in summer.",
  "TPS: We are not the cheapest. We are the ones you call to fix the cheapest.",
  "TPS: RAL codes are suggestions. Real colour is in the oven.",
  "TPS: Since '88, one rule: treat every gate like it's your own driveway."
];

function randomFallback() { return funFallbacks[Math.floor(Math.random() * funFallbacks.length)]; }
function randomAffirmation() { return affirmations[Math.floor(Math.random() * affirmations.length)]; }
function randomTPS() { return "TPS DAILY WISDOM\n\n" + TPS_QUOTES[Math.floor(Math.random() * TPS_QUOTES.length)] + "\n\nType *menu* for more."; }

// ===== UTILITIES =====
function getOrderRef() {
  var d = new Date();
  return "SC" + d.getFullYear().toString().slice(-2) + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + "-" + Math.floor(Math.random() * 9000 + 1000);
}

function isAfterHours() {
  var now = new Date();
  var day = now.getDay();
  var t = now.getHours() * 60 + now.getMinutes();
  if (day === 0 || day === 6) return true;
  if (day === 5 && t >= 885) return true;
  if (day >= 1 && day <= 4 && (t < 480 || t >= 1005)) return true;
  return false;
}

// ===== PRICE CALCULATOR =====
function estimatePrice(text) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  var vatRate = 0.15;

  if (t.includes("rim")) {
    var qty = t.match(/(\d+)/);
    qty = qty ? parseInt(qty[1]) : 4;
    var sets = Math.ceil(qty / 4);
    var rimColour = (t.includes("metallic")||t.includes("gold")||t.includes("bronze")||t.includes("charcoal")||t.includes("silver")) ? "premium" : "standard";
    var rimLow = rimColour === "standard" ? 1000 : 1200;
    var rimHigh = rimColour === "standard" ? 1200 : 1500;
    var rimTotalLow = rimLow * sets, rimTotalHigh = rimHigh * sets;
    var rimVatLow = Math.round(rimTotalLow * vatRate), rimVatHigh = Math.round(rimTotalHigh * vatRate);
    return "RIMS ESTIMATE - Ref: " + ref + "\n\n" + qty + " rims = " + sets + " set(s)\nColour: " + (rimColour === "standard" ? "Standard" : "Premium") + "\n\nExcl VAT: R" + rimTotalLow.toLocaleString() + " - R" + rimTotalHigh.toLocaleString() + "\nVAT (15%): R" + rimVatLow.toLocaleString() + " - R" + rimVatHigh.toLocaleString() + "\nIncl VAT: R" + (rimTotalLow + rimVatLow).toLocaleString() + " - R" + (rimTotalHigh + rimVatHigh).toLocaleString() + "\n\nCustomer MUST remove tyres. Estimate only. WhatsApp Ridhor: 076 760 4350.\n\n" + randomAffirmation();
  }

  if (t.includes("kg")||t.includes("gate")||t.includes("burglar")||t.includes("fence")||t.includes("railing")||t.includes("balustrade")) {
    var kg = t.match(/(\d+)\s*kg/);
    kg = kg ? parseInt(kg[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 10);
    var isPremium = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("silver")||t.includes("blue")||t.includes("red")||t.includes("green"));
    var rateLow = isPremium ? 17 : 16, rateHigh = isPremium ? 20 : 16;
    var coatingLow = kg * rateLow, coatingHigh = kg * rateHigh;
    var blastOnly = ((t.includes("blast only")||t.includes("sandblast only")||t.includes("blasting only"))&&!t.includes("coat"));

    if (blastOnly) {
      var bl = kg * 8, bh = kg * 12;
      var bvl = Math.round(bl * vatRate), bvh = Math.round(bh * vatRate);
      return "BLASTING ONLY ESTIMATE - Ref: " + ref + "\n\n" + kg + "kg\nR8-R12/kg\n\nExcl VAT: R" + bl.toLocaleString() + " - R" + bh.toLocaleString() + "\nVAT: R" + bvl.toLocaleString() + " - R" + bvh.toLocaleString() + "\nIncl VAT: R" + (bl + bvl).toLocaleString() + " - R" + (bh + bvh).toLocaleString() + "\n\nEstimate only.\n\n" + randomAffirmation();
    }

    var vl = Math.round(coatingLow * vatRate), vh = Math.round(coatingHigh * vatRate);
    var msg = "GATE/PER KG ESTIMATE - Ref: " + ref + "\n\nWeight: " + kg + " kg\nColour: " + (isPremium ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + coatingLow.toLocaleString() + " - R" + coatingHigh.toLocaleString() + "\nVAT (15%): R" + vl.toLocaleString() + " - R" + vh.toLocaleString() + "\nTOTAL (incl VAT): R" + (coatingLow + vl).toLocaleString() + " - R" + (coatingHigh + vh).toLocaleString();
    if (kg > 100) msg += "\n\nBulk discount up to 10% may apply.";
    msg += "\n\nEstimate only. WhatsApp Ridhor: 076 760 4350.\n\n" + randomAffirmation();
    return msg;
  }

  if (t.includes("sheet")||t.includes("mesh")) {
    var sqm = t.match(/(\d+)\s*sqm/);
    sqm = sqm ? parseInt(sqm[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 5);
    var sp = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold"));
    var sl = sp ? 251 : 175, sh = sp ? 350 : 250;
    var stl = sqm * sl, sth = sqm * sh;
    var svl = Math.round(stl * vatRate), svh = Math.round(sth * vatRate);
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\n" + sqm + " sqm\nColour: " + (sp ? "Premium" : "Standard") + "\n\nExcl VAT: R" + stl.toLocaleString() + " - R" + sth.toLocaleString() + "\nVAT: R" + svl.toLocaleString() + " - R" + svh.toLocaleString() + "\nIncl VAT: R" + (stl + svl).toLocaleString() + " - R" + (sth + svh).toLocaleString() + "\n\n" + randomAffirmation();
  }

  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) {
    var tl = 5000, th = 7500;
    return "TRUCK BLASTING ESTIMATE - Ref: " + ref + "\n\n5m flatbed\n\nExcl VAT: R" + tl.toLocaleString() + " - R" + th.toLocaleString() + "\nVAT: R" + Math.round(tl * vatRate).toLocaleString() + " - R" + Math.round(th * vatRate).toLocaleString() + "\nIncl VAT: R" + Math.round(tl * 1.15).toLocaleString() + " - R" + Math.round(th * 1.15).toLocaleString() + "\n\n" + randomAffirmation();
  }

  return null;
}

// ===== QUICK REPLY DATABASE =====
var QR = {
  "hi":"Hi there! Solomon Coatings here - since 1988.\n\nYou can either:\nType *menu* to see our Secret List\nOr tell me what you need priced — gates, rims, steel, shotblasting, trucks.",
  "hello":"Hi there! Solomon Coatings here.\n\nType *menu* to see our Secret List, or tell me what you need priced.",
  "hey":"Howzit! Type *menu* to see our Secret List, or just ask your question.",
  "howzit":"Howzit! Type *menu* for the full list, or tell me what you need coated.",
  "good morning":"Morning! Solomon Coatings here.\n\nType *menu* to see our Secret List!",
  
  "menu":"SOLOMON COATINGS - Since 1988\n\n1.Pricing\n2.Colours\n3.Quote\n4.Turnaround\n5.Hours\n6.Delivery\n7.Blasting\n8.T&Cs\n9.GALLERY (20+ colours)\n10.Follow Us\n11.Review\n12.Callback\n13.Ridhor\n14.Accounts\n15.TPS Wisdom\n\nOr just tell me what you need priced.",
  
  "pricing":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor a calculated estimate: quote 20kg gate black",
  "colours":"Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\n\nType *gallery* to see 20+ colour examples!",
  "hours":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
  "turnaround":"Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "delivery":"R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
  
  "1":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99",
  "2":"COLOURS\nStandard: Black, White, Brown, Bronze, Charcoal\nHammered: R225+\nMetallic/Custom/RAL: R300+\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone\n\nType *gallery* for examples!",
  "3":"Send: quote 20kg gate charcoal | quote 4 rims metallic | quote 10sqm sheet black | quote 20kg blasting only",
  "4":"TURNAROUND\nUnder 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
  "5":"BUSINESS HOURS\nMon-Thurs: 8AM-4:45PM\nFri: 8AM-2:45PM\nClosed weekends.",
  "6":"DELIVERY & COLLECTION\nR150 metro. Free collection. Collect within 7 days. Late: 7% daily storage.",
  "7":"BLASTING SERVICES\nR8-R12/kg. Truck R5,000-R7,500. Grit 0.12-0.4mm, 6 bar. Client risk. Remove plastic/glass.",
  "8":"TERMS\nCOD only. No coastal warranties (15km). 7% daily storage after 7 days. Items ours until paid.",
  "9":"Type *gallery* to see 20+ colour examples with photos!",
  "10":getSocialsResponse(),
  "11":"REVIEW US\n" + GOOGLE_REVIEW,
  "12":"BOOK A CALLBACK\nSend name + number. Or call " + OFFICE_NUMBER,
  "13":"TALK TO RIDHOR\nWhatsApp: 076 760 4350 | Email: " + QUOTE_EMAIL,
  "14":"ACCOUNT QUERIES\nEmail: " + OFFICE_EMAIL + " | Phone: " + OFFICE_NUMBER,
  "15":"TPS Wisdom - Type *menu* to go back.",
  
  "thanks":"Pleasure! Anything else? Type *menu*",
  "thank you":"Only a pleasure! Type *menu* for more.",
  "bye":"Cheers! Sien jou later."
};

async function forwardImageToOwner(imageId) {
  try {
    if (!WA_TOKEN || !PHONE_ID) return false;
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    return true;
  } catch (e) {
    console.error("forwardImage error:", e.response?.data || e.message);
    return false;
  }
}

function smartMatch(text) {
  var t = text.toLowerCase().trim();

  // TPS WISDOM
  if (t === "15" || t === "tps" || t === "wisdom" || t === "daily wisdom" || t === "tps wisdom") {
    return randomTPS();
  }

  // SOCIALS
  if (t.includes("socials") || t.includes("social") || t.includes("follow") || t === "10") {
    return getSocialsResponse();
  }

  // GALLERY WITH PAGINATION
  if (t.includes("gallery") || t === "9") {
    var pageMatch = t.match(/gallery\s*(\d+)/);
    var page = pageMatch ? parseInt(pageMatch[1]) : 1;
    return getGalleryMenu(page);
  }

  // SHORT PAGE NAVIGATION (S2, S3)
  if (t === "s2") return getGalleryMenu(2);
  if (t === "s3") return getGalleryMenu(3);

  // Gallery color selection by number (1-20) - only after gallery menu was shown, but we avoid interference with QR numbers
  if (/^([1-9]|1[0-9]|20)$/.test(t) && !QR[t]) {
    var colorResponse = getColorResponse(t);
    if (colorResponse) return colorResponse;
  }

  // CALCULATOR
  var calc = estimatePrice(text);
  if (calc) return calc;

  // QUICK REPLY DATABASE
  if (QR[t]) return QR[t];

  // SMART KEYWORD MATCHING
  if (t.includes("affirmation") || t.includes("fact") || t.includes("tip")) return randomAffirmation();
  if (t.includes("reference") || t.includes("order number")) return "Your reference: " + getOrderRef();
  if (t.includes("how busy") || t.includes("queue")) return "For wait time, WhatsApp Ridhor 076 760 4350.";
  if (t.includes("review") || t.includes("rate")) return "Leave a review: " + GOOGLE_REVIEW;
  if (t.includes("terms") || t.includes("t&c")) return QR["8"];
  if (t.includes("order") && (t.includes("status") || t.includes("update") || t.includes("ready"))) return "For order updates, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("book") || t.includes("callback")) return QR["12"];
  if (t.includes("complaint") || t.includes("problem") || t.includes("unhappy")) return "Sorry! WhatsApp Ridhor 076 760 4350 or email " + OFFICE_EMAIL;
  if (t.includes("recommend") || t.includes("refer")) return "We love referrals! Share 060 507 4461";
  if (t.includes("urgent") || t.includes("emergency") || t.includes("asap")) return "For urgent jobs, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("material") || t.includes("can you coat")) return "We coat metals handling 200C+: steel, aluminium, cast iron. No plastic/wood.";
  if (t.includes("collect") || t.includes("storage")) return "Collect within 7 days. Late: 7% daily storage.";
  if (t.includes("coastal") || t.includes("warranty")) return "No warranties within 15km of shoreline.";
  if (t.includes("plastic") || t.includes("glass") || t.includes("hydraulic")) return "Before blasting: Remove plastic, glass, hydraulics.";
  if (t.includes("pay") || t.includes("payment") || t.includes("cod")) return "Strict COD. No release without payment. Accounts: " + OFFICE_EMAIL;
  if (t.includes("account") || t.includes("statement")) return QR["14"];
  if ((t.includes("speak") || t.includes("talk")) && (t.includes("ridhor") || t.includes("owner"))) return QR["13"];
  if (t.includes("bulk") || t.includes("discount")) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("truck") || t.includes("bakkie")) return "Truck blasting: R5,000-R7,500 excl VAT.";
  if (t.includes("blast") || t.includes("sandblast")) return "Blasting: R8-R12/kg. Truck: R5,000-R7,500.";
  if (t.includes("rust")) return "Rusted items: Blasting R8-R12/kg. May reveal defects.";
  if (t.includes("price") || t.includes("cost") || t.includes("how much")) return QR["pricing"];
  if (t.includes("hour") || t.includes("open") || t.includes("close")) return QR["hours"];
  if (t.includes("turnaround") || t.includes("how long")) return QR["turnaround"];
  if (t.includes("deliver") || t.includes("where") || t.includes("address")) return QR["delivery"];
  if (t.includes("contact") || t.includes("email") || t.includes("phone")) return "060 507 4461 | Office: " + OFFICE_NUMBER + " | Email: " + OFFICE_EMAIL;
  if (t.includes("rim") || t.includes("wheel")) return "Rims: R1,000-R1,500/set of 4. For estimate: quote 4 rims black";
  if (t.includes("gate") || t.includes("fence")) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if (t.includes("sheet") || t.includes("mesh")) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if (t.includes("minimum") || t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (t.includes("tyre") || t.includes("tire")) return "Customer MUST remove tyres.";
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if (t.includes("weekend") || t.includes("saturday")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if (t.includes("loadshedding") || t.includes("delay")) return "Timelines affected by loadshedding/weather.";

  return randomFallback();
}

// ===== MESSAGE HANDLER WITH FLOW STATE =====
async function handleMessage(text, from, session) {
  var t = text.toLowerCase().trim();
  var flow = session.flow || { state: "idle" };

  var isGreeting = /^(hi|hello|hey|howzit|good morning|good afternoon|good evening|morning|hola|menu)$/.test(t);
  if (isGreeting) {
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
  }

  if (flow.state !== "idle" && /^(cancel|menu|help|stop)$/.test(t)) {
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    return "No problem, cancelled.\n\n" + smartMatch(text);
  }

  // GATE FLOW
  if (t === "gate" || t === "gates" || t.includes("security gate")) {
    flow = { state: "asked_condition", product: "gate", rustSurcharge: false };
    session.flow = flow;
    await saveSession(from, session);
    return "Got it — gate. What condition? Reply: CLEAN, LIGHT RUST, or BADLY RUSTED.";
  }

  if (flow.state === "asked_condition") {
    var cond = "clean";
    if (/heavy|bad|badly|severe|pitted|flaking|rusty/.test(t)) cond = "rusty";
    else if (/light|surface|bit|little/.test(t)) cond = "light rust";
    flow.condition = cond;
    flow.state = "asked_weight";
    session.flow = flow;
    await saveSession(from, session);
    if (cond === "rusty") { flow.rustSurcharge = true; return "Agh, best ones. Full blast — adds R4-R8/kg extra. Rough weight? Medium gate 15-25kg."; }
    if (cond === "light rust") return "Light rust — quick blast, no extra charge. Rough weight?";
    return "Cool, no rust. Rough weight? 10kg? 20kg? 50kg?";
  }

  if (flow.state === "asked_weight") {
    var kgMatch = t.match(/(\d+)/);
    var kg = kgMatch ? parseInt(kgMatch[1]) : 20;
    flow.weight = kg;
    flow.state = "asked_colour";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it, " + kg + "kg. Colour? Black/White=R16/kg, Charcoal/metallic/custom=R17-R20/kg.";
  }

  if (flow.state === "asked_colour") {
    var isPremium = /charcoal|metallic|bronze|gold|red|blue|green|custom|ral|colour|color/.test(t);
    var rate = isPremium ? 18 : 16;
    var weight = flow.weight || 20;
    var coatingTotal = weight * rate;
    var rustExtra = 0;
    if (flow.rustSurcharge) { rustExtra = weight * 6; coatingTotal += rustExtra; }
    var vat = Math.round(coatingTotal * 0.15);
    var total = coatingTotal + vat;
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    var msg = "YOUR ESTIMATE - Ref: " + getOrderRef() + "\n\n" + weight + "kg gate\nBase: R" + rate + "/kg";
    if (rustExtra > 0) msg += "\nRust surcharge: R" + rustExtra + " (R4-R8/kg)";
    msg += "\n\nExcl VAT: R" + coatingTotal.toLocaleString() + "\nVAT: R" + vat.toLocaleString() + "\nTOTAL: R" + total.toLocaleString() + "\n\nWant to book? Reply YES. Or Ridhor: 076 760 4350.";
    return msg;
  }

  // DELIVERY FLOW
  if (flow.state === "delivery_asking_where") {
    var dist = (delivery && typeof delivery.findDistance === "function") ? delivery.findDistance(t) : null;
    if (dist) {
      flow.deliveryKm = dist;
      flow.deliveryLocation = t;
      flow.state = "delivery_asking_size";
      session.flow = flow;
      await saveSession(from, session);
      return "Got it, " + t + " is about " + dist + "km from Blackheath. Under 1 ton and under 3m? Reply SMALL or LARGE.";
    }
    var nearby = (delivery && typeof delivery.getNearbyAreas === "function") ? delivery.getNearbyAreas().join(", ") : "Bellville, Durbanville, Stellenbosch";
    return "Could not find that area. Try: " + nearby;
  }

  if (flow.state === "delivery_asking_size") {
    var isLarge = /large|big|over|more|truck/.test(t);
    flow.deliveryIsLarge = isLarge;
    flow.state = "delivery_asking_labour";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it. Do you have people to help load? Reply YES (I have help) or NO (send labourer).";
  }

  if (flow.state === "delivery_asking_labour") {
    var needsLabour = /no|need|send|don|dont|labour/.test(t) && !/yes|have|got|sorted/.test(t);
    var calc = (delivery && typeof delivery.calculateDelivery === "function") ? delivery.calculateDelivery(flow.deliveryKm, flow.deliveryIsLarge, needsLabour) : null;
    var resp = (calc && delivery && typeof delivery.formatDeliveryResponse === "function") ? delivery.formatDeliveryResponse(calc, flow.deliveryLocation) : "Delivery to " + flow.deliveryLocation + " calculated. WhatsApp Ridhor 076 760 4350.";
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    return resp;
  }

  var normal = smartMatch(text);
  if (normal === QR["delivery"]) {
    flow.state = "delivery_asking_where";
    session.flow = flow;
    await saveSession(from, session);
    return "Sure! Which area/town? e.g. Bellville, Durbanville, Stellenbosch, Cape Town CBD";
  }

  return normal;
}

// ===== ENDPOINTS =====
app.get("/health", function(req, res) { res.json({ status: "healthy", version: "15.0" }); });
app.get("/", function(req, res) { res.json({ service: "Solomon Coatings", version: "15.0 - Clean Monolith with S2/S3" }); });
app.get("/webhook", function(req, res) {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VT) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
  try {
    var entries = req.body?.entry || [];
    for (var i = 0; i < entries.length; i++) {
      var changes = entries[i].changes || [];
      for (var j = 0; j < changes.length; j++) {
        var msgs = changes[j].value?.messages || [];
        for (var k = 0; k < msgs.length; k++) {
          var from = msgs[k].from, type = msgs[k].type;
          var text = msgs[k].text?.body?.trim() || null;
          var imageId = msgs[k].image?.id || null;
          var afterHours = isAfterHours();

          if (type === "image" && imageId) {
            await forwardImageToOwner(imageId);
            try { await sendMessage(PERSONAL_NUMBER, "Image from " + from); } catch (e) { }
            await sendMessage(from, "Thanks! Forwarded to Ridhor 076 760 4350.");
            continue;
          }

          if (!text) continue;

          var session = await getSession(from);
          var match = await handleMessage(text, from, session);

          if (afterHours) {
            var showClosed = Math.floor(Math.random() * 4) === 0;
            if (showClosed) match = "Our workshop is closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n" + match;
            try { await sendMessage(PERSONAL_NUMBER, "After-hours from " + from + ": " + text); } catch (e) { }
          }

          await sendMessage(from, match);

          session.history = session.history || [];
          session.history.push({ role: "user", content: text }, { role: "model", content: match });
          if (session.history.length > 40) session.history = session.history.slice(-20);
          await saveSession(from, session);
        }
      }
    }
  } catch (e) { console.error("WEBHOOK ERROR:", e.message); }
});

app.listen(PORT, function() {
  console.log("\n✅ SOLOMON v15.0 MONOLITH");
  console.log("   ✓ Gallery with S2/S3 pagination");
  console.log("   ✓ Socials (Facebook, TikTok, Website)");
  console.log("   ✓ Price calculator");
  console.log("   ✓ Flow-based conversations");
  console.log("   ✓ After-hours detection");
  console.log("   ✓ Listening on port " + PORT + "\n");
});

