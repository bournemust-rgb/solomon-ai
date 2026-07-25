// ============================================================
// bot-core.js - SOLOMON COATINGS AI BOT CORE
// ============================================================
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var { randomGreeting } = require("./greetings");
var { estimatePrice } = require("./calculator");
var { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu } = require("./bot-content");
var { parseQuoteIntent, askLLM } = require("./services/nvidia");

function detectCategory(text) {
  const lower = text.toLowerCase();
  if (lower.includes('gate') || lower.includes('fence') || lower.includes('palisade') || lower.includes('security')) {
    return 'security';
  } else if (lower.includes('sheet') || lower.includes('metal') || lower.includes('plate')) {
    return 'sheet';
  } else if (lower.includes('rim') || lower.includes('wheel') || lower.includes('auto')) {
    return 'auto';
  }
  return null;
}

function randomAffirmation() {
  const affirmations = ["Great choice!", "Excellent!", "Perfect!", "Awesome!", "Looking good!", "Fantastic!"];
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

function randomTPS() {
  const tps = ["💪 Strong as steel!", "🔒 Built to last!", "✨ Quality guaranteed!", "🏆 Industry leader since 1988!", "🇿🇦 Proudly South African!"];
  return tps[Math.floor(Math.random() * tps.length)];
}

function getOrderRef() {
  return 'SC-' + Date.now().toString(36).toUpperCase();
}

function isAfterHours() {
  const now = new Date();
  const hour = now.getHours();
  return hour < 8 || hour >= 17;
}

async function smartMatch(text, QR, socialsFn, galleryFn, colorFn, googleReview, officeEmail, officeNumber, quoteEmail, greetingFn) {
  try {
    const lower = text.toLowerCase();
    if (QR) {
      for (var key in QR) {
        if (lower.includes(key)) {
          return QR[key];
        }
      }
    }
    if (lower.includes('facebook') || lower.includes('tiktok') || lower.includes('social')) return socialsFn();
    if (lower.includes('gallery') || lower.includes('colour') || lower.includes('color')) return galleryFn();
    if (lower.includes('black') || lower.includes('white') || lower.includes('grey') || lower.includes('silver')) return colorFn(lower);
    return null;
  } catch (error) {
    console.error("[smartMatch] Error:", error.message);
    return null;
  }
}

async function handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession) {
  try {
    console.log("📩 Handling message:", text);
    const lower = text.toLowerCase().trim();

    // 1. Handle menu number selections
    if (lower === '1' || lower === 'pricing' || lower === 'price') {
      return "💰 *SOLOMON COATINGS - PRICING* (Excl VAT)\n\n" +
             "🛞 *WHEEL RIM COATING*\n" +
             "- 10-15 inch (Black/White): R1,000 - R1,500/set\n" +
             "- 10-15 inch (Other): R1,300 - R1,700/set\n" +
             "- 16-18 inch (Black/White): R1,500 - R1,800/set\n" +
             "- 16-18 inch (Other): R1,700 - R2,200/set\n\n" +
             "📋 *SHEET METAL & MESH*\n" +
             "- Standard: R175 - R250/sqm\n" +
             "- Premium: R251 - R350/sqm\n\n" +
             "⚙️ *GATES & FENCING*\n" +
             "- Black/White: R16/kg\n" +
             "- Other colours: R17 - R20/kg\n" +
             "- Minimum: R200 excl VAT\n\n" +
             "💥 *BLASTING*\n" +
             "- Per kg: R8 - R12/kg\n" +
             "- Per area: R250/sqm\n" +
             "- Truck: R5,000 - R7,500\n\n" +
             "📞 Call Ridhor: 076 760 4350";
    }

    if (lower === '2' || lower === 'colours' || lower === 'color' || lower === 'gallery') {
      return getGalleryMenu();
    }

    if (lower === '3' || lower === 'quote') {
      return "📋 *QUOTE REQUEST*\n\n" +
             "Send me:\n" +
             "1. What you want coated (gate, rims, sheet metal, etc.)\n" +
             "2. Weight in kg (e.g. 20kg)\n" +
             "3. Colour preference\n" +
             "4. Photos if possible\n\n" +
             "Example: *gate 20kg charcoal*\n\n" +
             "I'll calculate a price for you!";
    }

    if (lower === '4' || lower === 'turnaround' || lower === 'time') {
      return "⏱️ *TURNAROUND TIME*\n\n" +
             "Standard: 3-5 working days\n" +
             "Big jobs: 5-7 working days\n" +
             "Custom colours: +2-3 days\n\n" +
             "Rush jobs available (extra charge)\n" +
             "📞 Ask Ridhor: 076 760 4350";
    }

    if (lower === '5' || lower === 'hours' || lower === 'open') {
      return "🕐 *BUSINESS HOURS*\n\n" +
             "Monday - Thursday: 8AM - 4:45PM\n" +
             "Friday: 8AM - 2:45PM\n" +
             "Saturday: Closed\n" +
             "Sunday: Closed\n\n" +
             "📍 5 Jakaranda Street, Blackheath, Cape Town";
    }

    if (lower === '6' || lower === 'delivery') {
      return "🚚 *DELIVERY*\n\n" +
             "Cape Town Metro: R150\n" +
             "Outside Cape Town: Quote based on location\n" +
             "Free collection from our workshop\n\n" +
             "📍 5 Jakaranda Street, Blackheath";
    }

    if (lower === '7' || lower === 'blasting' || lower === 'shotblasting') {
      return "💥 *SHOTBLASTING*\n\n" +
             "Prices:\n" +
             "- R8 - R12/kg\n" +
             "- R250/sqm\n" +
             "- Trucks: R5,000 - R7,500\n\n" +
             "Prep is 90% of the job!\n" +
             "We blast everything before coating.\n\n" +
             "📞 Call Ridhor: 076 760 4350";
    }

    if (lower === '8' || lower === 'terms' || lower === 't&cs') {
      return "📄 *TERMS & CONDITIONS*\n\n" +
             "1. Payment: COD only (cash on collection)\n" +
             "2. Warranty: We guarantee proper adhesion\n" +
             "3. Turnaround: 3-5 working days\n" +
             "4. Storage: Free for 7 days, then 7% daily\n" +
             "5. Inspection: Check before collection\n\n" +
             "📞 Ridhor: 076 760 4350\n" +
             "📧 infosc@mweb.co.za";
    }

    if (lower === '9') {
      return getGalleryMenu();
    }

    if (lower === '10' || lower === 'social' || lower === 'follow') {
      return getSocialsResponse();
    }

    if (lower === '11' || lower === 'technical' || lower === 'support') {
      return "🔧 *TECHNICAL SUPPORT*\n\n" +
             "Ridhor handles all technical queries.\n" +
             "📞 076 760 4350\n" +
             "📧 infosc@mweb.co.za\n\n" +
             "He can help with:\n" +
             "- Colour matching\n" +
             "- Surface prep\n" +
             "- Custom finishes\n" +
             "- High-heat applications";
    }

    if (lower === '12' || lower === 'accounts' || lower === 'payment') {
      return "💰 *ACCOUNTS & PAYMENT*\n\n" +
             "💳 Payment: Cash on collection only\n" +
             "No EFT, no cards\n" +
             "📍 5 Jakaranda Street, Blackheath\n\n" +
             "📞 Ridhor: 076 760 4350";
    }

    if (lower === '13' || lower === 'tps' || lower === 'wisdom') {
      return randomTPS();
    }

    // 2. Check if it's a quote request
    if (lower.includes('quote') || lower.includes('price') || lower.includes('cost')) {
      const aiResult = await parseQuoteIntent(text);
      if (aiResult && aiResult.weight_kg) {
        console.log("📦 NVIDIA extracted:", aiResult);
        return await handleQuote(text, from, session, aiResult);
      }
      return await handleQuote(text, from, session, null);
    }

    // 3. Check FAQ using smartMatch
    var faqMatch = await smartMatchFn(text);
    if (faqMatch) {
      return String(faqMatch);
    }

    // 4. NVIDIA FALLBACK
    console.log("🤖 FAQ didn't have answer, trying NVIDIA...");
    const nvidiaReply = await askLLM(text);
    if (nvidiaReply) {
      return String(nvidiaReply) + "\n\n💡 *Powered by NVIDIA NIM*";
    }

    return "I'm not sure how to help with that. Type *menu* to see what I can do.";
  } catch (error) {
    console.error("[handleMessage] Error:", error.message);
    return "Sorry, I had a problem. Please try again or contact Ridhor directly.";
  }
}

