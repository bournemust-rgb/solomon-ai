// ============================================
// BOT-CORE: Calculator, Quotes, SmartMatch, Flows
// ============================================
var delivery = null;
try {
  delivery = require('./delivery');
} catch (e) {
  console.warn("[bot-core] delivery.js not found or broken. Delivery flow will be limited.");
}

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

function smartMatch(text, QR, getSocialsResponse, getGalleryMenu, getColorResponse, GOOGLE_REVIEW, OFFICE_EMAIL, OFFICE_NUMBER, QUOTE_EMAIL, randomGreeting) {
  var t = text.toLowerCase().trim();

  if (/^(hi|hello|hey|howzit|good morning|good afternoon|good evening|morning|hola)$/.test(t)) {
    if (randomGreeting) return randomGreeting();
    return QR["menu"] || "Hi there! Type *menu* to see our Secret List.";
  }

  if (t === "15" || t === "tps" || t === "wisdom") return randomTPS();
  if (t.includes("socials") || t.includes("social") || t.includes("follow") || t === "10") return getSocialsResponse();
  if (t.includes("gallery") || t === "9") {
    var pageMatch = t.match(/gallery\s*(\d+)/);
    var page = pageMatch ? parseInt(pageMatch[1]) : 1;
    return getGalleryMenu(page);
  }
  if (t === "s2") return getGalleryMenu(2);
  if (t === "s3") return getGalleryMenu(3);
  var colorMatch = t.match(/^c(\d+)$/);
  if (colorMatch) {
    var colorResponse = getColorResponse(colorMatch[1]);
    if (colorResponse) return colorResponse;
  }
  if (/^(1[6-9]|20)$/.test(t) && !QR[t]) {
    var legacyColor = getColorResponse(t);
    if (legacyColor) return legacyColor;
  }

  var calc = estimatePrice(text);
  if (calc) return calc;
  if (QR[t]) return QR[t];

  if (t.includes("affirmation")||t.includes("fact")||t.includes("tip")) return randomAffirmation();
  if (t.includes("reference")||t.includes("order number")) return "Your reference: " + getOrderRef();
  if (t.includes("how busy")||t.includes("queue")) return "For wait time, WhatsApp Ridhor 076 760 4350.";
  if (t.includes("review")||t.includes("rate")) return "Leave a review: " + GOOGLE_REVIEW;
  if (t.includes("terms")||t.includes("t&c")) return QR["8"];
  if (t.includes("order") && (t.includes("status")||t.includes("update")||t.includes("ready"))) return "For order updates, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("book")||t.includes("callback")) return QR["12"];
  if (t.includes("complaint")||t.includes("problem")||t.includes("unhappy")) return "Sorry! WhatsApp Ridhor 076 760 4350 or email " + OFFICE_EMAIL;
  if (t.includes("recommend")||t.includes("refer")) return "We love referrals! Share 060 507 4461";
  if (t.includes("urgent")||t.includes("emergency")||t.includes("asap")) return "For urgent jobs, WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("material")||t.includes("can you coat")) return "We coat metals handling 200C+: steel, aluminium, cast iron. No plastic/wood.";
  if (t.includes("collect")||t.includes("storage")) return "Collect within 7 days. Late: 7% daily storage.";
  if (t.includes("coastal")||t.includes("warranty")) return "No warranties within 15km of shoreline.";
  if (t.includes("plastic")||t.includes("glass")||t.includes("hydraulic")) return "Before blasting: Remove plastic, glass, hydraulics.";
  if (t.includes("pay")||t.includes("payment")||t.includes("cod")) return "Strict COD. No release without payment. Accounts: " + OFFICE_EMAIL;
  if (t.includes("account")||t.includes("statement")) return QR["14"];
  if ((t.includes("speak")||t.includes("talk")) && (t.includes("ridhor")||t.includes("owner"))) return QR["13"];
  if (t.includes("bulk")||t.includes("discount")) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("truck")||t.includes("bakkie")) return "Truck blasting: R5,000-R7,500 excl VAT.";
  if (t.includes("blast")||t.includes("sandblast")) return "Blasting: R8-R12/kg. Truck: R5,000-R7,500.";
  if (t.includes("rust")) return "Rusted items: Blasting R8-R12/kg. May reveal defects.";
  if (t.includes("price")||t.includes("cost")||t.includes("how much")) return QR["pricing"];
  if (t.includes("hour")||t.includes("open")||t.includes("close")) return QR["hours"];
  if (t.includes("turnaround")||t.includes("how long")) return QR["turnaround"];
  if (t === "6" || t.includes("deliver") || t.includes("collection") || t.includes("where") || t.includes("address")) return QR["delivery"];
  if (t.includes("contact")||t.includes("email")||t.includes("phone")) return "060 507 4461 | Office: " + OFFICE_NUMBER + " | Email: " + OFFICE_EMAIL;
  if (t.includes("rim")||t.includes("wheel")) return "Rims: R1,000-R1,500/set of 4. For estimate: quote 4 rims black";
  if (t.includes("gate")||t.includes("fence")) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if (t.includes("sheet")||t.includes("mesh")) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if (t.includes("minimum")||t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (t.includes("tyre")||t.includes("tire")) return "Customer MUST remove tyres.";
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if (t.includes("weekend")||t.includes("saturday")||t.includes("sunday")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if (t.includes("loadshedding")||t.includes("delay")) return "Timelines affected by loadshedding/weather.";

  return randomFallback();
}

async function handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession) {
  var t = text.toLowerCase().trim();
  var flow = session.flow || { state: "idle" };

  var isGreeting = /^(hi|hello|hey|howzit|good morning|good afternoon|good evening|morning|hola|menu|help)$/.test(t);
  if (isGreeting) {
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
  }

  if (flow.state !== "idle" && /^(cancel|stop|exit)$/.test(t)) {
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    return "No problem, cancelled.\n\n" + smartMatchFn("menu");
  }

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
    var isPremium = /charcoal|metallic|bronze|gold|red|blue|green|custom|ral/.test(t);
    var rate = isPremium ? 18 : 16;
    var weight = flow.weight || 20;
    var coatingTotal = weight * rate;
    var rustExtra = 0;
    if (flow.rustSurcharge) { rustExtra = weight * 6; coatingTotal += rustExtra; }
    var vat = Math.round(coatingTotal * 0.15);
    var total = coatingTotal + vat;
    flow = { state: "idle", awaitingBooking: true, lastEstimate: { weight: weight, rate: rate, total: total, rustExtra: rustExtra } };
    session.flow = flow;
    await saveSession(from, session);
    var msg = "YOUR ESTIMATE - Ref: " + getOrderRef() + "\n\n" + weight + "kg gate\nBase: R" + rate + "/kg";
    if (rustExtra > 0) msg += "\nRust surcharge: R" + rustExtra + " (R4-R8/kg)";
    msg += "\n\nExcl VAT: R" + coatingTotal.toLocaleString() + "\nVAT: R" + vat.toLocaleString() + "\nTOTAL: R" + total.toLocaleString() + "\n\nWant to book? Reply YES. Or Ridhor: 076 760 4350.";
    return msg;
  }

  if (flow.state === "idle" && flow.awaitingBooking && /^(yes|book|ok|sure)$/.test(t)) {
    flow.awaitingBooking = false;
    session.flow = flow;
    await saveSession(from, session);
    return "Great! I'll let Ridhor know. WhatsApp him directly to confirm: 076 760 4350.\n\nRef: " + getOrderRef();
  }

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
    var needsLabour = /no|need|send|don|don't|dont|labour/.test(t) && !/yes|have|got|sorted/.test(t);
    var calc = (delivery && typeof delivery.calculateDelivery === "function") ? delivery.calculateDelivery(flow.deliveryKm, flow.deliveryIsLarge, needsLabour) : null;
    var resp = (calc && delivery && typeof delivery.formatDeliveryResponse === "function") ? delivery.formatDeliveryResponse(calc, flow.deliveryLocation) : "Delivery to " + flow.deliveryLocation + " calculated. WhatsApp Ridhor 076 760 4350.";
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    return resp;
  }

  var normal = smartMatchFn(text);
  if (normal === QR["delivery"]) {
    flow.state = "delivery_asking_where";
    session.flow = flow;
    await saveSession(from, session);
    return "Sure! Which area/town? e.g. Bellville, Durbanville, Stellenbosch, Cape Town CBD";
  }

  return normal;
}

module.exports = { randomFallback, randomAffirmation, randomTPS, getOrderRef, isAfterHours, estimatePrice, smartMatch, handleMessage };
