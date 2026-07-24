const fs = require('fs');
let c = fs.readFileSync('options/quote_flow.js', 'utf8');

const oldBlock = `    var rateLow = isPrem ? 17 : 16;
    var rateHigh = isPrem ? 20 : 16;
    var weight = flow.secWeight;
    var totalLow = weight * rateLow;
    var totalHigh = weight * rateHigh;
    var vatLow = Math.round(totalLow * VAT);
    var vatHigh = Math.round(totalHigh * VAT);

    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);

    return "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\\n\\nWeight: " + weight + " kg\\nColour: " + (isPrem ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + "\\n\\nCoating (blasting included): R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\\nTOTAL (incl VAT): R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\\n\\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";`;

const newBlock = `    var rateLow = isPrem ? 17 : 16;
    var rateHigh = isPrem ? 20 : 16;
    var weight = flow.secWeight;
    var rawLow = weight * rateLow;
    var rawHigh = weight * rateHigh;

    // Minimum charge: R200 for B/W, R250 for premium
    var minCharge = isPrem ? 250 : 200;
    var totalLow = rawLow < minCharge ? minCharge : rawLow;
    var totalHigh = rawHigh < minCharge ? minCharge : rawHigh;
    var minApplied = rawLow < minCharge;

    var vatLow = Math.round(totalLow * VAT);
    var vatHigh = Math.round(totalHigh * VAT);

    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);

    return "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\\n\\nWeight: " + weight + " kg\\nColour: " + (isPrem ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + (minApplied ? "\\n\\n📌 Minimum charge applied: R" + minCharge.toLocaleString() + " excl VAT" : "") + "\\n\\nCoating (blasting included): R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\\nTOTAL (incl VAT): R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\\n\\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";`;

c = c.replace(oldBlock, newBlock);
fs.writeFileSync('options/quote_flow.js', c);
console.log('Fixed');
