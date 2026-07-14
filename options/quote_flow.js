// ============================================
// QUOTE FLOW - Handles all 3 categories step-by-step
// Called from bot-core.js handleMessage
// ============================================

function getOrderRef() {
  var d = new Date();
  return "SC" + d.getFullYear().toString().slice(-2) + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2) + "-" + Math.floor(Math.random() * 9000 + 1000);
}

var VAT = 0.15;

// Detect which category the customer is asking about
function detectCategory(text) {
  var t = text.toLowerCase();
  
  // Category 3: Auto Parts
  if (/rim|wheel|mag|tappet|intercooler|bumper|mouse bar|styling bar|nudge bar|bull bar/i.test(t)) return "auto";
  
  // Category 2: Sheet Metal
  if (/sheet metal|sheetmetal|sheet|sqm|mesh|plate|panel/i.test(t)) return "sheet";
  
  // Category 1: Security & Fencing
  if (/gate|fence|fencing|clear view|sliding|balustrade|palisade|spike|burglar|railing|security/i.test(t)) return "security";
  
  return null;
}

// Start the quote flow based on category
async function startQuoteFlow(category, from, session, saveSession) {
  var flow = session.flow || { state: "idle" };
  
  if (category === "sheet") {
    flow = { state: "sheet_colour", category: "sheet" };
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - sheet metal. What colour?\n\nReply: BLACK/WHITE (R175-R250/sqm) or PREMIUM colour (charcoal, metallic, green, yellow, red, blue, etc. R251-R350/sqm)";
  }
  
  if (category === "security") {
    flow = { state: "security_weight", category: "security" };
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - security/fencing. What is the weight?\n\nReply with the estimated weight in kg (e.g. 20kg or just 20)";
  }
  
  if (category === "auto") {
    // Auto parts are flat rate - handle immediately
    return handleAutoPart(text);
  }
  
  return null;
}

// Handle auto parts immediately (no flow needed)
function handleAutoPart(text) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  
  if (/tappet/i.test(t)) {
    var v = Math.round(350 * VAT);
    return "TAPPET COVER ESTIMATE - Ref: " + ref + "\n\nPrice: R350 excl VAT\nVAT (15%): R" + v.toLocaleString() + "\nTOTAL: R" + (350 + v).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }
  if (/intercooler/i.test(t)) {
    var v = Math.round(550 * VAT);
    return "INTERCOOLER ESTIMATE - Ref: " + ref + "\n\nPrice: R550 excl VAT\nVAT (15%): R" + v.toLocaleString() + "\nTOTAL: R" + (550 + v).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }
  if (/bumper|mouse bar|styling bar|nudge bar|bull bar/i.test(t)) {
    var v = Math.round(650 * VAT);
    return "AUTO BAR/BUMPER ESTIMATE - Ref: " + ref + "\n\nPrice: R650 excl VAT\nVAT (15%): R" + v.toLocaleString() + "\nTOTAL: R" + (650 + v).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }
  if (/rim|wheel|mag/i.test(t)) {
    var qtyMatch = t.match(/(\d+)/);
    var qty = qtyMatch ? parseInt(qtyMatch[1]) : 4;
    var sets = Math.ceil(qty / 4);
    var premium = /charcoal|metallic|bronze|gold|red|blue|green|yellow|orange|purple|silver|colour|color/i.test(t);
    var inchMatch = t.match(/(\d+)\s*(inch|"")/i);
    var inch = inchMatch ? parseInt(inchMatch[1]) : null;
    var low, high, sizeLabel;
    if (inch && inch >= 16) { low = premium ? 1700 : 1500; high = premium ? 2200 : 1800; sizeLabel = inch + " inch (16-18\")"; }
    else { low = premium ? 1300 : 1000; high = premium ? 1700 : 1500; sizeLabel = inch ? inch + " inch (10-15\")" : "10-15\""; }
    var totalLow = low * sets, totalHigh = high * sets;
    var vatLow = Math.round(totalLow * VAT), vatHigh = Math.round(totalHigh * VAT);
    return "RIMS ESTIMATE - Ref: " + ref + "\n\n" + qty + " rims = " + sets + " set(s)\nSize: " + sizeLabel + "\nColour: " + (premium ? "Premium" : "Standard B/W") + "\n\nExcl VAT: R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT: R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nIncl VAT: R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\nCustomer MUST remove tyres.\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }
  return null;
}

