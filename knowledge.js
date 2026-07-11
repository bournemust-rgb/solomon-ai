// ============================================
// SOLOMON COATINGS — MASTER DATA FILE
// Real pricing, terms, and conditions.
// ============================================

const KNOWLEDGE = {
  business: {
    name: "Solomon Coatings",
    established: 1988,
    owner: "Ridhor Hendricks",
    phone: "+27 60 507 4461",
    personal: "076 760 4350",
    email: "rshift21@yahoo.com",
    hours: "Monday to Friday, 08:00 - 17:00. Saturday by appointment only.",
    address: "Cape Town, South Africa",
    deliveryAreas: ["Cape Town CBD", "Northern Suburbs", "Southern Suburbs", "Atlantic Seaboard", "Helderberg Basin", "Winelands"],
    deliveryFee: "R150 flat fee within Cape Town metro. Free collection from workshop.",
    vat: "15%",
    paymentTerms: "COD only. Payment must be made before items leave the premises. No credit."
  },

  services: ["Powder Coating", "Sandblasting", "Shot Blasting", "Chemical Pre-treatment", "Colour Matching (RAL codes)"],

  pricing: {
    rims: {
      label: "Rims - Set of 4 (10-15 inch)",
      range: "R1,000 – R1,500 per set",
      details: "Price excludes VAT. Depends on colour choice and prep work needed. Customer MUST remove tyres before bringing rims in. We do NOT remove tyres.",
      factors: "Colour, amount of stripping/prep needed, condition of rims."
    },
    sheetMetal: {
      label: "Sheet metal / mesh panels (per sqm)",
      blackWhite: "R175 – R250 per sqm",
      metallicColours: "R251 – R350 per sqm",
      details: "Black and white are cheapest. Metallic colours (bronze, gold, charcoal, etc.) charged at higher rate. Price excludes VAT.",
      factors: "Colour choice, size, condition."
    },
    coatingPerKg: {
      label: "Coating per kg",
      range: "R15 – R23 per kg",
      details: "For items charged by weight. Price excludes VAT.",
      factors: "Item type, colour, condition."
    },
    blasting: {
      label: "Sandblasting / Shot blasting for rusted items",
      range: "R8 – R12 per kg",
      details: "For rusted items needing blasting before coating. Price depends on severity of rust. Price excludes VAT.",
      factors: "How badly rusted, material type."
    },
    shotBlastingTruck: {
      label: "Shot blasting - Flatbed truck (5m)",
      range: "R5,000 – R7,500",
      details: "For a 5m flatbed truck. Price excludes VAT. Only if NO rubber needs to be blasted off.",
      factors: "Condition, presence of rubber."
    },
    oversized: {
      label: "Oversized items surcharge",
      amount: "+R1,000",
      details: "Applied if items are longer than 3m or don't fit properly in our booth or oven. Excludes VAT."
    },
    minimumJob: {
      label: "Minimum job charge",
      amount: "R200",
      details: "Includes VAT. Smallest job we take on."
    }
  },

  importantRules: [
    "ALL prices quoted are ESTIMATES and subject to change upon physical inspection.",
    "If the customer provides incorrect information (weight, condition, blasting requirements), the price WILL be re-quoted when items arrive.",
    "If a customer says no blasting is needed but the item arrives needing pre-treatment or blasting, a new quote will be given.",
    "The cost estimator (Ridhor) has the right to adjust pricing within reason if information was insufficient at time of costing.",
    "Customer MUST remove tyres from rims before bringing them in. We do NOT remove tyres."
  ],

  turnaround: {
    lessThanTon: "3 working days per ton of work (for jobs under 1 ton)",
    moreThanTon: "5-8 working days (for jobs over 1 ton)",
    note: "Turnaround times are estimates. We confirm when items are dropped off."
  },

  colours: {
    standard: ["Gloss Black", "Matte Black", "Satin Black", "Gloss White", "Matte White"],
    metallic: ["Silver Metallic", "Grey", "Charcoal", "Bronze", "Gold", "Red", "Royal Blue", "Navy Blue", "Yellow", "Green"],
    textures: ["Gloss", "Matte", "Satin", "Wrinkle Finish", "Hammertone", "Sand Texture"],
    special: "We match any RAL colour code. Custom colours available.",
    cheapest: "Black and White are the cheapest colours (R175-R250/sqm)."
  },

  process: {
    steps: [
      "1. Inspection and assessment",
      "2. Stripping / sandblasting (if needed)",
      "3. Chemical pre-treatment",
      "4. Powder application",
      "5. Curing in oven",
      "6. Quality check",
      "7. Payment (COD) before collection"
    ]
  },

  limitations: [
    "We do NOT do wet paint spraying",
    "We do NOT do anodizing",
    "We do NOT do galvanizing (hot-dip zinc)",
    "We CAN powder coat OVER galvanized steel",
    "We CAN strip and recoat previously powder coated items",
    "Maximum item size: approximately 6m x 2m x 2m",
    "Items over 3m incur a R1,000 surcharge",
    "We only coat METAL — no plastic, wood, or fibreglass",
    "We do NOT remove tyres from rims — customer must do this",
    "No rubber items can be blasted"
  ],

  faq: [
    { q: "Do you remove tyres from rims?", a: "No. Customer MUST remove tyres before bringing rims in. We only coat the rims." },
    { q: "How do I pay?", a: "COD only. Payment must be made before items leave the premises. No credit." },
    { q: "Is VAT included in the price?", a: "All prices quoted exclude 15% VAT unless stated otherwise." },
    { q: "Can the price change after I get a quote?", a: "Yes. All quotes are estimates. If the item condition differs from what was described, we will re-quote on physical inspection." },
    { q: "Do you blast rubber items?", a: "No. We do not blast items with rubber. Rubber must be removed first." },
    { q: "How long does powder coating last?", a: "15-20 years outdoors, 30+ indoors. Tougher than wet paint." },
    { q: "Do you offer warranties?", a: "We stand by our workmanship. Issues from our process — bring it back." },
    { q: "Do you do callouts or onsite work?", a: "All work done at our workshop. You bring items to us or arrange transport." },
    { q: "What's the biggest item you can coat?", a: "Approximately 6m x 2m x 2m. Items over 3m incur a R1,000 surcharge." },
    { q: "How long does it take?", a: "3 working days per ton for jobs under 1 ton. 5-8 working days for jobs over 1 ton." }
  ]
};

