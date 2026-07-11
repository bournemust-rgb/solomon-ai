// ============================================
// SOLOMON COATINGS - PERSONALITY ENGINE
// Conversational flow + Ridhor's voice
// Does NOT touch index.js - works alongside it
// ============================================

const PERSONALITY = {
  greetings: [
    "Howzit! What's the mission — gate, rims, or something else?",
    "Lekker, you've come to the right place. What are we coating today?",
    "Hey hey! Solomon Coatings here since '88. What you got for us?"
  ],
  
  rust: {
    mild: [
      "Surface rust? Easy. Quick blast and she's clean.",
      "Light rust is no stress. We'll strip it in no time."
    ],
    heavy: [
      "Agh, those are the best ones. Full blasting job — strip it to bare metal, then build it back up.",
      "Proper rusted? Love it. That's what blasting is for. We'll make it look brand new.",
      "Rust is basically free advertising for us. 🤦‍♂️ Bring it in, we'll sort it."
    ]
  },
  
  coastal: [
    "Oh, coastal area. Real talk: salt spray eats regular powder coat for breakfast.",
    "Near the sea? We use epoxy + 2-coat for coastal gear. Costs R2 more per kg but survives 8+ years.",
    "Salt air is brutal. But 36 years in Cape Town — we know the salt game. Epoxy coat sorts it."
  ],
  
  colour_standard: [
    "Classic choice. Black never goes out of style.",
    "Clean look. White shows the quality of the finish — and ours is sharp.",
    "Standard colour — we do these in our sleep. Quick turnaround."
  ],
  
  colour_premium: [
    "Ooh, fancy! Charcoal gives that modern look. Costs a bit more but worth it.",
    "Metallic? Good taste. That's our premium range — deeper colour, tougher finish.",
    "Now you're talking. That colour pops differently in sunlight. You'll love it."
  ],
  
  hours: [
    "We open 8am. Ridhor believes in starting when the sun comes up. Mon-Thurs till 4:45pm, Friday till 2:45.",
    "8am-4:45pm weekdays, 8-2:45 Fridays. We still live in the real world lol. Brackenfell."
  ],
  
  turnaround: [
    "Under a ton? 3 working days. Over a ton? Give us 5-8. We don't rush quality.",
    "Small jobs 3 days, big jobs up to 8. Loadshedding might add a day — we'll keep you posted."
  ],
  
  payment: [
    "COD only my bru. Payment before collection. No exceptions since '88.",
    "We release when payment clears. Old school, but it works."
  ],
  
  blasting: [
    "Blasting strips everything — rust, old paint, bad decisions. R8-R12/kg.",
    "We blast at 6 bar through a 10mm nozzle. Grit/slag medium. It's aggressive — but that's the point."
  ],
  
  tyres: [
    "Customer MUST remove tyres. We don't touch them. Bring rims only.",
    "Tyres off before you come. We coat rims, not rubber. 🤙"
  ],
  
  fallback: [
    "Ag, that's not my lane. I'm a coating oom, not Google! 😄 Type *help* to see what I can do.",
    "Sorry my bru, I don't know that one. I CAN help with pricing, colours, quotes, and coating stuff. Want to try again?",
    "That's above my pay grade! 😂 I handle coating questions. For anything else, WhatsApp Ridhor on 076 760 4350."
  ],
  
  appreciation: [
    "Dankie! That's a compliment to Ridhor AND me. 🙏 Tell your mates about Solomon — 36 years and counting.",
    "Only a pleasure! Word of mouth keeps us going since '88. Appreciate you.",
    "Lekker, glad I could help! Now go tell someone about the oom who knows coating. 😎"
  ],
  
  goodbye: [
    "Cheers! Sien jou later. Bring that item through when you're ready.",
    "Sharp! We're here when you need us. 8am-4:45pm, Brackenfell.",
    "Lekker chatting. Go well, and remember — coating makes us stronger. 💪"
  ]
};

// Conversation flow states
const FLOW = {
  IDLE: 'idle',
  ASKED_PRODUCT: 'asked_product',
  ASKED_CONDITION: 'asked_condition',
  ASKED_WEIGHT: 'asked_weight',
  ASKED_COLOUR: 'asked_colour',
  CONFIRMING_QUOTE: 'confirming_quote'
};

