// ============================================
// SOLOMON COATINGS - TERMS & CONDITIONS DATABASE
// Bot searches this when customers ask T&C questions
// Returns exact wording from the official document
// ============================================

var TCDB = [
  {
    keywords: ["wetspray", "wet spray", "wet paint", "spray painting"],
    reply: "WETSPRAY & CUSTOM BLASTING\n\nWetspray jobs and custom shotblasting must be quoted directly by Ridhor. These are not standard powder coating jobs and require assessment.\n\nContact Ridhor:\nWhatsApp: 076 760 4350\nEmail: infosc@mweb.co.za\n\nAll wetspray work is subject to our full Terms & Conditions."
  },
  {
    keywords: ["maintenance", "clean", "care", "look after", "last longer", "durability", "how long does it last"],
    reply: "MAINTENANCE & LONGEVITY\n\nCoating longevity depends on regular maintenance. The Client must maintain items according to environmental conditions. Maintenance includes:\n\n- Drying\n- Wiping\n- Cleaning\n- Rinsing\n- Protective treatments\n\nMaintenance records must be kept. The Company may advise but is not liable for failure to maintain.\n\nOutdoor items should ideally be stainless steel, aluminium, or galvanised for maximum lifespan."
  },
  {
    keywords: ["decorative", "anti-corrosive", "rust proof", "rustproof", "protection", "anti rust"],
    reply: "POWDER COATING IS DECORATIVE\n\nPowder coating is a decorative finish, not an anti-corrosive treatment. It provides excellent protection but does not guarantee rust prevention, especially in harsh environments.\n\nFor coastal areas or high-corrosion environments, we recommend:\n- Stainless steel\n- Aluminium\n- Galvanised steel\n\nNo warranties apply to items installed in coastal or sea-facing environments (within 15km of shoreline)."
  },
  {
    keywords: ["guarantee", "warranty", "guaranteed", "come back", "peeling", "chipping", "flake"],
    reply: "WARRANTY & GUARANTEES\n\nNo guarantees are provided on second-hand or previously coated items.\n\nNo warranties apply to items installed in coastal or sea-facing environments (within 15km of shoreline).\n\nSuppliers do not guarantee corrosion resistance in high-salinity zones.\n\nIf there is a coating failure due to our process, bring it back and we will assess. We stand by our workmanship."
  },
  {
    keywords: ["defect", "latent", "hidden", "crack", "warp", "distort", "heat damage", "discover", "reveal"],
    reply: "LATENT DEFECTS & LIABILITY\n\nThe Company is not liable for latent defects or concealed weaknesses discovered during work. This includes:\n\n- Cracked welds\n- Corrosion\n- Delamination\n- Compromised substrates\n- Warping or heat distortion\n\nItems unable to withstand temperatures above 200C must be declared before work begins.\n\nAll blasting, coating, and related services are undertaken strictly at the Client's own risk."
  },
  {
    keywords: ["blast", "sandblast", "shotblast", "blasting risk", "blasting damage"],
    reply: "SHOTBLASTING LIABILITY\n\nShotblasting of all items is undertaken strictly at the Client's own risk. This applies to all substrates including wood, granite, marble, cast aluminium, garden furniture, and any other material submitted for abrasive cleaning.\n\nBlasting is an abrasive process and may expose or worsen underlying defects. Defects such as cracking, chipping, pitting, delamination, corrosion, or structural weaknesses may only become visible once blasting has taken place.\n\nBy accepting our quotation, the Client agrees that all risk associated with shotblasting rests solely with them."
  },
  {
    keywords: ["prepare", "prep", "before blast", "plastic", "glass", "hydraulic", "tank", "remove"],
    reply: "PRE-BLASTING REQUIREMENTS\n\nBefore bringing items for blasting, the Customer must:\n\n- Remove plastic, brittle, or malleable components\n- Disconnect hydraulics\n- Empty tanks or declare contents\n- Remove glass, lights, and windows where possible\n\nNo liability for breakage as we cannot be held responsible.\n\nBlasting medium: Grit/slag 0.12mm-0.4mm\nBlasting pressure: 6 bar through 10mm nozzle at approximately 152 m/s"
  },
  {
    keywords: ["coastal", "sea", "beach", "salt", "shore", "marine", "ocean"],
    reply: "COASTAL INSTALLATIONS - NO WARRANTY\n\nNo warranties apply to items installed in coastal or sea-facing environments.\n\nSuppliers do not guarantee corrosion resistance in high-salinity zones. Installations within 15km of the shoreline are particularly vulnerable.\n\nAll coastal work is done at the Client's risk.\n\nFor coastal areas, we recommend epoxy + 2-coat system (R2 more per kg) which survives 8+ years in salt air conditions."
  },
  {
    keywords: ["collect", "storage", "uncollected", "pickup", "late", "ready when"],
    reply: "COLLECTION & STORAGE\n\nItems must be collected within 7 working days of completion.\n\nLate collection incurs a 7% daily storage surcharge.\n\nDamage occurring during storage will require recoating fees.\n\nLarge items incur a minimum setup fee of R1000 (excl VAT).\n\nUncollected items may be sold to recover costs if payment cannot be made."
  },
  {
    keywords: ["pay", "payment", "cod", "release", "eft", "bank", "deposit", "upfront"],
    reply: "CASH ON DELIVERY (COD) POLICY\n\nNo work will be released without full payment - no exceptions.\n\nPayment must reflect before collection.\n\nCustom materials must be paid upfront.\n\nAll work remains the property of Solomon Coatings until paid for in full.\n\nShould the Client fail to make payment, Solomon Coatings reserves the right to retain, withhold, or resell the items to recover all outstanding costs."
  },
  {
    keywords: ["intellectual", "ip", "ownership", "design", "copy", "colour formula", "process", "method"],
    reply: "INTELLECTUAL PROPERTY\n\nAll processes, methods, documentation, technical procedures, colour formulations, and specialised finishes developed or used by Solomon Coatings remain the exclusive intellectual property of the Company.\n\nThese may not be copied, reproduced, reverse-engineered, or distributed without written consent.\n\nCustom designs, colour mixes, surface treatments, or specialised coatings created for a Client remain proprietary to Solomon Coatings. Intellectual property rights do not transfer to the Client unless expressly agreed to in writing."
  },
  {
    keywords: ["photo", "social media", "facebook", "publish", "post", "permission", "popia"],
    reply: "SOCIAL MEDIA CONSENT\n\nBy accepting our quotation, the Client grants Solomon Coatings permission to photograph and publish images of their items on our social media platforms and marketing channels.\n\nNo personal information, identifying details, or private data will be disclosed, in full compliance with the POPIA Act.\n\nIf you prefer we do not publish photos of your items, please let Ridhor know."
  },
  {
    keywords: ["colour match", "batch", "variation", "shade", "different", "exact", "same as"],
    reply: "COLOUR VARIATIONS\n\nColours may vary by batch every 4-6 months.\n\nStandard colours: 2-ton batches\nSpecials: 500kg\nCustoms: 100kg\n\nDecorative finishes may differ from digital references.\n\nWe match RAL codes as close as possible but exact colour matching across batches cannot be guaranteed."
  },
  {
    keywords: ["quote", "estimate", "subject", "change", "revised", "amended"],
    reply: "QUOTATIONS & ESTIMATES\n\nAll quotations are based on information provided at the time of issue and may be amended if specifications, quantities, or conditions change.\n\nQuotations include labour and materials unless otherwise stated, and exclude VAT, site work, errors and omissions, and any reblasting required after final sign-off.\n\nAcceptance of a quotation or submission of items constitutes full agreement to these Terms.\n\nRevised pricing will be communicated in writing before continuation."
  },
  {
    keywords: ["loadshedding", "delay", "power", "weather", "timeline", "late", "how long"],
    reply: "TIMELINES & DELAYS\n\nTimelines may be affected by loadshedding or weather conditions.\n\nStandard turnaround: Under 1 ton = 3 working days. Over 1 ton = 5-8 working days.\n\nWe will keep you updated if there are delays.\n\nThe Company is not liable for delays caused by factors outside our control."
  },
  {
    keywords: ["primer", "top coat", "etch", "paint", "high heat", "temperature"],
    reply: "PRIMER & SPECIALISED PAINTS\n\nIf primed: Customer must top-coat within 12-24 hours.\n\nEtch primers: 15-40um DFT.\n\nWe can apply on request:\n- High-heat paints (700-900C)\n- MIO (Micaceous Iron Oxide)\n- Polyurethane\n- DTM (Direct to Metal)\n\nClient-supplied spec sheets preferred. Installation environment must be known."
  },
  {
    keywords: ["outdoor", "outside", "garden", "weather", "sun", "uv"],
    reply: "OUTDOOR INSTALLATIONS\n\nOutdoor items should be stainless steel, aluminium, or galvanised for maximum lifespan.\n\nPowder coating is decorative, not anti-corrosive.\n\nBrush/roller marks may appear in corners of spray painted work.\n\nDFT (Dry Film Thickness) may vary.\n\nProtect items from harsh exposure for best longevity."
  },
  {
    keywords: ["tyre", "tire", "rim", "wheel", "remove"],
    reply: "RIMS - TYRE REMOVAL\n\nCustomer MUST remove tyres from rims before bringing them in. We do NOT remove tyres.\n\nWe only coat the rims.\n\nRim pricing: R1,000-R1,500 per set of 4 (10-15 inch). Black/white standard, metallic colours extra."
  }
];

function searchTCDB(text) {
  var t = text.toLowerCase();
  var best = null;
  var bestScore = 0;
  
  for (var i = 0; i < TCDB.length; i++) {
    var score = 0;
    for (var j = 0; j < TCDB[i].keywords.length; j++) {
      if (t.indexOf(TCDB[i].keywords[j]) !== -1) {
        score += TCDB[i].keywords[j].length; // longer keyword match = more relevant
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = TCDB[i];
    }
  }
  
  return best ? best.reply : null;
}

module.exports = { TCDB, searchTCDB };
