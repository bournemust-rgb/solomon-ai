// ============================================================
// bot-core.js - SOLOMON COATINGS AI BOT CORE
// Version: 17.0 - Modular 3-File
// ============================================================
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var { randomGreeting } = require("./greetings");
var { randomAffirmation, randomTPS, getOrderRef, isAfterHours } = require("./bot-core");
var { estimatePrice } = require("./calculator");
var { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu } = require("./bot-content");

// ============================================================
// MISSING FUNCTION - ADDED
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

// ============================================================
// CORE FUNCTIONS
// ============================================================
async function handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession) {
  try {
    // 1. Check if it's a quote request
    if (text.toLowerCase().includes('quote') || text.toLowerCase().includes('price') || text.toLowerCase().includes('cost')) {
      return await handleQuote(text, from, session);
    }

    // 2. Check if it's a gallery request
    if (text.toLowerCase().includes('gallery') || text.toLowerCase().includes('colour') || text.toLowerCase().includes('color')) {
      return getGalleryMenu();
    }

    // 3. Check if it's a menu request
    if (text.toLowerCase().includes('menu') || text.toLowerCase().includes('help')) {
      return buildMenu();
    }

    // 4. Check FAQ
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
async function handleQuote(text, from, session) {
  try {
    // Extract weight from text
    var weightMatch = text.match(/(\d+)\s*(?:kg|kgs|kilogram)/i);
    var weight = weightMatch ? parseInt(weightMatch[1]) : null;

    // Extract colour from text
    var colourMatch = text.match(/(black|white|charcoal|grey|silver|red|blue|green|yellow|orange|purple|pink|brown|beige|cream)/i);
    var colour = colourMatch ? colourMatch[1] : null;

    // Detect category
    var category = detectCategory(text);

    // If no weight, ask for it
    if (!weight) {
      return "What is the weight of the item? (in kg)\n\nExample: 20kg";
    }

    // If no category, ask for it
    if (!category) {
      return "Is this a:\n1. Security gate/fence\n2. Sheet metal\n3. Rims/wheels\n\nReply with 1, 2, or 3.";
    }

    // Calculate price
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
  randomAffirmation,
  randomTPS,
  getOrderRef,
  isAfterHours,
  smartMatch,
  estimatePrice
};