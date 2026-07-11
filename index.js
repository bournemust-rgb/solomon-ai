const express = require('express');
// ... (rest of code)
  var t = text.toLowerCase().trim();
  var flow = session.flow || { state: "idle" };

  // DELIVERY FLOW
  if (flow.state === "delivery_asking_where") {
    var dist = delivery.findDistance(t);
    if (dist) {
      flow.deliveryKm = dist;
      flow.deliveryLocation = t;
      flow.state = "delivery_asking_size";
      session.flow = flow;
      await saveSession(from, session);
      return "Got it, " + t + " is about " + dist + "km from our workshop in Blackheath. Now — is the item under 1 ton and under 3m long? Or bigger? Reply SMALL or LARGE.";
    }
    return "I could not find that area. Try a nearby town: Bellville, Durbanville, Stellenbosch, Cape Town CBD.";
  }

  if (flow.state === "delivery_asking_size") {
    var isLarge = /large|big|over|more|truck/.test(t);
    flow.deliveryIsLarge = isLarge;
    flow.state = "delivery_asking_labour";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it. One more thing — do you have people to help load at your side? Or do you need us to send a labourer? Reply YES (I have help) or NO (send labourer).";
  }

  if (flow.state === "delivery_asking_labour") {
    var needsLabour = /no|need|send|don|dont|help|labour|please/.test(t) && !/yes|have|got|sorted|fine|okay|covered/.test(t);
    var calc = delivery.calculateDelivery(flow.deliveryKm, flow.deliveryIsLarge, needsLabour);
    flow.state = "idle";
    session.flow = flow;
    await saveSession(from, session);
    return delivery.formatDeliveryResponse(calc, flow.deliveryLocation);
  }

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// ... (rest of code)
