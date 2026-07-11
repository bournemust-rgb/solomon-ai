// ============================================
// SOLOMON COATINGS - DELIVERY ENGINE
// Static distance table for Cape Town areas
// ============================================

// Distances from Blackheath workshop in km
const DISTANCES = {
  // Cape Town CBD & Surrounds
  "cape town": 30, "cbd": 30, "city centre": 30, "waterfront": 33, "sea point": 35,
  "green point": 34, "camps bay": 40, "clifton": 40, "table view": 25, "blouberg": 25,
  "milnerton": 22, "century city": 20, "paarden island": 24,
  
  // Northern Suburbs
  "bellville": 5, "parow": 8, "goodwood": 12, "vasco": 10, "elsies river": 8,
  "ravensmead": 8, "bishop lavis": 12, "delft": 10, "blue downs": 12,
  "kuils river": 6, "Blackheath": 0, "kraaifontein": 5, "durbanville": 10,
  "fisantekraal": 12, "klipheuwel": 15, "philadelphia": 18,
  
  // Southern Suburbs
  "rondebosch": 28, "claremont": 30, "kenilworth": 30, "wynberg": 32,
  "constantia": 35, "tokai": 36, "retreat": 35, "grassy park": 34,
  "muizenberg": 40, "fish hoek": 45, "simons town": 50, "noordhoek": 48,
  
  // Atlantic Seaboard
  "hout bay": 42, "llandudno": 44, "bantry bay": 36,
  
  // Winelands
  "stellenbosch": 25, "franschhoek": 45, "paarl": 30, "wellington": 35,
  "malmesbury": 40, "worcester": 80, "hermanus": 100,
  
  // West Coast
  "melkbosstrand": 30, "atlantis": 35, "mamre": 38, "yzerfontein": 70,
  "langebaan": 110, "saldanha": 120,
  
  // Helderberg
  "somerset west": 30, "strand": 32, "gordons bay": 38, "macassar": 28,
  "epping": 18, "philippi": 25, "mitchells plain": 28, "khayelitsha": 30,
  "athlone": 22, "gugulethu": 24, "langa": 20, "nyanga": 24, "crossroads": 26
};

// Delivery rates
const BAKKIE_RATE = 19; // R19 per km for items under 1 ton and under 3m
const TRUCK_RATE = 23; // R23 per km for items over 1 ton or over 3m but under 6m
const SURCHARGE = 0.13; // 13% surcharge on total

function findDistance(location) {
  var loc = location.toLowerCase().trim();
  // Exact match
  if (DISTANCES[loc]) return DISTANCES[loc];
  // Partial match
  for (var key in DISTANCES) {
    if (loc.includes(key) || key.includes(loc)) return DISTANCES[key];
  }
  return null;
}

function calculateDelivery(km, isLarge) {
  var rate = isLarge ? TRUCK_RATE : BAKKIE_RATE;
  var baseCost = km * rate;
  var surcharge = Math.round(baseCost * SURCHARGE);
  var total = baseCost + surcharge;
  return {
    km: km,
    rate: rate,
    vehicle: isLarge ? "Truck (R23/km)" : "Bakkie (R19/km)",
    baseCost: baseCost,
    surcharge: surcharge,
    total: total
  };
}

function getNearbyAreas() {
  var areas = [];
  for (var key in DISTANCES) {
    if (DISTANCES[key] <= 15) areas.push(key);
  }
  return areas.slice(0, 10);
}

module.exports = { DISTANCES, BAKKIE_RATE, TRUCK_RATE, SURCHARGE, findDistance, calculateDelivery, getNearbyAreas };
