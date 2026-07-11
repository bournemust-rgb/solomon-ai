// ============================================
// SOLOMON COATINGS - DELIVERY ENGINE v2.0
// Hidden rates, minimum charges enforced
// ============================================

const DISTANCES = {
  "cape town": 30, "cbd": 30, "city centre": 30, "waterfront": 33, "sea point": 35,
  "green point": 34, "camps bay": 40, "clifton": 40, "table view": 25, "blouberg": 25,
  "milnerton": 22, "century city": 20, "paarden island": 24,
  "bellville": 5, "parow": 8, "goodwood": 12, "vasco": 10, "elsies river": 8,
  "ravensmead": 8, "bishop lavis": 12, "delft": 10, "blue downs": 12,
  "kuils river": 6, "blackheath": 0, "kraaifontein": 5, "durbanville": 10,
  "fisantekraal": 12, "klipheuwel": 15, "philadelphia": 18,
  "rondebosch": 28, "claremont": 30, "kenilworth": 30, "wynberg": 32,
  "constantia": 35, "tokai": 36, "retreat": 35, "grassy park": 34,
  "muizenberg": 40, "fish hoek": 45, "simons town": 50, "noordhoek": 48,
  "hout bay": 42, "llandudno": 44, "bantry bay": 36,
  "stellenbosch": 25, "franschhoek": 45, "paarl": 30, "wellington": 35,
  "malmesbury": 40, "worcester": 80, "hermanus": 100,
  "melkbosstrand": 30, "atlantis": 35, "mamre": 38, "yzerfontein": 70,
  "langebaan": 110, "saldanha": 120,
  "somerset west": 30, "strand": 32, "gordons bay": 38, "macassar": 28,
  "epping": 18, "philippi": 25, "mitchells plain": 28, "khayelitsha": 30,
  "athlone": 22, "gugulethu": 24, "langa": 20, "nyanga": 24, "crossroads": 26
};

const BAKKIE_RATE = 19;
const TRUCK_RATE = 23;
const SURCHARGE = 0.13;
const BAKKIE_MINIMUM = 400;
const TRUCK_MINIMUM = 700;

function findDistance(location) {
  var loc = location.toLowerCase().trim();
  if (DISTANCES[loc]) return DISTANCES[loc];
  for (var key in DISTANCES) {
    if (loc.indexOf(key) !== -1 || key.indexOf(loc) !== -1) return DISTANCES[key];
  }
  return null;
}

function calculateDelivery(km, isLarge) {
  var rate = isLarge ? TRUCK_RATE : BAKKIE_RATE;
  var minimum = isLarge ? TRUCK_MINIMUM : BAKKIE_MINIMUM;
  var vehicleName = isLarge ? "truck" : "bakkie";
  
  var baseCost = km * rate;
  var surcharge = Math.round(baseCost * SURCHARGE);
  var calculatedTotal = baseCost + surcharge;
  
  // Apply minimum charge
  var finalTotal = Math.max(calculatedTotal, minimum);
  var wasAdjusted = finalTotal !== calculatedTotal;
  
  return {
    km: km,
    vehicle: vehicleName,
    calculatedTotal: calculatedTotal,
    minimum: minimum,
    finalTotal: finalTotal,
    wasAdjusted: wasAdjusted
  };
}

function formatDeliveryResponse(calc, location) {
  var msg = "DELIVERY ESTIMATE\n\n";
  msg += "From: Blackheath\n";
  msg += "To: " + location + " (" + calc.km + "km)\n";
  msg += "Vehicle: " + calc.vehicle + "\n\n";
  msg += "Delivery cost: R" + calc.finalTotal.toLocaleString() + "\n\n";
  if (calc.wasAdjusted) {
    msg += "Minimum delivery charge applied.\n\n";
  }
  msg += "Delivery usually takes 2-3 working days.\n\n";
  msg += "This is an ESTIMATE ONLY. Contact Ridhor on 076 760 4350 for an exact delivery quote and to arrange.";
  return msg;
}

function getNearbyAreas() {
  var areas = [];
  for (var key in DISTANCES) {
    if (DISTANCES[key] <= 15) areas.push(key);
  }
  return areas.slice(0, 10);
}

module.exports = { DISTANCES, findDistance, calculateDelivery, formatDeliveryResponse, getNearbyAreas };
