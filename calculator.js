function getOrderRef(){
  var d=new Date();
  return "SC"+d.getFullYear().toString().slice(-2)+("0"+(d.getMonth()+1)).slice(-2)+("0"+d.getDate()).slice(-2)+"-"+Math.floor(Math.random()*9000+1000);
}

function estimatePrice(text, randomAffirmation) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  var vatRate = 0.15;

  // ===== ITEM 3: AUTO PARTS =====
  // Tappet cover
  if (t.includes("tappet")) {
    var vat = Math.round(350 * vatRate);
    return "TAPPET COVER ESTIMATE - Ref: " + ref + "\n\nPrice: R350 excl VAT\nVAT (15%): R" + vat.toLocaleString() + "\nTOTAL (incl VAT): R" + Math.round(350 + vat).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
  }

  // Intercooler
  if (t.includes("intercooler")) {
    var vat = Math.round(550 * vatRate);
    return "INTERCOOLER ESTIMATE - Ref: " + ref + "\n\nPrice: R550 excl VAT\nVAT (15%): R" + vat.toLocaleString() + "\nTOTAL (incl VAT): R" + Math.round(550 + vat).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
  }

  // Bumper, mouse bar, styling bar, nudge bar, bull bar
  if (t.includes("bumper") || t.includes("mouse bar") || t.includes("styling bar") || t.includes("nudge bar") || t.includes("bull bar")) {
    var vat = Math.round(650 * vatRate);
    return "AUTO BAR/BUMPER ESTIMATE - Ref: " + ref + "\n\nPrice: R650 excl VAT\nVAT (15%): R" + vat.toLocaleString() + "\nTOTAL (incl VAT): R" + Math.round(650 + vat).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
  }

  // Rims
  if (t.includes("rim") || t.includes("wheel") || t.includes("mag")) {
    var qtyMatch = t.match(/(\d+)/);
    var qty = qtyMatch ? parseInt(qtyMatch[1]) : 4;
    var sets = Math.ceil(qty / 4);
    var premium = (t.includes("metallic")||t.includes("gold")||t.includes("bronze")||t.includes("charcoal")||t.includes("silver")||t.includes("red")||t.includes("blue")||t.includes("green")||t.includes("colour")||t.includes("color"));
    var inchMatch = t.match(/(\d+)\s*(inch|"")/);
    var inch = inchMatch ? parseInt(inchMatch[1]) : null;
    var low, high, sizeLabel;
    if (inch && inch >= 16) { low = premium ? 1700 : 1500; high = premium ? 2200 : 1800; sizeLabel = inch + " inch (16-18 inch)"; }
    else { low = premium ? 1300 : 1000; high = premium ? 1700 : 1500; sizeLabel = inch ? inch + " inch (10-15 inch)" : "10-15 inch"; }
    var totalLow = low * sets, totalHigh = high * sets;
    var vatLow = Math.round(totalLow * vatRate), vatHigh = Math.round(totalHigh * vatRate);
    return "RIMS ESTIMATE - Ref: " + ref + "\n\n" + qty + " rims = " + sets + " set(s)\nSize: " + sizeLabel + "\nColour: " + (premium ? "Premium" : "Standard Black/White") + "\n\nExcl VAT: R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\nIncl VAT: R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + "\n\nCustomer MUST remove tyres.\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
  }

  // ===== ITEM 2: SHEET METAL =====
  if (t.includes("sheet") || t.includes("sqm") || t.includes("mesh") || t.includes("plate") || t.includes("panel")) {
    var sqmMatch = t.match(/(\d+)\s*sqm/);
    var sqm = sqmMatch ? parseInt(sqmMatch[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 5);
    var sp = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("colour")||t.includes("color"));
    var sl = sp ? 251 : 175, sh = sp ? 350 : 250;
    var stl = sqm * sl, sth = sqm * sh;
    var svl = Math.round(stl * vatRate), svh = Math.round(sth * vatRate);
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\nSize: " + sqm + " sqm\nColour: " + (sp ? "Premium (R251-R350/sqm)" : "Standard B/W (R175-R250/sqm)") + "\n\nExcl VAT: R" + stl.toLocaleString() + " - R" + sth.toLocaleString() + "\nVAT: R" + svl.toLocaleString() + " - R" + svh.toLocaleString() + "\nIncl VAT: R" + (stl+svl).toLocaleString() + " - R" + (sth+svh).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
  }

  // ===== ITEM 1: SECURITY & FENCING (per kg) =====
  if (t.includes("kg") || t.includes("gate") || t.includes("burglar") || t.includes("fence") || t.includes("railing") || t.includes("balustrade") || t.includes("palisade") || t.includes("clear view") || t.includes("sliding") || t.includes("spike") || t.includes("mesh panel")) {
    var kgMatch = t.match(/(\d+)\s*kg/);
    var kg = kgMatch ? parseInt(kgMatch[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 10);
    var isPremium = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("silver")||t.includes("blue")||t.includes("red")||t.includes("green")||t.includes("yellow")||t.includes("colour")||t.includes("color"));
    var rateLow = isPremium ? 17 : 16, rateHigh = isPremium ? 20 : 16;
    var coatingLow = kg * rateLow, coatingHigh = kg * rateHigh;
    
    var blastOnly = ((t.includes("blast only")||t.includes("sandblast only")||t.includes("blasting only")) && !t.includes("coat"));
    if (blastOnly) {
      var bl = kg * 8, bh = kg * 12;
      var bvl = Math.round(bl * vatRate), bvh = Math.round(bh * vatRate);
      return "BLASTING ONLY ESTIMATE - Ref: " + ref + "\n\n" + kg + "kg\nR8-R12/kg\n\nExcl VAT: R" + bl.toLocaleString() + " - R" + bh.toLocaleString() + "\nVAT: R" + bvl.toLocaleString() + " - R" + bvh.toLocaleString() + "\nIncl VAT: R" + (bl+bvl).toLocaleString() + " - R" + (bh+bvh).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
    }
    
    var vl = Math.round(coatingLow * vatRate), vh = Math.round(coatingHigh * vatRate);
    var msg = "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\n\nWeight: " + kg + " kg\nColour: " + (isPremium ? "Premium (R"+rateLow+"-R"+rateHigh+"/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + coatingLow.toLocaleString() + " - R" + coatingHigh.toLocaleString() + "\nVAT (15%): R" + vl.toLocaleString() + " - R" + vh.toLocaleString() + "\nTOTAL (incl VAT): R" + (coatingLow+vl).toLocaleString() + " - R" + (coatingHigh+vh).toLocaleString();
    if (kg > 100) msg += "\n\nBulk discount up to 10% may apply.";
    msg += "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
    return msg;
  }

  // ===== TRUCK BLASTING =====
  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) {
    var tl = 5000, th = 7500;
    return "TRUCK BLASTING ESTIMATE - Ref: " + ref + "\n\n5m flatbed\n\nExcl VAT: R" + tl.toLocaleString() + " - R" + th.toLocaleString() + "\nVAT: R" + Math.round(tl*vatRate).toLocaleString() + " - R" + Math.round(th*vatRate).toLocaleString() + "\nIncl VAT: R" + Math.round(tl*1.15).toLocaleString() + " - R" + Math.round(th*1.15).toLocaleString() + "\n\nAll prices are estimates. Final price from Ridhor: 076 760 4350";
  }

  return null;
}

module.exports = { getOrderRef, estimatePrice };
