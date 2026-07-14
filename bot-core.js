var { estimatePrice } = require("./calculator");
var { estimatePrice } = require("./calculator");
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
const quoteState = new Map();

function handleQuoteFlow(phone, text) {
  if (!phone) return null;
  const t = text.toLowerCase().trim();
  const state = quoteState.get(phone);
  
  if (t === 'menu' || t === '0') { quoteState.delete(phone); return null; }
  
  if (!state && (t === '3' || t === 'quote')) {
    quoteState.set(phone, { step: 'category' });
    return "💰 NEED A QUOTE?\n\nWhat item do you need coated?\n\n1️⃣ Security / Fencing\n(gates, fences, balustrades, palisades, mesh, spikes, security gates, clear view, sliding gates)\n\n2️⃣ Sheet Metal\n\n3️⃣ Auto Parts\n(rims, tappet covers, intercoolers, bumpers, mouse bars, styling bars, nudge bars, bull bars)\n\nReply with the number or item name.\n\nType *menu* to cancel.";
  }
  
  if (!state) return null;
  
  if (state.step === 'category') {
    if (t.includes('1') || t.includes('security') || t.includes('fence') || t.includes('gate') || t.includes('balustrade') || t.includes('palisade') || t.includes('mesh') || t.includes('spike') || t.includes('clear view') || t.includes('sliding')) {
      quoteState.set(phone, { step: 'sec_colour' });
      return "🛡️ SECURITY / FENCING selected.\n\nWhat colour?\n• Black/White: R16/kg\n• Other colours: R17-20/kg\n\nReply with colour name.\n\nType *menu* to cancel.";
    }
    if (t.includes('2') || t.includes('sheet')) {
      quoteState.set(phone, { step: 'sheet_colour' });
      return "📋 SHEET METAL selected.\n\nWhat colour?\n• Standard: R175-250/sqm\n• Premium: R251-350/sqm\n\nReply with colour name.\n\nType *menu* to cancel.";
    }
    if (t.includes('3') || t.includes('auto') || t.includes('car') || t.includes('rim') || t.includes('tappet') || t.includes('intercooler') || t.includes('bumper') || t.includes('mouse') || t.includes('styling') || t.includes('nudge') || t.includes('bull')) {
      quoteState.set(phone, { step: 'auto_part' });
      return "🚗 AUTO PARTS selected.\n\nWhich part?\n• Rims (see pricing for sizes)\n• Tappet cover: R350 excl VAT\n• Intercooler: R550 excl VAT\n• Bumper / Mouse bar / Styling bar / Nudge bar / Bull bar: R650 excl VAT each\n\nReply with the part name.\n\nType *menu* to cancel.";
    }
    return "Please reply with 1, 2, or 3 (or the item name).\n\nType *menu* to cancel.";
  }
  
  if (state.step === 'sec_colour') {
    const isCheap = t.includes('black') || t.includes('white');
    quoteState.set(phone, { step: 'sec_weight', colour: text, isCheap: isCheap });
    return "Colour: " + text + "\nWhat weight in kg?\nReply: e.g. \"50kg\" or just \"50\"\n\nType *menu* to cancel.";
  }
  
  if (state.step === 'sec_weight') {
    const w = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    const rate = state.isCheap ? 16 : 18.5;
    const total = w * rate;
    quoteState.delete(phone);
    return "📊 ESTIMATE\n\nItem: Security/Fencing\nColour: " + state.colour + "\nWeight: " + w + "kg\nRate: R" + rate + "/kg\n\nEstimated: R" + total.toFixed(2) + " excl VAT\n\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\n📞 076 760 4350\n\nType *menu* to go back to LIST.";
  }
  
  if (state.step === 'sheet_colour') {
    const isStandard = !['silver','gold','premium','metallic','pearl','candy'].some(p => t.includes(p));
    quoteState.set(phone, { step: 'sheet_width', colour: text, isStandard: isStandard });
    return "Colour: " + text + "\nWidth in metres?\nReply: e.g. \"1.5\" or \"2m\"\n\nType *menu* to cancel.";
  }
  
  if (state.step === 'sheet_width') {
    const width = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    quoteState.set(phone, { step: 'sheet_height', colour: state.colour, isStandard: state.isStandard, width: width });
    return "Width: " + width + "m\nHeight in metres?\nReply: e.g. \"2\" or \"1.8m\"\n\nType *menu* to cancel.";
  }
  
  if (state.step === 'sheet_height') {
    const h = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    const area = (state.width || 0) * h;
    const rate = state.isStandard ? 212.5 : 300;
    const total = area * rate;
    quoteState.delete(phone);
    return "📊 ESTIMATE\n\nItem: Sheet Metal\nColour: " + state.colour + "\nSize: " + state.width + "m × " + h + "m = " + area.toFixed(2) + "sqm\nRate: R" + rate + "/sqm\n\nEstimated: R" + total.toFixed(2) + " excl VAT\n\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\n📞 076 760 4350\n\nType *menu* to go back to LIST.";
  }
  
  if (state.step === 'auto_part') {
    if (t.includes('rim')) {
      quoteState.delete(phone);
      return "🛞 RIMS PRICING\n\n• 10-15 inch (Black/White): R1,000-1,500/set\n• 10-15 inch (Other): R1,300-1,700/set\n• 16-18 inch (Black/White): R1,500-1,800/set\n• 16-18 inch (Other): R1,700-2,200/set\n\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\n📞 076 760 4350\n\nType *menu* to go back to LIST.";
    }
    let price = 0, part = '';
    if (t.includes('tappet')) { price = 350; part = 'Tappet cover'; }
    else if (t.includes('intercooler')) { price = 550; part = 'Intercooler'; }
    else if (t.includes('bumper') || t.includes('mouse') || t.includes('styling') || t.includes('nudge') || t.includes('bull')) { price = 650; part = text; }
    else { return "Please reply with the part name.\n\nType *menu* to cancel."; }
    quoteState.delete(phone);
    return "📊 ESTIMATE\n\nItem: " + part + "\nPrice: R" + price + " excl VAT\n\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\n📞 076 760 4350\n\nType *menu* to go back to LIST.";
  }
  
  return null;
}

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

