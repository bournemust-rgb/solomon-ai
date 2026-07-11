async function handleMessage(text, from, session, smartMatch, QR, delivery, getOrderRef, saveSession, randomGreeting, tcdb) {
  var t=text.toLowerCase().trim();
  // FUZZY MATCHING
  var fuzzyResult = fuzzyMatch(t);
  if (fuzzyResult && flow.state === "idle" && !t.includes("yes") && !t.includes("no")) {
    var dym = didYouMean(fuzzyResult);
    if (dym) return dym;
  }
  var flow=session.flow||{state:"idle"};
  var isGreeting = /^(hi|hello|hey|howzit|good morning|good afternoon|good evening|morning|hola)$/.test(t);
  if(isGreeting){
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    if(/^(hi|hello|hey|howzit|good morning)$/i.test(t)) return randomGreeting() + '\n\nTell me what you need priced - gates, rims, steel, shotblasting, trucks.\n\nType *menu* to see our Secret List.';
    return smartMatch(text);
  }
  if(flow.state!=="idle" && /^(cancel|stop)$/.test(t)){
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    return "No problem, cancelled.\n\n"+smartMatch(text);
  }

  // GATES FLOW
  if(t==="gate"||t==="gates"||t.includes("gate")&&!flow.state||flow.product==="gate"){
    if(!flow.state||flow.state==="idle"){
      flow={state:"asked_condition", product:"gate", rustSurcharge:false}; session.flow=flow; await saveSession(from, session);
      return "Got it - gate. What condition? Reply: CLEAN, LIGHT RUST, or BADLY RUSTED.";
    }
  }
  if(flow.state==="asked_condition"&&flow.product==="gate"){
    var cond="clean";
    if(/heavy|bad|badly|severe|pitted|flaking|rusty/.test(t)) cond="rusty";
    else if(/light|surface|bit|little/.test(t)) cond="light rust";
    flow.condition=cond; flow.state="asked_weight"; session.flow=flow; await saveSession(from, session);
    if(cond==="rusty"){ flow.rustSurcharge=true; return "Agh, best ones. Full blast - adds R4-R8/kg extra. Rough weight? Medium gate 15-25kg."; }
    if(cond==="light rust") return "Light rust - quick blast, no extra charge. Rough weight?";
    return "Cool, no rust. Rough weight? 10kg? 20kg? 50kg?";
  }
  if(flow.state==="asked_weight"&&flow.product==="gate"){
    var kgMatch=t.match(/(\d+)/); var kg=kgMatch?parseInt(kgMatch[1]):20;
    flow.weight=kg; flow.state="asked_colour"; session.flow=flow; await saveSession(from, session);
    return "Got it, "+kg+"kg. Colour? Black/White=R16/kg, Charcoal/metallic/custom=R17-R20/kg.";
  }
  if(flow.state==="asked_colour"&&flow.product==="gate"){
    var isPremium=/charcoal|metallic|bronze|gold|red|blue|green|custom|ral|colour|color/.test(t);
    var rate=isPremium?18:16; var weight=flow.weight||20; var coatingTotal=weight*rate; var rustExtra=0;
    if(flow.rustSurcharge){ rustExtra=weight*6; coatingTotal+=rustExtra; }
    var vat=Math.round(coatingTotal*0.15); var total=coatingTotal+vat;
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    var msg="YOUR ESTIMATE - Ref: "+getOrderRef()+"\n\n"+weight+"kg gate\nBase: R"+rate+"/kg";
    if(rustExtra>0) msg+="\nRust surcharge: R"+rustExtra+" (R4-R8/kg)";
    msg+="\n\nExcl VAT: R"+coatingTotal.toLocaleString()+"\nVAT: R"+vat.toLocaleString()+"\nTOTAL: R"+total.toLocaleString()+"\n\nBlasting included within reason. Estimate only.\n\nWant to book? Reply YES. Or Ridhor: 076 760 4350.";
    return msg;
  }

  // TRUCKS FLOW
  if(t==="truck"||t==="trucks"||t.includes("truck")&&!flow.state||flow.product==="truck"){
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    return "Truck blasting! We charge R5,000-R7,500 for a 5m flatbed truck (excl VAT).\n\nThis is an EXAMPLE estimate only. For a final quote, contact Ridhor directly:\nWhatsApp: 076 760 4350\nEmail: infosc@mweb.co.za\n\nImportant: No rubber can be blasted - must be removed first.";
  }

  // RIMS FLOW
  if(t==="rim"||t==="rims"||t.includes("rim")&&!flow.state||flow.product==="rims"){
    if(!flow.state||flow.state==="idle"){
      flow={state:"rims_asked_size", product:"rims"}; session.flow=flow; await saveSession(from, session);
      return "Rims! What size are they? 10 inch to 15 inch is our standard range.\n\nJust reply with the size: 10, 12, 13, 14, or 15.";
    }
  }
  if(flow.state==="rims_asked_size"&&flow.product==="rims"){
    var sizeMatch=t.match(/(\d+)/); var size=sizeMatch?parseInt(sizeMatch[1]):14;
    flow.rimSize=size; flow.state="rims_asked_colour"; session.flow=flow; await saveSession(from, session);
    return "Got it, "+size+" inch. What colour? Black/White is standard price. Any other colour (charcoal, red, blue, metallic etc) is 30% more.";
  }
  if(flow.state==="rims_asked_colour"&&flow.product==="rims"){
    var isPremiumRim=!/black|white/.test(t)||/charcoal|metallic|bronze|gold|red|blue|green|custom|ral|colour|color/.test(t);
    var rimSize=flow.rimSize||14;
    var basePrice=1100; var highPrice=1500;
    if(isPremiumRim){ basePrice=Math.round(basePrice*1.3); highPrice=Math.round(highPrice*1.3); }
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    return "RIMS ESTIMATE - Ref: "+getOrderRef()+"\n\n"+rimSize+" inch rims - Set of 4\nColour: "+(isPremiumRim?"Premium (+30%)":"Standard Black/White")+"\n\nPrice: R"+basePrice.toLocaleString()+" - R"+highPrice.toLocaleString()+" per set\n\nCustomer MUST remove tyres. Estimate only.\n\nWant to book? Reply YES. Or Ridhor: 076 760 4350.";
  }

  // SHOTBLASTING FLOW
  if(t==="shotblast"||t==="shotblasting"||t==="sandblast"||t.includes("shotblast")&&!flow.state||flow.product==="shotblast"){
    if(!flow.state||flow.state==="idle"){
      flow={state:"shotblast_asked_size", product:"shotblast"}; session.flow=flow; await saveSession(from, session);
      return "Shotblasting! What size is the item in square meters? Just give me a number.";
    }
  }
  if(flow.state==="shotblast_asked_size"&&flow.product==="shotblast"){
    var sqmMatch=t.match(/(\d+)/); var sqm=sqmMatch?parseInt(sqmMatch[1]):5;
    var blastPrice=sqm*250;
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    return "SHOTBLASTING ESTIMATE - Ref: "+getOrderRef()+"\n\nApproximate size: "+sqm+" sqm\n\nEstimated price: R"+blastPrice.toLocaleString()+"\n\nThis is an ESTIMATE ONLY. Contact Ridhor for final quote:\nWhatsApp: 076 760 4350\nEmail: infosc@mweb.co.za\n\nBlasting medium: Grit/slag 0.12-0.4mm at 6 bar. All blasting at client risk.";
  }

  // DELIVERY FLOW
  if(flow.state==="delivery_asking_where"){
    var dist=(delivery&&typeof delivery.findDistance==="function")?delivery.findDistance(t):null;
    if(dist){ flow.deliveryKm=dist; flow.deliveryLocation=t; flow.state="delivery_asking_size"; session.flow=flow; await saveSession(from, session); return "Got it, "+t+" is about "+dist+"km from Blackheath. Under 1 ton and under 3m? Reply SMALL or LARGE."; }
    var nearby=(delivery&&typeof delivery.getNearbyAreas==="function")?delivery.getNearbyAreas().join(", "):"Bellville, Durbanville, Stellenbosch";
    return "Could not find that area. Try: "+nearby;
  }
  if(flow.state==="delivery_asking_size"){
    var isLarge=/large|big|over|more|truck/.test(t); flow.deliveryIsLarge=isLarge; flow.state="delivery_asking_labour"; session.flow=flow; await saveSession(from, session);
    return "Got it. Do you have people to help load? Reply YES (I have help) or NO (send labourer).";
  }
  if(flow.state==="delivery_asking_labour"){
    var needsLabour=/no|need|send|don|dont|labour/.test(t)&&!/yes|have|got|sorted/.test(t);
    var calc=(delivery&&typeof delivery.calculateDelivery==="function")?delivery.calculateDelivery(flow.deliveryKm, flow.deliveryIsLarge, needsLabour):null;
    var resp=(calc&&delivery&&typeof delivery.formatDeliveryResponse==="function")?delivery.formatDeliveryResponse(calc, flow.deliveryLocation):"Delivery to "+flow.deliveryLocation+" calculated. WhatsApp Ridhor 076 760 4350.";
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session); return resp;
  }

  var normal=smartMatch(text);
  if(normal===QR["delivery"]){
    flow.state="delivery_asking_where"; session.flow=flow; await saveSession(from, session);
    return "Sure! Which area/town? e.g. Bellville, Durbanville, Stellenbosch, Cape Town CBD";
  }
  return normal;
}
// FUZZY MATCHING - catches typos and asks "did you mean?"
var PRODUCT_MAP = {
  "gate": ["gate","gates","gste","gtea","gaet","agte","gates","gate ","gates ","security gate","sliding gate","driveway gate","gated","gating"],
  "rim": ["rim","rims","rims ","rmi","rimz","mag","mags","wheel","wheels","alloy","alloys","rwheel","wheesl"],
  "truck": ["truck","trucks","trkcu","truk","bakkie","bakkies","flatbed","flat bed","ldv","truckk","truc"],
  "shotblast": ["shotblast","shot blast","sandblast","sand blast","blast","blasting","blsting","shotblasting","sandblasting","blsat","blst"],
  "chassis": ["chassis","chasis","chasssis","trailer","trailor","chassi","chasssis"],
  "sheet": ["sheet","sheets","sheet metal","mesh","panel","panels","sheeet","shet"],
  "steel": ["steel","steal","stel","steel ","metal","iron","stainless","galvanized","galvanised"]
};

