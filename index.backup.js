require("dotenv").config();
var express = require("express");
var axios = require("axios");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var { randomGreeting } = require("./greetings");
var { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu } = require("./bot-content");
var { randomAffirmation, randomTPS, getOrderRef, isAfterHours, estimatePrice, smartMatch, handleMessage } = require("./bot-core");

var app = express();
app.use(express.static("public"));
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

var VT = process.env.WHATSAPP_VERIFY_TOKEN || "solomon_coatings_1988";
var PORT = process.env.PORT || 3000;
var PERSONAL_NUMBER = "27767604350";
var OFFICE_NUMBER = "0219052912";
var OFFICE_EMAIL = "populier@mweb.co.za";
var QUOTE_EMAIL = "infosc@mweb.co.za";
var FACEBOOK = "https://www.facebook.com/SolomonCoatings/";
var TIKTOK = "https://www.tiktok.com/@solomon.coatings";
var GOOGLE_REVIEW = "https://g.page/r/your-review-link";
var TERMS_URL = "https://solomon-ai-izyb.onrender.com/terms.html";
var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

var QR = buildMenu(OFFICE_NUMBER, OFFICE_EMAIL, QUOTE_EMAIL, FACEBOOK, TIKTOK, GOOGLE_REVIEW, TERMS_URL);

var smartMatchFn = function(text) {
  return smartMatch(text, QR, function() { return getSocialsResponse(FACEBOOK, TIKTOK); }, getGalleryMenu, getColorResponse, GOOGLE_REVIEW, OFFICE_EMAIL, OFFICE_NUMBER, QUOTE_EMAIL, randomGreeting);
};

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    if (!WA_TOKEN || !PHONE_ID) return false;
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "text", text: { body: "📸 Image from " + fromNumber } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    return true;
  } catch (e) {
    console.error("[forwardImage] error:", e.response?.data || e.message);
    return false;
  }
}

app.get("/health", function(req, res) { res.json({ status: "healthy", version: "17.0", arch: "modular-3file" }); });
app.get("/", function(req, res) { res.json({ service: "Solomon Coatings", version: "17.0 - Modular 3-File", modules: ["index.js", "bot-core.js", "bot-content.js"] }); });
app.get("/webhook", function(req, res) {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VT) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
  try {
    var entries = req.body?.entry || [];
    for (var i = 0; i < entries.length; i++) {
      var changes = entries[i].changes || [];
      for (var j = 0; j < changes.length; j++) {
        var msgs = changes[j].value?.messages || [];
        for (var k = 0; k < msgs.length; k++) {
          var msg = msgs[k];
          var from = msg.from;
          var type = msg.type;
          var text = msg.text?.body?.trim() || null;
          var imageId = msg.image?.id || null;
          var afterHours = isAfterHours();

          if (type === "image" && imageId) {
            var forwarded = await forwardImageToOwner(imageId, from);
            if (forwarded) {
              await sendMessage(from, "Thanks! Your photo has been forwarded to Ridhor (076 760 4350). He'll get back to you.");
            } else {
              await sendMessage(from, "Thanks for the photo! WhatsApp Ridhor directly: 076 760 4350.");
            }
            continue;
          }

          if (!text) continue;

          var session = await getSession(from);
          var reply = await handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession);

          if (afterHours) {
            var showClosed = Math.floor(Math.random() * 4) === 0;
            if (showClosed) reply = "Our workshop is closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!\n\n" + reply;
            try { await sendMessage(PERSONAL_NUMBER, "After-hours msg from " + from + ": " + text); } catch (e) { }
          }

          await sendMessage(from, reply);

          session.history = session.history || [];
          session.history.push({ role: "user", content: text }, { role: "model", content: reply });
          if (session.history.length > 40) session.history = session.history.slice(-20);
          await saveSession(from, session);
        }
      }
    }
  } catch (e) {
    console.error("[WEBHOOK ERROR]", e.message, e.stack);
  }
});

app.listen(PORT, function() {
  console.log("\n✅ SOLOMON v17.0 MODULAR — 3 FILES");
  console.log("   ✓ index.js    (server + wiring)");
  console.log("   ✓ bot-core.js (logic + flows)");
  console.log("   ✓ bot-content.js (menu + gallery + socials)");
  console.log("   ✓ Listening on port " + PORT + "\n");
});
