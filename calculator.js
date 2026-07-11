function getOrderRef(){
  var d=new Date();
  return "SC"+d.getFullYear().toString().slice(-2)+("0"+(d.getMonth()+1)).slice(-2)+("0"+d.getDate()).slice(-2)+"-"+Math.floor(Math.random()*9000+1000);
}
function estimatePrice(text, randomAffirmation) {
  var t = text.toLowerCase();
  var ref = getOrderRef();
  var vatRate = 0.15;
  if (t.includes("rim")) {
    var qty = t.match(/(\d+)/); qty = qty ? parseInt(qty[1]) : 4;
    var sets = Math.ceil(qty / 4);
    var rimColour = (t.includes("metallic")||t.includes("gold")||t.includes("bronze")||t.includes("charcoal")||t.includes("silver")||t.includes("color")||t.includes("colour")) ? "premium" : "standard";
    var rimLow = rimColour === "standard" ? 1000 : 1200;
    var rimHigh = rimColour === "standard" ? 1200 : 1500;
    var rimTotalLow = rimLow * sets, rimTotalHigh = rimHigh * sets;
    var rimVatLow = Math.round(rimTotalLow * vatRate), rimVatHigh = Math.round(rimTotalHigh * vatRate);
    return "RIMS ESTIMATE - Ref: " + ref + "\n\n" + qty + " rims = " + sets + " set(s)\nColour: " + (rimColour === "standard" ? "Standard" : "Premium") + "\n\nExcl VAT: R" + rimTotalLow.toLocaleString() + " - R" + rimTotalHigh.toLocaleString() + "\nVAT (15%): R" + rimVatLow.toLocaleString() + " - R" + rimVatHigh.toLocaleString() + "\nIncl VAT: R" + (rimTotalLow+rimVatLow).toLocaleString() + " - R" + (rimTotalHigh+rimVatHigh).toLocaleString() + "\n\nCustomer MUST remove tyres. Estimate only. WhatsApp Ridhor: 076 760 4350.\n\n" + (randomAffirmation ? randomAffirmation() : "");
  }
  if (t.includes("kg") || t.includes("gate") || t.includes("burglar") || t.includes("fence") || t.includes("railing") || t.includes("balustrade")) {
    var kg = t.match(/(\d+)\s*kg/); kg = kg ? parseInt(kg[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 10);
    var isPremium = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("silver")||t.includes("blue")||t.includes("red")||t.includes("green")||t.includes("yellow")||t.includes("colour")||t.includes("color"));
    var rateLow = isPremium ? 17 : 16, rateHigh = isPremium ? 20 : 16;
    var coatingLow = kg * rateLow, coatingHigh = kg * rateHigh;
    var blastOnly = ((t.includes("blast only")||t.includes("sandblast only")||t.includes("blasting only")) && !t.includes("coat"));
    if (blastOnly) {
      var bl = kg*8, bh = kg*12;
      var bvl = Math.round(bl*vatRate), bvh = Math.round(bh*vatRate);
      return "BLASTING ONLY ESTIMATE - Ref: " + ref + "\n\n" + kg + "kg\nR8-R12/kg\n\nExcl VAT: R" + bl.toLocaleString() + " - R" + bh.toLocaleString() + "\nVAT: R" + bvl.toLocaleString() + " - R" + bvh.toLocaleString() + "\nIncl VAT: R" + (bl+bvl).toLocaleString() + " - R" + (bh+bvh).toLocaleString() + "\n\nEstimate only.\n\n" + (randomAffirmation ? randomAffirmation() : "");
    }
    var vl = Math.round(coatingLow*vatRate), vh = Math.round(coatingHigh*vatRate);
    var msg = "GATE/PER KG ESTIMATE - Ref: " + ref + "\n\nWeight: " + kg + " kg\nColour: " + (isPremium ? "Premium (R"+rateLow+"-R"+rateHigh+"/kg)" : "Standard Black/White (R16/kg)") + "\n\nCoating (blasting included): R" + coatingLow.toLocaleString() + " - R" + coatingHigh.toLocaleString() + "\nVAT (15%): R" + vl.toLocaleString() + " - R" + vh.toLocaleString() + "\nTOTAL (incl VAT): R" + (coatingLow+vl).toLocaleString() + " - R" + (coatingHigh+vh).toLocaleString();
    if (kg > 100) msg += "\n\nBulk discount up to 10% may apply.";
    msg += "\n\nEstimate only. WhatsApp Ridhor: 076 760 4350.\n\n" + (randomAffirmation ? randomAffirmation() : "");
    return msg;
  }
  if (t.includes("sheet") || t.includes("mesh")) {
    var sqm = t.match(/(\d+)\s*sqm/); sqm = sqm ? parseInt(sqm[1]) : (t.match(/(\d+)/) ? parseInt(t.match(/(\d+)/)[1]) : 5);
    var sp = (t.includes("charcoal")||t.includes("metallic")||t.includes("bronze")||t.includes("gold")||t.includes("colour")||t.includes("color"));
    var sl = sp?251:175, sh = sp?350:250;
    var stl = sqm*sl, sth = sqm*sh;
    var svl = Math.round(stl*vatRate), svh = Math.round(sth*vatRate);
    return "SHEET METAL ESTIMATE - Ref: " + ref + "\n\n" + sqm + " sqm\nColour: " + (sp?"Premium":"Standard") + "\n\nExcl VAT: R" + stl.toLocaleString() + " - R" + sth.toLocaleString() + "\nVAT: R" + svl.toLocaleString() + " - R" + svh.toLocaleString() + "\nIncl VAT: R" + (stl+svl).toLocaleString() + " - R" + (sth+svh).toLocaleString() + "\n\n" + (randomAffirmation ? randomAffirmation() : "");
  }
  if (t.includes("truck")||t.includes("bakkie")||t.includes("flatbed")) {
    var tl=5000, th=7500;
    return "TRUCK BLASTING ESTIMATE - Ref: " + ref + "\n\n5m flatbed\n\nExcl VAT: R"+tl.toLocaleString()+" - R"+th.toLocaleString()+"\nVAT: R"+Math.round(tl*vatRate).toLocaleString()+" - R"+Math.round(th*vatRate).toLocaleString()+"\nIncl VAT: R"+Math.round(tl*1.15).toLocaleString()+" - R"+Math.round(th*1.15).toLocaleString()+"\n\n" + (randomAffirmation ? randomAffirmation() : "");
  }
  return null;
}
module.exports = { getOrderRef, estimatePrice };