function fuzzyMatch(text) {
  var t = text.toLowerCase().trim();
  // Check for typos - if word is close to a known product
  for (var product in PRODUCT_MAP) {
    for (var i = 0; i < PRODUCT_MAP[product].length; i++) {
      var variant = PRODUCT_MAP[product][i];
      // Exact match in the text
      if (t.indexOf(variant) !== -1) return product;
      // Close match (1-2 characters different)
      if (t.length >= variant.length - 2 && t.length <= variant.length + 2) {
        var matches = 0;
        for (var j = 0; j < Math.min(t.length, variant.length); j++) {
          if (t[j] === variant[j]) matches++;
        }
        if (matches >= variant.length - 2) return product;
      }
    }
  }
  return null;
}

function didYouMean(guess) {
  var map = {
    "gate": "Did you mean *gate*? Reply YES and I will ask you about condition and weight.",
    "rim": "Did you mean *rims*? Reply YES and I will ask you about size and colour.",
    "truck": "Did you mean *truck*? Reply YES for truck blasting info.",
    "shotblast": "Did you mean *shotblasting*? Reply YES and I will ask you about size.",
    "chassis": "Did you mean *chassis*? Reply YES and I will connect you to Ridhor for this.",
    "sheet": "Did you mean *sheet metal*? Reply YES for square meter pricing.",
    "steel": "Did you mean *steel/gate/security item*? Reply YES and I will ask you about condition and weight."
  };
  return map[guess] || null;
}

module.exports = { handleMessage };

