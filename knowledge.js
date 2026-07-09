const KNOWLEDGE = {
  business: {
    name: "Solomon Coatings",
    established: 1988,
    owner: "Ridhor Hendricks",
    phone: "+27 60 507 4461",
    hours: "Monday to Friday, 08:00 - 17:00. Saturday by appointment only.",
    address: "Cape Town, South Africa",
    deliveryAreas: ["Cape Town CBD", "Northern Suburbs", "Southern Suburbs", "Atlantic Seaboard", "Helderberg Basin", "Winelands"],
    deliveryFee: "R150 flat fee within Cape Town metro. Free collection from workshop."
  },
  services: ["Powder Coating", "Sandblasting", "Chemical Pre-treatment", "Colour Matching (RAL codes)"],
  pricing: {
    rims: { label: "Rims (per rim)", range: "R400 - R600", details: "Steel R400-R450. Alloy R500-R600. Special finishes add R100-R200/rim.", factors: "Size, material, condition, sandblasting needed, finish." },
    smallParts: { label: "Small brackets / parts", range: "R100 - R250", details: "Minimum job charge R250.", factors: "Size, complexity, quantity." },
    gate: { label: "Gates", range: "R1,500 - R3,500", details: "Standard driveway gate.", factors: "Square meterage, rust, design complexity." },
    chassis: { label: "Chassis / large frames", range: "R3,000 - R8,000", details: "Full chassis or trailer frame.", factors: "Size, condition, prep work." },
    sandblastingOnly: { label: "Sandblasting only", range: "R300 - R600/hour", details: "Stripping only, no coating.", factors: "Material, rust level." },
    minimumJob: { label: "Minimum job", amount: "R250", details: "Smallest job we take." }
  },
  colours: {
    standard: ["Gloss Black","Matte Black","Satin Black","Gloss White","Matte White","Silver Metallic","Grey","Charcoal","Red","Royal Blue","Navy Blue","Yellow","Green"],
    textures: ["Gloss","Matte","Satin","Wrinkle Finish","Hammertone","Sand Texture"],
    special: "We match any RAL colour code. Custom colours available.",
    mostPopular: "Gloss Black and Satin Black."
  },
  process: {
    steps: ["1. Inspection","2. Sandblasting","3. Chemical pre-treatment","4. Powder application","5. Curing at 200C","6. Quality check"],
    turnaround: { standard: "3-5 working days", largeJobs: "1-2 weeks", rush: "Available on request (surcharge may apply)." }
  },
  limitations: ["No wet paint","No anodizing","No galvanizing","CAN coat over galvanized steel","Metal only - no plastic/wood/fibreglass","Max size ~6m x 2m x 2m"],
  faq: [
    { q: "Do I need to strip old paint?", a: "No, we sandblast everything. Bring it as-is." },
    { q: "What materials can you coat?", a: "Any metal that handles 200C - steel, aluminium, cast iron, stainless steel." },
    { q: "How long does it last?", a: "15-20 years outdoors, 30+ indoors. Tougher than wet paint." },
    { q: "Do you offer warranties?", a: "We stand by our work. Issues from our process - bring it back." },
    { q: "Can you match a colour?", a: "Yes. Bring a sample or RAL code." },
    { q: "Do you do onsite work?", a: "All work done at our workshop. You bring items to us." }
  ]
};

function getPricing(category) {
  const item = KNOWLEDGE.pricing[category];
  return item ? { found: true, ...item } : { found: false, message: "No standard price. Bring it in for a quote." };
}
function getColours(type) {
  type = type || 'all';
  if (type === 'standard') return { colours: KNOWLEDGE.colours.standard, mostPopular: KNOWLEDGE.colours.mostPopular };
  if (type === 'textures') return { textures: KNOWLEDGE.colours.textures };
  return KNOWLEDGE.colours;
}
function getTurnaround(jobType) {
  jobType = jobType || 'unknown';
  if (jobType === 'small') return { estimate: KNOWLEDGE.process.turnaround.standard };
  if (jobType === 'large') return { estimate: KNOWLEDGE.process.turnaround.largeJobs };
  return KNOWLEDGE.process.turnaround;
}
function getFAQ(topic) {
  const match = KNOWLEDGE.faq.find(function(f) { return f.q.toLowerCase().includes((topic||'').toLowerCase()) || f.a.toLowerCase().includes((topic||'').toLowerCase()); });
  return match ? { found: true, question: match.q, answer: match.a } : { found: false, message: "Good question. Want Ridhor to call you about that?" };
}
function getBusinessInfo() { return KNOWLEDGE.business; }
function getLimitations() { return KNOWLEDGE.limitations; }
function getProcess() { return KNOWLEDGE.process; }

module.exports = { KNOWLEDGE, getPricing, getColours, getTurnaround, getFAQ, getBusinessInfo, getLimitations, getProcess };
