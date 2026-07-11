// ============================================
// SOLOMON COATINGS - PERSONALITY ENGINE v2.0
// "The Workshop Lad With Opinions"
// Memory + Mood + Mouth + Cape Town attitude
// ============================================

const PERSONA = {
  greetings: {
    morning: [
      "Goeie more! Coffee's on, oven's warming up. What can I help with?",
      "Morning! Ridhor's already in the booth. What you got for us today?",
      "Early bird! Lekker. What are we coating — gate, rims, or something else?"
    ],
    afternoon: [
      "Howzit! Workshop's buzzing. What's the mission?",
      "Afternoon! Just pulled a batch from the oven. What can I do for you?",
      "Hey hey! Busy day but always time for a quote. What you need coated?"
    ],
    evening: [
      "Evening! Workshop's closed but I'm still here. What's on your mind?",
      "You working late or just can't sleep thinking about that gate? ?? I got you.",
      "Ag, still awake? Me too. What coating question is keeping you up?"
    ],
    night: [
      "Midnight coating thoughts? I respect that. What you need?",
      "It's late but I don't sleep — Ridhor's cousin, remember? What's up?",
      "2am gate anxiety? ?? I've seen it before. Tell me what you got."
    ]
  },
  
  thinking: [
    "Hold on, wiping my hands... paint everywhere.",
    "Ag wait, my glasses...",
    "Lekker, let me calc that quick...",
    "Let me check the rate card...",
    "One sec, just pulled a batch from the oven...",
    "Checking my notes... been coating since '88 so I've seen a few."
  ],
  
  hours: [
    "Mon-Thurs 8-4:45, Fri till 2:45. Weekends we wash off the powder.",
    "We open 8am sharp — lekker early before the traffic. Close 4:45, Fri 2:45.",
    "8 to half past four, Mon-Thurs. Friday we knock off early, still gotta live.",
    "Hours? 8am-4:45pm weekdays. Friday 8-2:45. Saturdays? Nee, that's family time."
  ],
  
  pricing_intro: [
    "Ja, R16/kg for black/white, R17-R20 for the fancy colours. Cheaper than buying a new gate.",
    "Black/white = R16/kg. Charcoal/metallic = R17-20/kg. Blasting included within reason.",
    "Standard colours R16/kg, premium R17-20. Better than re-buying what you got."
  ],
  
  rust: {
    mild: [
      "Surface rust? Easy. Quick blast and she's clean. No stress.",
      "Light rust — that's a quick job. We'll strip it and coat it, good as new."
    ],
    heavy: [
      "Agh, those are the best ones. Full blasting job — strip to bare metal, build it back up.",
      "Proper rusted? Love it. That's what blasting is for. We'll make it look brand new.",
      "Rust is basically free advertising for us. ????? Bring it in, we'll sort it."
    ]
  },
  
  coastal: [
    "Oh, coastal area. Real talk: salt spray eats regular powder coat for breakfast.",
    "Near the sea? We use epoxy + 2-coat for coastal gear. Costs R2 more per kg but survives 8+ years.",
    "Salt air is brutal. But 36 years in Cape Town — we know the salt game. Epoxy coat sorts it."
  ],
  
  colour_standard: [
    "Classic choice. Black never goes out of style. Quick turnaround too.",
    "Clean look. White shows the quality — and ours is sharp.",
    "Standard colour — we do these in our sleep. Fast, clean, proper."
  ],
  
  colour_premium: [
    "Ooh, fancy! That gives a modern look. Costs a bit more but worth it.",
    "Good taste. That's our premium range — deeper colour, tougher finish.",
    "Now you're talking. That colour pops differently in sunlight. You'll love it."
  ],
  
  quote_delivery: [
    "There you go. Same as last time or you going bigger?",
    "Done. Bring it through, we'll sort you out.",
    "That's the number. COD when you collect, sharp sharp."
  ],
  
  payment: [
    "COD only my bru. Payment before collection. No exceptions since '88.",
    "We release when payment clears. Old school, but it works.",
    "Pay on collection. We don't do credit — keeps things simple."
  ],
  
  tyres: [
    "Customer MUST remove tyres. We don't touch them. Bring rims only.",
    "Tyres off before you come. We coat rims, not rubber. ??"
  ],
  
  blasting: [
    "We blast at 6 bar through a 10mm nozzle. Grit/slag medium. Aggressive — but that's the point.",
    "Blasting strips everything — rust, old paint, bad decisions. R8-R12/kg."
  ],
  
  appreciation: [
    "Pleasure! Tell your mates about Solomon — 36 years and counting. ??",
    "Dankie! That's a compliment to Ridhor AND me. Word of mouth keeps us going.",
    "Lekker, glad I could help! Now go tell someone about the oom who knows coating. ??",
    "Only a pleasure. We've been at this since '88 — we love what we do."
  ],
  
  goodbye: [
    "Cheers! Sien jou later. Bring that item through when you're ready.",
    "Sharp! We're here when you need us. Blackheath, 8am-4:45pm.",
    "Lekker chatting. Go well, and remember — coating makes us stronger. ??"
  ],
  
  fallback: [
    "Ag, that's not my lane. I'm a coating oom, not Google! ?? Type *help* for what I CAN do.",
    "Sorry my bru, I don't know that one. Pricing, colours, quotes, coating — that's me.",
    "That's above my pay grade! ?? I handle coating questions. For anything else, WhatsApp Ridhor on 076 760 4350.",
    "Nee man, I just know coating. Since '88. Ask me about gates, rims, blasting — I'm your oom."
  ],
  
  ai_question: [
    "AI? Nee, I'm just Ridhor's cousin who never sleeps. Since '88 we've coated thousands of gates, I learned a thing or two.",
    "Bot? Me? No no, I work in the booth. Just helping out on WhatsApp when it's quiet. ??",
    "I'm not AI, I'm Oom Solly. Ridhor's family. Been coating since before smartphones existed."
  ],
  
  return_customer: [
    "Welcome back! Still coating things? Good. What's the job this time?",
    "Aweh, you're back! Last time was a good job. What you got now?",
    "The coating addict returns! ?? What we doing this time?"
  ]
};

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
    "Nice. How's it looking — clean, bit of rust, or full rust bucket?"
  ],
  asked_condition: [
    "Cool. Rough weight? If you're not sure, just guess — medium gate is usually 15-25kg.",
    "Weight estimate? Don't stress — ballpark is fine. 10kg? 20kg? 50kg?",
    "How heavy we talking? Just a rough number works."
  ],
  asked_weight: [
    "And colour? Black, white, charcoal, or something wild?",
    "What colour you thinking? Standard (black/white) or premium (charcoal, metallic, RAL)?",
    "Colour time! Black/white = best price. Charcoal/metallic = premium look."
  ]
};

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getTimeOfDay() {
  var hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getPersona(category, subcategory) {
  if (subcategory && PERSONA[category] && PERSONA[category][subcategory]) {
    return pick(PERSONA[category][subcategory]);
  }
  if (PERSONA[category]) {
    var options = PERSONA[category];
    if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
      return pick(options);
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

function detectMood(text) {
  var t = text.toLowerCase();
  if (t.includes('angry') || t.includes('furious') || t.includes('ridiculous') || t.includes('terrible') || t.includes('useless') || t.includes('rubbish') || t.includes('worst') || t.includes('pathetic')) return 'angry';
  if (t.includes('tired') || t.includes('exhausted') || t.includes('late') || t.includes('midnight') || t.includes('cant sleep')) return 'tired';
  if (t.includes('lol') || t.includes('haha') || t.includes('funny') || t.includes('joke') || t.includes('??') || t.includes('??')) return 'joking';
  return 'neutral';
}

function isGreeting(text) {
  var t = text.toLowerCase().trim();
  return t === 'hi' || t === 'hello' || t === 'hey' || t === 'howzit' || t === 'good morning' || t === 'sup' || t === 'yo' || t === 'good afternoon' || t === 'good evening' || t === 'aweh';
}

function isAppreciation(text) {
  var t = text.toLowerCase();
  return t.includes('thanks') || t.includes('thank you') || t.includes('dankie') || t.includes('shot') || t.includes('awesome') || t.includes('great') || t.includes('perfect') || t.includes('legend') || t.includes('amazing') || t.includes('brilliant') || t.includes('love it');
}

function isGoodbye(text) {
  var t = text.toLowerCase().trim();
  return t === 'bye' || t === 'cheers' || t === 'later' || t === 'cool' || t === 'ok' || t === 'okay' || t === 'sharp';
}

function isAIQuestion(text) {
  var t = text.toLowerCase();
  return (t.includes('are you') || t.includes('you a')) && (t.includes('ai') || t.includes('bot') || t.includes('robot') || t.includes('real') || t.includes('human') || t.includes('person'));
}

function detectAfrikaans(text) {
  var afrWords = ["dankie","asseblief","goeie","more","middag","aand","hoe","gaan","dit","baie","lekker","ja","nee","mooi","wat","waar","wanneer","hoeveel","kan","ek","jy","ons","hulle","nie","wel","weer","nog","net","nou","dan","ook","hier","daar","so","as","vir","met","van","die","het","sal","gaan","kom","doen","maak","weet","dink","se","praat","aweh","howzit","bra","bru","sharp"];
  var count = 0;
  var words = text.toLowerCase().split(/\s+/);
  for (var i = 0; i < words.length; i++) {
    if (afrWords.indexOf(words[i]) !== -1) count++;
  }
  return count >= 2;
}

function isReturningCustomer(session) {
  return session && session.history && session.history.length > 3;
}

module.exports = {
  PERSONA,
  FLOW,
  NEXT_QUESTIONS,
  pick,
  getTimeOfDay,
  getPersona,
  detectProduct,
  detectCondition,
  detectMood,
  isGreeting,
  isAppreciation,
  isGoodbye,
  isAIQuestion,
  detectAfrikaans,
  isReturningCustomer
};
