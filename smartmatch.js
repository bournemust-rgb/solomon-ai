function smartMatch(text, QR, estimatePrice, randomAffirmation, randomTPS, randomFallback, randomGreeting, getOrderRef, GOOGLE_REVIEW, FACEBOOK, TIKTOK, OFFICE_EMAIL, OFFICE_NUMBER, QUOTE_EMAIL, tcdb) {
  var t=text.toLowerCase().trim();
  if(t==="14" || t==="tps" || t==="wisdom") return randomTPS();
  var calc=estimatePrice(text, randomAffirmation);
  if(calc) return calc;
  if(QR[t]) { if(QR[t] === 'USE_RANDOM') return randomGreeting() + '\n\nTell me what you need priced - gates, rims, steel, shotblasting, trucks.\n\nType *menu* to see our Secret List.'; return QR[t]; }
  if(t.includes("affirmation")||t.includes("fact")||t.includes("tip")) return randomAffirmation();
  if(t.includes("reference")||t.includes("order number")) return "Your reference: "+getOrderRef();
  if(t.includes("how busy")||t.includes("queue")) return "For wait time, WhatsApp Ridhor 076 760 4350.";
  if(t.includes("review")||t.includes("rate")) return "Leave a review: "+GOOGLE_REVIEW;
  // Gallery with pagination
  if(t.includes("gallery")){
    var pageMatch = t.match(/gallery\s*(\d+)/);
    var page = pageMatch ? parseInt(pageMatch[1]) : 1;
    return getGalleryList(page);
  }
  // Gallery color selection (1-20)
  if(/^([1-9]|1[0-9]|20)$/.test(t) && !QR[t]){
    var colorResp = getColorByIndex(parseInt(t));
    if(colorResp) return colorResp;
  }
  if(t.includes("terms")||t.includes("t&c")) return QR["8"];
  if(t.includes("order")&&(t.includes("status")||t.includes("update")||t.includes("ready"))) return "For order updates, WhatsApp Ridhor: 076 760 4350.";
  if(t.includes("book")||t.includes("callback")) return QR["11"];
  if(t.includes("complaint")||t.includes("problem")||t.includes("unhappy")) return "Sorry! WhatsApp Ridhor 076 760 4350 or email "+OFFICE_EMAIL;
  if(t.includes("recommend")||t.includes("refer")) return "We love referrals! Share 060 507 4461";
  if(t.includes("urgent")||t.includes("emergency")||t.includes("asap")) return "For urgent jobs, WhatsApp Ridhor: 076 760 4350.";
  if(t.includes("material")||t.includes("can you coat")) return "We coat metals handling 200C+: steel, aluminium, cast iron. No plastic/wood.";
  if(t.includes("collect")||t.includes("storage")) return "Collect within 7 days. Late: 7% daily storage.";
  if(t.includes("coastal")||t.includes("warranty")) return "No warranties within 15km of shoreline.";
  if(t.includes("plastic")||t.includes("glass")||t.includes("hydraulic")) return "Before blasting: Remove plastic, glass, hydraulics.";
  if(t.includes("pay")||t.includes("payment")||t.includes("cod")) return "Strict COD. No release without payment. Accounts: "+OFFICE_EMAIL;
  if(t.includes("account")||t.includes("statement")) return QR["13"];
  if((t.includes("speak")||t.includes("talk"))&&(t.includes("ridhor")||t.includes("owner"))) return QR["12"];
  if(t.includes("bulk")||t.includes("discount")) return "Bulk discounts up to 10%. WhatsApp Ridhor: 076 760 4350.";
  if(t.includes("truck")||t.includes("bakkie")) return "Truck blasting: R5,000-R7,500 excl VAT.";
  if(t.includes("blast")||t.includes("sandblast")) return "Blasting: R8-R12/kg. Truck: R5,000-R7,500.";
  if(t.includes("rust")) return "Rusted items: Blasting R8-R12/kg. May reveal defects.";
  if(t.includes("price")||t.includes("cost")||t.includes("how much")) return QR["pricing"];
  if(t.includes("colour")||t.includes("color")||t.includes("finish")||t.includes("ral")) return QR["colours"];
  if(t.includes("hour")||t.includes("open")||t.includes("close")) return QR["hours"];
  if(t.includes("turnaround")||t.includes("how long")) return QR["turnaround"];
  if(t.includes("deliver")||t.includes("where")||t.includes("address")) return QR["delivery"];
  if(t.includes("contact")||t.includes("email")||t.includes("phone")) return QR["contact"];
  if(t.includes("rim")||t.includes("wheel")) return "Rims: R1,000-R1,500/set of 4. For estimate: quote 4 rims black";
  if(t.includes("gate")||t.includes("fence")) return "Gates: R16/kg B/W, R17-R20/kg premium. For estimate: quote 20kg gate charcoal";
  if(t.includes("sheet")||t.includes("mesh")) return "Sheet: R175-R250/sqm B/W, R251-R350/sqm premium.";
  if(t.includes("minimum")||t.includes("small job")) return "Min: R173.99 B/W, R225 hammered, R300+ metallic. Excl VAT.";
  if(t.includes("tyre")||t.includes("tire")) return "Customer MUST remove tyres.";
  if(t.includes("vat")) return "All prices exclude 15% VAT unless stated.";
  if(t.includes("weekend")||t.includes("saturday")) return "Closed weekends. Mon-Thurs 8-4:45, Fri 8-2:45.";
  if(t.includes("loadshedding")||t.includes("delay")) return "Timelines affected by loadshedding/weather.";
  if (tcdb) { var tcMatch = tcdb.searchTCDB(text); if (tcMatch) return tcMatch; }
  return randomFallback();
}
module.exports = { smartMatch };