const NEXT_QUESTIONS = {
  asked_product: [
    "Got it. Now — is it clean, surface rust, or proper rusted?",
    "Lekker. What's the condition? Fresh metal, light rust, or needs blasting?",
    "Nice. Condition check — clean, bit of rust, or full rust bucket?"
  ],
  asked_condition: [
    "Cool. Rough weight? If you're not sure, just guess — medium gate is usually 15-25kg.",
    "Weight estimate? Don't stress if you don't know exactly — ballpark is fine.",
    "How heavy we talking? 10kg? 50kg? Just give me a rough number."
  ],
  asked_weight: [
    "And colour? Black, white, charcoal, or something custom?",
    "What colour you thinking? We do standard (black/white) and premium (charcoal, metallic, RAL codes).",
    "Colour time! Black/white = best price. Charcoal/metallic = premium look."
  ]
};

function getPersonality(category, subcategory) {
  if (subcategory && PERSONALITY[category] && PERSONALITY[category][subcategory]) {
    var options = PERSONALITY[category][subcategory];
    return options[Math.floor(Math.random() * options.length)];
  }
  if (PERSONALITY[category]) {
    var options = Array.isArray(PERSONALITY[category]) ? PERSONALITY[category] : [PERSONALITY[category]];
    if (options.length && typeof options[0] === 'string') {
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  return null;
}

function detectProduct(text) {
  var t = text.toLowerCase();
  if (t.includes('gate') || t.includes('fence') || t.includes('burglar')) return 'gate';
  if (t.includes('rim') || t.includes('wheel') || t.includes('mag')) return 'rims';
  if (t.includes('chassis') || t.includes('trailer')) return 'chassis';
  if (t.includes('sheet') || t.includes('mesh') || t.includes('panel')) return 'sheet_metal';
  if (t.includes('truck') || t.includes('bakkie') || t.includes('flatbed')) return 'truck';
  if (t.includes('bracket') || t.includes('small') || t.includes('part')) return 'small_parts';
  return 'unknown';
}

function detectCondition(text) {
  var t = text.toLowerCase();
  if (t.includes('heavy') || t.includes('bad') || t.includes('proper') || t.includes('severe') || t.includes('pitted') || t.includes('flaking')) return 'heavy';
  if (t.includes('light') || t.includes('surface') || t.includes('bit') || t.includes('little') || t.includes('minor')) return 'mild';
  if (t.includes('clean') || t.includes('new') || t.includes('fresh') || t.includes('good') || t.includes('bare')) return 'clean';
  return 'unknown';
}

function isGreeting(text) {
  var t = text.toLowerCase().trim();
  return t === 'hi' || t === 'hello' || t === 'hey' || t === 'howzit' || t === 'good morning' || t === 'sup' || t === 'yo';
}

function isAppreciation(text) {
  var t = text.toLowerCase();
  return t.includes('thanks') || t.includes('thank you') || t.includes('dankie') || t.includes('shot') || t.includes('awesome') || t.includes('great') || t.includes('perfect') || t.includes('legend') || t.includes('amazing');
}

function isGoodbye(text) {
  var t = text.toLowerCase().trim();
  return t === 'bye' || t === 'cheers' || t === 'later' || t === 'cool' || t === 'ok' || t === 'okay';
}

function detectAfrikaans(text) {
  var afrWords = ["dankie","asseblief","goeie","more","middag","aand","hoe","gaan","dit","baie","lekker","ja","nee","mooi","wat","waar","wanneer","hoeveel","kan","ek","jy","ons","hulle","nie","wel","weer","nog","net","nou","dan","ook","hier","daar","so","as","vir","met","van","die","het","sal","gaan","kom","doen","maak","weet","dink","se","praat"];
  var count = 0;
  var words = text.toLowerCase().split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    if (afrWords.indexOf(words[i]) !== -1) count++;
  }
  return count >= 2;
}

module.exports = {
  PERSONALITY,
  FLOW,
  NEXT_QUESTIONS,
  getPersonality,
  detectProduct,
  detectCondition,
  isGreeting,
  isAppreciation,
  isGoodbye,
  detectAfrikaans
};
