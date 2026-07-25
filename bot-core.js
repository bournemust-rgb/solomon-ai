// ============================================================
// bot-core.js - SOLOMON COATINGS AI BOT CORE
// Version: 17.0 - Modular 3-File
// ============================================================
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var { randomGreeting } = require("./greetings");
var { estimatePrice } = require("./calculator");
var { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu } = require("./bot-content");
var { parseQuoteIntent } = require("./services/nvidia");

// ============================================================
// FUNCTIONS
// ============================================================
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
  const affirmations = [
    "Great choice!",
    "Excellent!",
    "Perfect!",
    "Awesome!",
    "Looking good!",
    "Fantastic!"
  ];
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}

function randomTPS() {
  const tps = [
    "💪 Strong as steel!",
    "🔒 Built to last!",
    "✨ Quality guaranteed!",
    "🏆 Industry leader since 1988!",
    "🇿🇦 Proudly South African!"
  ];
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
    
    // Check menu options
    if (QR) {
      for (var key in QR) {
        if (lower.includes(key)) {
          return QR[key];
        }
      }
    }
    
    // Check socials
    if (lower.includes('facebook') || lower.includes('tiktok') || lower.includes('social')) {
      return socialsFn();
    }
    
    // Check gallery
    if (lower.includes('gallery') || lower.includes('colour') || lower.includes('color')) {
      return galleryFn();
    }
    
    // Check colors
    if (lower.includes('black') || lower.includes('white') || lower.includes('grey') || lower.includes('silver')) {
      return colorFn(lower);
    }
    
    return null;
  } catch (error) {
    console.error("[smartMatch] Error:", error.message);
    return null;
  }
}

// ============================================================
// CORE FUNCTIONS
// ============================================================
async function handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession) {
  try {
    console.log("📩 Handling message:", text);
    
    // 1. Check if it's a quote request with NVIDIA
    if (text.toLowerCase().includes('quote') || text.toLowerCase().includes('price') || text.toLowerCase().includes('cost')) {
      // Try NVIDIA first
      const aiResult = await parseQuoteIntent(text);
      if (aiResult && aiResult.weight_kg) {
        console.log("📦 NVIDIA extracted:", aiResult);
        return await handleQuote(text, from, session, aiResult);
      }
      // Fallback to manual quote
      return await handleQuote(text, from, session, null);
    }

    // 2. Check if it's a gallery request
    if (text.toLowerCase().includes('gallery') || text.toLowerCase().includes('colour') || text.toLowerCase().includes('color')) {
      return getGalleryMenu();
    }

    // 3. Check if it's a menu request
    if (text.toLowerCase().includes('menu') || text.toLowerCase().includes('help')) {
      return buildMenu();
    }

    // 4. Check FAQ using smartMatch
    var faqMatch = await smartMatchFn(text);
    if (faqMatch) {
      return faqMatch;
    }

    // 5. Fallback - use AI or default response
    return "I'm not sure how to help with that. Type *menu* to see what I can do, or ask me about quotes, colours, or powder coating!";
  } catch (error) {
    console.error("[handleMessage] Error:", error.message);
    return "Sorry, I had a problem processing your request. Please try again or contact Ridhor directly.";
  }
}

// ============================================================
// QUOTE HANDLING
// ============================================================
async function handleQuote(text, from, session, aiResult) {
  try {
    // Use NVIDIA result if available
    var weight = aiResult?.weight_kg || null;
    var colour = aiResult?.colour || null;
    var category = aiResult?.category || null;

    // If no weight from AI, try regex
    if (!weight) {
      var weightMatch = text.match(/(\d+)\s*(?:kg|kgs|kilogram)/i);
      weight = weightMatch ? parseInt(weightMatch[1]) : null;
    }

    // If no colour from AI, try regex
    if (!colour) {
      var colourMatch = text.match(/(black|white|charcoal|grey|silver|red|blue|green|yellow|orange|purple|pink|brown|beige|cream)/i);
      colour = colourMatch ? colourMatch[1] : null;
    }

    // If no category from AI, detect it
    if (!category) {
      category = detectCategory(text);
    }

    // If no weight, ask for it
    if (!weight) {
      return "What is the weight of the item? (in kg)\n\nExample: 20kg";
    }

    // If no category, ask for it
    if (!category) {
      return "Is this a:\n1. Security gate/fence\n2. Sheet metal\n3. Rims/wheels\n\nReply with 1, 2, or 3.";
    }

    // Calculate price using calculator.js
    var price = estimatePrice(weight, colour, category);

    // Build response
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

// ============================================================
// EXPORT
// ============================================================
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