function getPricing(category) {
  var item = KNOWLEDGE.pricing[category];
  if (!item) return { found: false, message: "No standard price for that. Bring it in and Ridhor will quote you properly." };
  return { found: true, category: item.label, range: item.range || item.amount, details: item.details || "", factors: item.factors || "" };
}

function getColours(type) {
  type = type || "all";
  if (type === "standard") return { colours: KNOWLEDGE.colours.standard, cheapest: KNOWLEDGE.colours.cheapest };
  if (type === "metallic") return { colours: KNOWLEDGE.colours.metallic };
  return KNOWLEDGE.colours;
}

function getTurnaround(jobType) {
  jobType = jobType || "unknown";
  if (jobType === "small") return { estimate: KNOWLEDGE.turnaround.lessThanTon };
  if (jobType === "large") return { estimate: KNOWLEDGE.turnaround.moreThanTon };
  return KNOWLEDGE.turnaround;
}

function getFAQ(topic) {
  var match = KNOWLEDGE.faq.find(function(f) {
    return f.q.toLowerCase().includes((topic || "").toLowerCase()) || f.a.toLowerCase().includes((topic || "").toLowerCase());
  });
  return match ? { found: true, question: match.q, answer: match.a } : { found: false, message: "Good question. Want Ridhor to call you?" };
}

function getBusinessInfo() { return KNOWLEDGE.business; }
function getLimitations() { return KNOWLEDGE.limitations; }
function getProcess() { return KNOWLEDGE.process; }
function getImportantRules() { return KNOWLEDGE.importantRules; }

module.exports = { KNOWLEDGE, getPricing, getColours, getTurnaround, getFAQ, getBusinessInfo, getLimitations, getProcess, getImportantRules };