async function handleQuote(text, from, session, aiResult) {
  try {
    var weight = aiResult?.weight_kg || null;
    var colour = aiResult?.colour || null;
    var category = aiResult?.category || null;

    if (!weight) {
      var weightMatch = text.match(/(\d+)\s*(?:kg|kgs|kilogram)/i);
      weight = weightMatch ? parseInt(weightMatch[1]) : null;
    }
    if (!colour) {
      var colourMatch = text.match(/(black|white|charcoal|grey|silver|red|blue|green|yellow|orange|purple|pink|brown|beige|cream)/i);
      colour = colourMatch ? colourMatch[1] : null;
    }
    if (!category) {
      category = detectCategory(text);
    }

    if (!weight) {
      return "What is the weight of the item? (in kg)\n\nExample: 20kg";
    }
    if (!category) {
      return "Is this a:\n1. Security gate/fence\n2. Sheet metal\n3. Rims/wheels\n\nReply with 1, 2, or 3.";
    }

    var price = estimatePrice(weight, colour, category);
    var response = "🔒 **QUOTE**\n";
    response += "Weight: " + weight + " kg\n";
    if (colour) response += "Colour: " + colour + "\n";
    response += "Category: " + category + "\n";
    response += "Price: R" + price.toFixed(2) + "\n";
    response += "+ VAT: R" + (price * 1.15).toFixed(2) + "\n\n";
    response += "📞 Call Ridhor: 076 760 4350\n";
    response += "📧 Email: infosc@mweb.co.za";
    return response;
  } catch (error) {
    console.error("[handleQuote] Error:", error.message);
    return "Sorry, I couldn't calculate a quote. Please try again or contact Ridhor directly.";
  }
}

module.exports = {
  handleMessage,
  handleQuote,
  detectCategory,
  smartMatch,
  randomAffirmation,
  randomTPS,
  getOrderRef,
  isAfterHours,
  estimatePrice
};
