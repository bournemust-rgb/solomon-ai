// Patch script: add min charge to security/fencing flow
var fs = require("fs");
var content = fs.readFileSync("options/quote_flow.js", "utf8");

var oldBlock = '    var rateLow = isPrem ? 17 : 16;\n    var rateHigh = isPrem ? 20 : 16;\n    var weight = flow.secWeight;\n    var totalLow = weight * rateLow;\n    var totalHigh = weight * rateHigh;\n    var vatLow = Math.round(totalLow * VAT);\n    var vatHigh = Math.round(totalHigh * VAT);\n\n    flow = { state: "idle" };\n    session.flow = flow;\n    await saveSession(from, session);\n\n    return "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\n\nWeight: " + weight + " kg\nColour: " + (isPrem ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nTOTAL (incl VAT): R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";';

var newBlock = '    var rateLow = isPrem ? 17 : 16;\n    var rateHigh = isPrem ? 20 : 16;\n    var weight = flow.secWeight;\n    var rawLow = weight * rateLow;\n    var rawHigh = weight * rateHigh;\n    var minCharge = isPrem ? 250 : 200;\n    var totalLow = rawLow < minCharge ? minCharge : rawLow;\n    var totalHigh = rawHigh < minCharge ? minCharge : rawHigh;\n    var minApplied = rawLow < minCharge;\n    var vatLow = Math.round(totalLow * VAT);\n    var vatHigh = Math.round(totalHigh * VAT);\n\n    flow = { state: "idle" };\n    session.flow = flow;\n    await saveSession(from, session);\n\n    return "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\n\nWeight: " + weight + " kg\nColour: " + (isPrem ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + (minApplied ? "\n\n📌 Minimum charge applied: R" + minCharge.toLocaleString() + " excl VAT" : "") + "\n\nCoating (blasting included): R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nTOTAL (incl VAT): R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";';

if (content.indexOf(oldBlock) !== -1) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync("options/quote_flow.js", content);
  console.log("PATCHED - min charge added");
} else {
  console.log("OLD BLOCK NOT FOUND - checking for partial match...");
  if (content.indexOf("totalLow = weight * rateLow") !== -1) {
    console.log("Found totalLow line, but full block mismatch");
  }
}