function smartMatch(text, QR, getSocialsResponse, getGalleryMenu, getColorResponse, GOOGLE_REVIEW, OFFICE_EMAIL, OFFICE_NUMBER, QUOTE_EMAIL, randomGreeting) {
  var t = text.toLowerCase().trim();

  if (/^(hi|hello|hey|howzit|good morning|good afternoon|good evening|morning|hola)$/.test(t)) {
    if (randomGreeting) return randomGreeting() + "\n\nType *menu* to see our Secret List, or tell me what you need priced — gates, rims, steel, shotblasting, trucks.";
    return QR["menu"] || "Hi there! Type *menu* to see our Secret List.";
  }

  if (t === "15" || t === "tps" || t === "wisdom") return randomTPS() + "\n\nType *menu* to go back to LIST.";
  if (t.includes("socials") || t.includes("social") || t.includes("follow") || t === "10") return getSocialsResponse() + "\n\nType *menu* to go back to LIST.";
  if (t.includes("gallery") || t === "9") {
    var pageMatch = t.match(/gallery\s*(\d+)/);
    var page = pageMatch ? parseInt(pageMatch[1]) : 1;
    return getGalleryMenu(page) + "\n\nType *menu* to go back to LIST.";
  }
  if (t === "s2") return getGalleryMenu(2) + "\n\nType *menu* to go back to LIST.";
  if (t === "s3") return getGalleryMenu(3) + "\n\nType *menu* to go back to LIST.";
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
  if (t === "6" || t.includes("deliver") || t.includes("collection") || t.includes("where") || t.includes("address")) return "__DELIVERY__";
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
  if (t.includes("account")||t.includes("statement")) return QR["12"];
  if ((t.includes("speak")||t.includes("talk")) && (t.includes("ridhor")||t.includes("owner"))) return QR["11"];
  if (t.includes("bulk")||t.includes("discount")) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if (t.includes("truck")||t.includes("bakkie")) return "Truck blasting: R5,000-R7,500 excl VAT.";
  if (t.includes("blast")||t.includes("sandblast")) return "Blasting: R8-R12/kg. Truck: R5,000-R7,500.";
  if (t.includes("rust")) return "Rusted items: Blasting R8-R12/kg. May reveal defects.";
  if (t.includes("price")||t.includes("cost")||t.includes("how much")) return QR["pricing"];
  if (t.includes("hour")||t.includes("open")||t.includes("close")) return QR["hours"];
  if (t.includes("turnaround")||t.includes("how long")) return QR["turnaround"];
  
  if (t.includes("contact")||t.includes("email")||t.includes("phone")) return "060 507 4461 | Office: " + OFFICE_NUMBER + " | Email: " + OFFICE_EMAIL;
  if (t.includes("rim")||t.includes("wheel")) return "Rims: R1,000-R1,500/set of 4. For estimate: quote 4 rims black";
  if (t.includes("gate")||t.includes("fence")) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  // sheet/mesh now handled by handleMessage flow
  if (t.includes("minimum")||t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if (t.includes("tyre")||t.includes("tire")) return "Customer MUST remove tyres.";
  if (t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if (t.includes("weekend")||t.includes("saturday")||t.includes("sunday")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if (t.includes("loadshedding")||t.includes("delay")) return "Timelines affected by loadshedding/weather.";


  // ===== EXPANDED FAQ KEYWORDS (matches inside sentences) =====
  if (t.includes("braai") || t.includes("bbq") || t.includes("barbecue") || t.includes("grill")) return "Ja my bru, we can coat braai stands and grills! As long as it's metal. High-heat powder available. Send a photo on WhatsApp. 076 760 4350";
  if (t.includes("aluminium") || t.includes("aluminum") || t.includes("alloy")) return "Ja, we coat aluminium! Needs proper etching first. Bring it through or send a photo. 076 760 4350";
  if (t.includes("anodizing") || t.includes("anodising") || t.includes("galvanizing") || t.includes("galvanising")) return "We don't do wet paint, anodizing, or galvanizing, my bru. Powder coating only - but it's tougher than all of them!";
  if (t.includes("wet paint") || t.includes("spray paint")) return "We don't do wet paint or spray paint. Powder coating only - tougher finish, lasts 15-20 years.";
  if (t.includes("durability") || t.includes("lifespan") || t.includes("last how")) return "Powder coating lasts 15-20 years outdoors, 30+ indoors. Chip-resistant, UV-stable, doesn't fade like wet paint.";
  if (t.includes("chip") || t.includes("scratch") || t.includes("repair") || t.includes("touch up")) return "Powder coat is chip-resistant but not chip-proof. Small scratches can be touched up. Big damage needs re-blast and re-coat.";
  if (t.includes("colour") || t.includes("color") || t.includes("ral") || t.includes("colour match")) return "20+ colours including RAL matches! Type *9* for our GALLERY or WhatsApp Ridhor for custom colours. 076 760 4350";
  if (t.includes("temperature") || t.includes("heat resistant") || t.includes("high heat")) return "Standard powder coat handles up to 180C. High-heat powder available for braais, fire pits, exhausts. 076 760 4350";
  if (t.includes("thickness") || t.includes("micron") || t.includes("how thick")) return "Standard coat is 60-80 microns. We can go thicker for industrial applications. Tell us your spec.";
  if (t.includes("prep") || t.includes("preparation") || t.includes("strip") || t.includes("remove old paint")) return "Prep is 90% of the job! We shotblast first (R8-R12/kg) to remove rust and old paint. Then coat. No shortcuts.";
  if (t.includes("warranty") || t.includes("guarantee") || t.includes("guaranteed")) return "We guarantee proper adhesion and coverage. If it peels due to our prep, we redo it. No coastal warranties though.";
  if (t.includes("lead time") || t.includes("how quick")) return "Standard turnaround 3-5 working days. Big jobs or custom colours might take longer. Loadshedding can delay things.";
  if (t.includes("inspection") || t.includes("quality") || t.includes("check")) return "Every job inspected before collection. Not happy? Tell us before you leave - we'll fix it.";
  if (t.includes("transport") || t.includes("courier") || t.includes("ship") || t.includes("send it")) return "We can arrange courier for out-of-town jobs. Or collect from 5 Jakaranda St, Blackheath, Cape Town.";
  if (t.includes("outdoor") || t.includes("outside") || t.includes("exterior") || t.includes("weather")) return "Powder coating is perfect for outdoor use! UV-stable, rain-resistant, won't peel. Gates, fences, furniture - all good.";
  if (t.includes("indoor") || t.includes("inside") || t.includes("interior")) return "Ja, we coat indoor stuff too - furniture, fixtures, bike frames. Any metal that needs a tough finish.";
  if (t.includes("car part") || t.includes("automotive") || t.includes("engine")) return "We coat car parts, rims, bumpers, bike frames. High-heat parts need special powder. 076 760 4350";
  if (t.includes("exhaust") || t.includes("manifold") || t.includes("header")) return "Exhausts and manifolds need high-temp powder. We've done plenty. Bring it in. 076 760 4350";
  if (t.includes("motorcycle") || t.includes("bike frame") || t.includes("bicycle")) return "Bike frames, motorcycle parts, rims - we coat them all! Send a photo. 076 760 4350";
  if ((t.includes("fence") || t.includes("palisade") || t.includes("balustrade") || t.includes("railing")) && !t.match(/\d/)) return "Fences, palisades, balustrades, railings - we coat them all! Tell me the weight and colour for a quote.\n\nExample: palisade 30kg black";
  if (t.includes("furniture") || t.includes("table") || t.includes("chair") || t.includes("patio")) return "Outdoor furniture, tables, chairs, patio sets - we coat them! Must be metal. Send photos for quote.";
  if (t.includes("tool") || t.includes("machinery") || t.includes("equipment") || t.includes("industrial")) return "Tools, machinery, industrial equipment - we coat them all. Bring it through. 076 760 4350";
  if (t.includes("food safe") || t.includes("kitchen") || t.includes("food grade")) return "We have food-safe powder coatings for kitchen equipment. Tell Ridhor what you need. 076 760 4350";
  if (t.includes("diy") || t.includes("do it myself") || t.includes("home") || t.includes("garage")) return "DIY powder coating is tricky - need blast cabinet, spray booth, oven. Bring it to us. Proper equipment, proper result.";
  if (t.includes("eco") || t.includes("environment") || t.includes("green") || t.includes("voc")) return "Powder coating is eco-friendly! No solvents, no VOCs, minimal waste. Overspray is recycled. Greener than wet paint.";
  if (t.includes("electrostatic") || t.includes("how it works") || t.includes("process")) return "We blast, spray charged powder, then bake at 180-200C. The powder melts into a tough, even skin. Lasts 15-20 years!";
  if (t.includes("sandblast") || t.includes("grit blast")) return "We do shotblasting - cleaner, more controlled. R8-R12/kg. Perfect prep for coating.";
  if (t.includes("masking") || t.includes("thread") || t.includes("bolt") || t.includes("hole")) return "We mask threads, holes, and mating surfaces. Tell us what needs to stay clean.";
  if (t.includes("sample") || t.includes("test piece") || t.includes("swatch")) return "Test pieces and colour swatches available. Small fee applies. WhatsApp Ridhor. 076 760 4350";
  if (t.includes("bee") || t.includes("b-bbee") || t.includes("empowerment")) return "Let me get Ridhor on this - WhatsApp him on 076 760 4350.";
  if (t.includes("eft") || t.includes("card") || t.includes("credit card") || t.includes("paypal")) return "COD only, my bru. Cash on collection. No EFT, no cards. Payment before release.";
  if (t.includes("quote") || t.includes("estimate") || t.includes("price")) return "Type *3* for a formal quote, or tell me what you need priced - gates, rims, steel, shotblasting, trucks.";
  if (t.includes("location") || t.includes("address") || t.includes("where") || t.includes("direction")) return "5 Jakaranda Street, Blackheath, Cape Town. Mon-Thu 8AM-4:45PM, Fri 8AM-2:45PM.";
  if (t.includes("hours") || t.includes("open") || t.includes("close") || t.includes("time")) return "Mon-Thu 8AM-4:45PM, Fri 8AM-2:45PM. Closed weekends and public holidays.";
  if (t.includes("delivery") || t.includes("collect") || t.includes("fetch")) return "Type *6* for delivery options. R150 Cape Town metro. Free collection. 7% daily storage after 7 days.";
  if (t.includes("storage") || t.includes("leave") || t.includes("hold") || t.includes("keep")) return "Free storage for 7 days. After that, 7% of the job value per day. Collect on time!";
  if (t.includes("review") || t.includes("google") || t.includes("rating") || t.includes("feedback")) return "Type *11* to leave a Google review! Helps other customers find us. Much appreciated!";
  if (t.includes("social") || t.includes("facebook") || t.includes("instagram") || t.includes("tiktok")) return "Type *10* to follow us on Facebook and TikTok. Before/after shots posted regularly!";
  if (t.includes("tip") || t.includes("advice") || t.includes("recommend")) return "TPS Wisdom: Prep is 90% of the job. The coating is the easy part. Type *15* for more Truth Bombs.";
  if (t.includes("history") || t.includes("since when") || t.includes("experience")) return "Solomon Coatings since 1988, my bru. One compressor and a dream. Now Cape Town's powder coating legends.";
  if (t.includes("owner") || t.includes("ridhor") || t.includes("solomon")) return "Ridhor runs the show. WhatsApp him directly: 076 760 4350. Coating since the 90s.";
  if (t.includes("job") || t.includes("hiring") || t.includes("vacancy") || t.includes("career")) return "We're always looking for good people! Send CV to populier@mweb.co.za or WhatsApp. 076 760 4350";
  if (t.includes("apprentice") || t.includes("student") || t.includes("training") || t.includes("learn")) return "We take apprentices for practical training. WhatsApp Ridhor to discuss. 076 760 4350";
  if (t.includes("maintenance") || t.includes("clean") || t.includes("wash") || t.includes("care")) return "Just wash with soap and water. No wax needed. No abrasive cleaners. Stays fresh for years.";
  if (t.includes("uv") || t.includes("sun") || t.includes("fade") || t.includes("discolour")) return "Our powders are UV-stable. Won't fade or chalk in the sun. Gates stay looking fresh.";
  if (t.includes("salt") || t.includes("sea") || t.includes("marine") || t.includes("boat")) return "Coastal areas need extra prep - salt is sneaky. Corrosion-resistant primers used. Tell Ridhor. 076 760 4350";
  if (t.includes("oil") || t.includes("grease") || t.includes("petrol") || t.includes("diesel") || t.includes("fuel")) return "Petrol, diesel, oil don't affect powder coating. But clean spills quickly - solvents can soften it over time.";
  if (t.includes("acid") || t.includes("chemical") || t.includes("solvent") || t.includes("spill")) return "Acids and strong solvents can damage powder coat. Wipe spills immediately.";
  if (t.includes("dent") || t.includes("bend") || t.includes("warp") || t.includes("damage")) return "We don't do panel beating or welding. Fix dents first, then bring to us for coating.";
  if (t.includes("weld") || t.includes("fabrication") || t.includes("steel work") || t.includes("metal work")) return "We don't do welding - we coat what you bring. We know good fabricators. Ask Ridhor.";
  if (t.includes("glass") || t.includes("wood") || t.includes("plastic") || t.includes("rubber")) return "Powder coating is for metal only. No glass, wood, plastic, or rubber. Bring us metal!";
  if (t.includes("chrome") || t.includes("polish") || t.includes("mirror") || t.includes("shiny")) return "We don't do chrome or mirror finishes. Powder gives smooth colour - matte, satin, or gloss.";
  if (t.includes("textured") || t.includes("wrinkle") || t.includes("hammer")) return "Ja, we do textured finishes! Wrinkle, hammer tone, vein patterns - all available. 076 760 4350";
  if (t.includes("metallic") || t.includes("pearl") || t.includes("candy") || t.includes("sparkle")) return "Metallic, pearl, candy colours available! Tell Ridhor your dream colour. 076 760 4350";
  if (t.includes("gloss") || t.includes("matte") || t.includes("satin") || t.includes("finish")) return "Gloss, satin, matte, textured - your choice! Gloss is shiny, matte is modern, satin is middle ground.";
  if (t.includes("primer") || t.includes("undercoat") || t.includes("base") || t.includes("sealer")) return "We use zinc-rich primer for steel, etch primer for aluminium. Included in prep price.";
  if (t.includes("galvanized") || t.includes("galvanised") || t.includes("hot dip") || t.includes("zinc")) return "We can coat over galvanizing - needs special prep. Zinc can outgas. Tell Ridhor. 076 760 4350";
  if (t.includes("stainless") || t.includes("inox") || t.includes("304") || t.includes("316")) return "Stainless steel can be coated - needs special etching to stick. We know the process. 076 760 4350";
  if (t.includes("cast") || t.includes("iron") || t.includes("wrought")) return "Cast iron and cast aluminium - we coat them! Need extra cleaning for porous castings. 076 760 4350";
  if (t.includes("old") || t.includes("restore") || t.includes("refurbish") || t.includes("vintage") || t.includes("classic")) return "Restoration is our favourite! Old gates, vintage furniture, classic car parts - we bring them back. Send photos.";
  if (t.includes("new") || t.includes("fresh") || t.includes("raw") || t.includes("virgin")) return "New steel needs degreasing and light blasting before coating. We handle all prep. Just bring it.";
  if (t.includes("second hand") || t.includes("used") || t.includes("scrap") || t.includes("pre-owned")) return "Second-hand stuff is fine - we blast off old paint and rust, then coat. As long as it's metal.";
  if (t.includes("sheet") || t.includes("plate") || t.includes("panel") || t.includes("flat")) return "Sheet metal, plates, panels - R175-R350/sqm depending on size and colour. Send specs.";
  if (t.includes("tube") || t.includes("pipe") || t.includes("round") || t.includes("circular")) return "Tubes, pipes, round bars - no problem. We have jigs to hold them while coating.";
  if (t.includes("wire") || t.includes("mesh") || t.includes("grid") || t.includes("screen")) return "Wire mesh, grids, screens - we coat them! Extra care needed for full coverage. Tell Ridhor.";
  if (t.includes("spring") || t.includes("coil") || t.includes("flexible")) return "Springs and flexible parts tricky - powder can crack when flexing. Tell Ridhor the application.";
  if (t.includes("sharp") || t.includes("edge") || t.includes("point") || t.includes("corner")) return "Sharp edges need extra powder for full coverage. Standard practice - we build up edges.";
  if (t.includes("logo") || t.includes("brand") || t.includes("name") || t.includes("text")) return "We can mask logos and text, or coat over them. Custom branding - speak to Ridhor. 076 760 4350";
  if (t.includes("sign") || t.includes("display") || t.includes("stand") || t.includes("banner")) return "Signs, displays, stands - we coat metal frames and backing. For printed signs, frame only.";
  if (t.includes("gym") || t.includes("fitness") || t.includes("sport")) return "Gym equipment, sports gear - tough finish for tough use. Send photos. 076 760 4350";
  if (t.includes("playground") || t.includes("park") || t.includes("school")) return "Playground equipment, school furniture - safe, durable, colourful. Tell us your spec.";
  if (t.includes("farm") || t.includes("tractor") || t.includes("agricultural") || t.includes("implement")) return "Farm equipment, tractor parts - tough enough for the veld. Send photos. 076 760 4350";
  if (t.includes("mining") || t.includes("heavy") || t.includes("plant")) return "Mining equipment, heavy plant - corrosion-resistant finishes. Tell Ridhor. 076 760 4350";
  if (t.includes("art") || t.includes("sculpture") || t.includes("decorative") || t.includes("design")) return "Art pieces, sculptures, decorative metal - we love these! Bring your vision. Send photos.";
  if (t.includes("gift") || t.includes("present") || t.includes("custom") || t.includes("personalised")) return "Custom gifts, personalised items - nameplates, keyrings. Tell us your idea. 076 760 4350";
  if (t.includes("prototype") || t.includes("one-off") || t.includes("single") || t.includes("unique")) return "Prototypes and one-offs welcome! Bring your idea. 076 760 4350";
  if (t.includes("emergency") || t.includes("urgent") || t.includes("rush") || t.includes("asap")) return "Rush jobs possible depending on queue. Extra charge might apply. WhatsApp Ridhor. 076 760 4350";
  if (t.includes("thank") || t.includes("thanks") || t.includes("dankie")) return "Only a pleasure! Thanks for choosing Solomon Coatings since 1988.";
  if (t.includes("bye") || t.includes("cheers") || t.includes("later")) return "Cheers! Sien jou later. Bring that item through when you're ready.";
  if (t.includes("referral") || t.includes("friend") || t.includes("family") || t.includes("mate")) return "We love referrals! Tell your mates about Solomon Coatings. Word of mouth since 1988!";
  if (t.includes("bad") && t.includes("experience")) return "Sorry to hear that! WhatsApp Ridhor directly on 076 760 4350 - he'll make it right.";
  if (t.includes("compare") || t.includes("vs") || t.includes("versus") || t.includes("difference")) return "Powder coating vs wet paint: Powder is tougher, lasts 15-20 years, no solvents, eco-friendly. Wet paint chips and fades.";
  if (t.includes("load shedding") || t.includes("loadshedding") || t.includes("eskom") || t.includes("power")) return "Loadshedding can delay us. Stage 4+ adds about a day. We run backup where possible. We'll keep you posted!";

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

  // Gate flow trigger: catches any mention of gate/fence/security if no weight given
var hasWeight = /\d+\s*kg/.test(t) || /\d+\s*kilo/.test(t);
if ((t.includes("gate") || t.includes("fence") || t.includes("burglar") || t.includes("security")) && !hasWeight) {
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

  if (flow.state === "sheet_asking_colour") {
    var isPrem = /charcoal|metallic|bronze|gold|red|blue|green|yellow|orange|purple|silver|premium|colour|color|custom|ral/.test(t);
    var isBW = /black|white|bw|standard|matt|matte|satin/.test(t);
    if (!isPrem && !isBW) return "Please reply: BLACK/WHITE (R175-R250/sqm) or PREMIUM colour (charcoal, metallic, green, yellow, etc. R251-R350/sqm)";
    flow.sheetColour = isPrem ? "premium" : "standard";
    flow.sheetRateLow = isPrem ? 251 : 175;
    flow.sheetRateHigh = isPrem ? 350 : 250;
    flow.state = "sheet_asking_width";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - " + (isPrem ? "Premium" : "Black/White") + " (R" + flow.sheetRateLow + "-R" + flow.sheetRateHigh + "/sqm). What is the WIDTH in meters? (e.g. 2)";
  }

  if (flow.state === "sheet_asking_width") {
    var w = t.match(/(\d+\.?\d*)/);
    if (!w) return "Please give me the width in meters. e.g. 2 or 1.5";
    flow.sheetWidth = parseFloat(w[1]);
    flow.state = "sheet_asking_height";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - " + flow.sheetWidth + "m wide. What is the HEIGHT in meters? (e.g. 1.5)";
  }

  if (flow.state === "sheet_asking_height") {
    var h = t.match(/(\d+\.?\d*)/);
    if (!h) return "Please give me the height in meters. e.g. 1.5 or 2";
    flow.sheetHeight = parseFloat(h[1]);
    flow.state = "sheet_asking_sides";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - " + flow.sheetHeight + "m high. Do you need ONE SIDE or BOTH SIDES coated?\n\nReply: 1 (one side) or 2 (both sides)";
  }

  if (flow.state === "sheet_asking_sides") {
    var sides = t.match(/(\d+)/);
    var sideCount = sides ? parseInt(sides[1]) : null;
    if (t.includes("one") || t.includes("single") || sideCount === 1) { sideCount = 1; }
    else if (t.includes("both") || t.includes("two") || t.includes("double") || sideCount === 2) { sideCount = 2; }
    if (!sideCount || (sideCount !== 1 && sideCount !== 2)) return "Please reply: 1 (one side only) or 2 (both sides)";
    
    var area = flow.sheetWidth * flow.sheetHeight * sideCount;
    var rateLow = flow.sheetRateLow, rateHigh = flow.sheetRateHigh;
    var totalLow = Math.round(area * rateLow);
    var totalHigh = Math.round(area * rateHigh);
    var vatLow = Math.round(totalLow * 0.15);
    var vatHigh = Math.round(totalHigh * 0.15);
    var ref = getOrderRef();
    
    var colourLabel = flow.sheetColour === "premium" ? "Premium" : "Standard Black/White";
    var sideLabel = sideCount === 1 ? "one side" : "both sides";
    
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\nSize: " + flow.sheetWidth + "m x " + flow.sheetHeight + "m = " + (flow.sheetWidth * flow.sheetHeight) + " sqm per side\nSides: " + sideLabel + " (" + sideCount + ")\nTotal area: " + area + " sqm\nColour: " + colourLabel + " (R" + rateLow + "-R" + rateHigh + "/sqm)\n\nExcl VAT: R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nIncl VAT: R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
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
  if (normal === "__DELIVERY__") {
    flow.state = "delivery_asking_where";
    session.flow = flow;
    await saveSession(from, session);
    return "Sure! Which area/town? e.g. Bellville, Durbanville, Stellenbosch, Cape Town CBD";
  }
  if (normal && !normal.includes("Secret List") && !normal.includes("Type *S2*") && !normal.includes("Reply with") && !normal.includes("SOLOMON COATINGS - Since") && !normal.includes("Or just tell me what you need priced") && !normal.includes("Type *menu*")) {
    normal = normal + "\n\nType *menu* to go back to LIST.";
  }


  return normal;
}

module.exports = { randomFallback, randomAffirmation, randomTPS, getOrderRef, isAfterHours, smartMatch, handleMessage };































