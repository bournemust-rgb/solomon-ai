async function handleMessage(text, from, session, smartMatch, QR, delivery, getOrderRef, saveSession, randomGreeting) {
  var t=text.toLowerCase().trim();
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
  if(t==="gate"||t==="gates"||t.includes("security gate")){
    flow={state:"asked_condition", product:"gate", rustSurcharge:false}; session.flow=flow; await saveSession(from, session);
    return "Got it - gate. What condition? Reply: CLEAN, LIGHT RUST, or BADLY RUSTED.";
  }
  if(flow.state==="asked_condition"){
    var cond="clean";
    if(/heavy|bad|badly|severe|pitted|flaking|rusty/.test(t)) cond="rusty";
    else if(/light|surface|bit|little/.test(t)) cond="light rust";
    flow.condition=cond; flow.state="asked_weight"; session.flow=flow; await saveSession(from, session);
    if(cond==="rusty"){ flow.rustSurcharge=true; return "Agh, best ones. Full blast - adds R4-R8/kg extra. Rough weight? Medium gate 15-25kg."; }
    if(cond==="light rust") return "Light rust - quick blast, no extra charge. Rough weight?";
    return "Cool, no rust. Rough weight? 10kg? 20kg? 50kg?";
  }
  if(flow.state==="asked_weight"){
    var kgMatch=t.match(/(\d+)/); var kg=kgMatch?parseInt(kgMatch[1]):20;
    flow.weight=kg; flow.state="asked_colour"; session.flow=flow; await saveSession(from, session);
    return "Got it, "+kg+"kg. Colour? Black/White=R16/kg, Charcoal/metallic/custom=R17-R20/kg.";
  }
  if(flow.state==="asked_colour"){
    var isPremium=/charcoal|metallic|bronze|gold|red|blue|green|custom|ral|colour|color/.test(t);
    var rate=isPremium?18:16; var weight=flow.weight||20; var coatingTotal=weight*rate; var rustExtra=0;
    if(flow.rustSurcharge){ rustExtra=weight*6; coatingTotal+=rustExtra; }
    var vat=Math.round(coatingTotal*0.15); var total=coatingTotal+vat;
    flow={state:"idle"}; session.flow=flow; await saveSession(from, session);
    var msg="YOUR ESTIMATE - Ref: "+getOrderRef()+"\n\n"+weight+"kg gate\nBase: R"+rate+"/kg";
    if(rustExtra>0) msg+="\nRust surcharge: R"+rustExtra+" (R4-R8/kg)";
    msg+="\n\nExcl VAT: R"+coatingTotal.toLocaleString()+"\nVAT: R"+vat.toLocaleString()+"\nTOTAL: R"+total.toLocaleString()+"\n\nWant to book? Reply YES. Or Ridhor: 076 760 4350.";
    return msg;
  }
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
module.exports = { handleMessage };

