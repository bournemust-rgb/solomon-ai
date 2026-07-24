// ============================================================
// options/quote_flow.js — INSERT THESE 5 LINES where weight parsing fails
// Inside if (flow.state === "security_weight") — ONLY when regex fails
// ============================================================
const { parseQuoteIntent } = require('../services/nvidia');

if (!kg) {
  const ai = await parseQuoteIntent(t);
  if (ai?.weight_kg) {
    flow.secWeight = ai.weight_kg;
    kg = ai.weight_kg;              // so your existing logic continues
    flow.secColour = ai.colour || null;
    flow.secCategory = ai.category || null;
  }
  // If ai returns null, your regex takes over — bot never crashes
}
// calculator.js still handles pricing. NIM NEVER sets prices.