// Handle flow states for sheet metal and security/fencing
async function handleQuoteFlowState(flow, text, from, session, saveSession) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  
  // ===== SHEET METAL FLOW =====
  if (flow.state === "sheet_colour") {
    var isBW = /black|white|bw|standard|matt|matte|satin/i.test(t);
    if (!isBW && !/charcoal|metallic|bronze|gold|red|blue|green|yellow|orange|purple|silver|premium|colour|color|custom|ral/i.test(t)) {
      return "Please reply: BLACK/WHITE (R175-R250/sqm) or PREMIUM colour (charcoal, metallic, green, yellow, etc. R251-R350/sqm)";
    }
    flow.sheetPremium = !isBW;
    flow.sheetRateLow = flow.sheetPremium ? 251 : 175;
    flow.sheetRateHigh = flow.sheetPremium ? 350 : 250;
    flow.state = "sheet_width";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - " + (flow.sheetPremium ? "Premium" : "Black/White") + " (R" + flow.sheetRateLow + "-R" + flow.sheetRateHigh + "/sqm).\n\nWhat is the WIDTH in meters? (e.g. 2 or 1.5)";
  }
  
  if (flow.state === "sheet_width") {
    var w = t.match(/(\d+\.?\d*)/);
    if (!w) return "Please give me the width in meters. e.g. 2 or 1.5";
    flow.sheetWidth = parseFloat(w[1]);
    flow.state = "sheet_height";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - " + flow.sheetWidth + "m wide.\n\nWhat is the HEIGHT in meters? (e.g. 1.5)";
  }
  
  if (flow.state === "sheet_height") {
    var h = t.match(/(\d+\.?\d*)/);
    if (!h) return "Please give me the height in meters. e.g. 1.5";
    flow.sheetHeight = parseFloat(h[1]);
    flow.state = "sheet_sides";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - " + flow.sheetHeight + "m high.\n\nDo you need ONE SIDE or BOTH SIDES coated?\nReply: 1 or 2";
  }
  
  if (flow.state === "sheet_sides") {
    var sides = t.match(/(\d+)/);
    var sideCount = sides ? parseInt(sides[1]) : null;
    if (/one|single/i.test(t)) sideCount = 1;
    if (/both|two|double/i.test(t)) sideCount = 2;
    if (!sideCount || (sideCount !== 1 && sideCount !== 2)) return "Please reply: 1 (one side) or 2 (both sides)";
    
    var area = flow.sheetWidth * flow.sheetHeight * sideCount;
    var rateLow = flow.sheetRateLow, rateHigh = flow.sheetRateHigh;
    var totalLow = Math.round(area * rateLow);
    var totalHigh = Math.round(area * rateHigh);
    var vatLow = Math.round(totalLow * VAT);
    var vatHigh = Math.round(totalHigh * VAT);
    var colourLabel = flow.sheetPremium ? "Premium" : "Standard Black/White";
    var sideLabel = sideCount === 1 ? "one side" : "both sides";
    
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\nSize: " + flow.sheetWidth + "m x " + flow.sheetHeight + "m = " + (flow.sheetWidth * flow.sheetHeight) + " sqm per side\nSides: " + sideLabel + "\nTotal area: " + area + " sqm\nColour: " + colourLabel + " (R" + rateLow + "-R" + rateHigh + "/sqm)\n\nExcl VAT: R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nIncl VAT: R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }
  
  // ===== SECURITY/FENCING FLOW =====
  if (flow.state === "security_weight") {
    var kg = t.match(/(\d+)/);
    if (!kg) return "Please give me the estimated weight in kg. e.g. 20 or 50";
    flow.secWeight = parseInt(kg[1]);
    flow.state = "security_colour";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - about " + flow.secWeight + "kg.\n\nWhat colour?\nReply: BLACK/WHITE (R16/kg) or PREMIUM (charcoal, metallic, etc. R17-R20/kg)";
  }
  
  if (flow.state === "security_colour") {
    var isPrem = /charcoal|metallic|bronze|gold|red|blue|green|yellow|orange|purple|silver|premium|colour|color|custom|ral/i.test(t);
    var isBW = /black|white|bw|standard/i.test(t);
    if (!isPrem && !isBW) return "Please reply: BLACK/WHITE (R16/kg) or PREMIUM colour (R17-R20/kg)";
    
    var rateLow = isPrem ? 17 : 16;
    var rateHigh = isPrem ? 20 : 16;
    var weight = flow.secWeight;
    var totalLow = weight * rateLow;
    var totalHigh = weight * rateHigh;
    var vatLow = Math.round(totalLow * VAT);
    var vatHigh = Math.round(totalHigh * VAT);
    
    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);
    
    return "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\n\nWeight: " + weight + " kg\nColour: " + (isPrem ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nTOTAL (incl VAT): R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }
  
  return null;
}

module.exports = { detectCategory, startQuoteFlow, handleQuoteFlowState, handleAutoPart };

