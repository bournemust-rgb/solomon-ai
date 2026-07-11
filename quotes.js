var funFallbacks = [
  "Ag sorry, I am just a powder coating oom, not Google! Try *menu* to see my Secret List, or WhatsApp Ridhor on 076 760 4350.",
  "Eish, you got me there! I know coating, not that. Type *menu* for what I CAN do, or chat to Ridhor: 076 760 4350.",
  "That one is above my pay grade! I am here for powder coating, colours, and quotes. Type *menu* or WhatsApp Ridhor: 076 760 4350."
];
var affirmations = [
  "Fun fact: A well-coated gate is the silent guardian of your driveway.",
  "Did you know? Powder coating is tougher than your mother-in-law opinions.",
  "Hot tip: Black powder coat absorbs less heat than you think. Science, my bru.",
  "Solomon truth: We have been coating since 88. That is before Google."
];
var TPS_QUOTES = [
  "TPS 1988: Started in a garage with one compressor and a dream.",
  "TPS: Prep is 90% of the job. The coating is the easy part.",
  "TPS: If you can see rust, it is already too late — blast it properly.",
  "TPS: Black never goes out of style, but charcoal hides dust better.",
  "TPS: Coastal air eats cheap coating. Do it once, do it right.",
  "TPS: A clean gate before coating is like a clean plate — everything sticks better.",
  "TPS: We do not cut corners, we coat them.",
  "TPS: 36 years taught me one thing — the customer remembers the finish, not the price.",
  "TPS: Loadshedding cannot stop rust, but it can delay us. We work around it.",
  "TPS: If it can handle 200C, we can coat it. If it melts, we cannot.",
  "TPS: Good blasting is noisy, dusty, and worth every cent.",
  "TPS: The cheapest quote is usually the most expensive redo.",
  "TPS: Satin hides fingerprints. Gloss shows off. Choose your battle.",
  "TPS: Measure twice, blast once, coat once.",
  "TPS: A gate coated in winter lasts longer than excuses in summer.",
  "TPS: We are not the cheapest. We are the ones you call to fix the cheapest.",
  "TPS: RAL codes are suggestions. Real colour is in the oven.",
  "TPS: Since 88, one rule: treat every gate like it is your own driveway."
];
function randomFallback(){ return funFallbacks[Math.floor(Math.random()*funFallbacks.length)]; }
function randomAffirmation(){ return affirmations[Math.floor(Math.random()*affirmations.length)]; }
function randomTPS(){ return "TPS DAILY WISDOM\n\n" + TPS_QUOTES[Math.floor(Math.random()*TPS_QUOTES.length)] + "\n\nType *menu* for more."; }
module.exports = { funFallbacks, affirmations, TPS_QUOTES, randomFallback, randomAffirmation, randomTPS };
