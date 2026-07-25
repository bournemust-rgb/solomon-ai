require("dotenv").config();
var express = require("express");
var axios = require("axios");
var { validateWhatsAppSignature } = require("./security");
var { getSession, saveSession } = require("./db");
var { sendMessage } = require("./queue");
var { randomGreeting } = require("./greetings");
var { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu } = require("./bot-content");
var { randomAffirmation, randomTPS, getOrderRef, isAfterHours, smartMatch, handleMessage } = require("./bot-core");
var { estimatePrice } = require("./calculator");

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

app.get("/health", function(req, res) { res.json({ status: "healthy", version: "17.0", arch: "modular-3file" }); });
app.get("/", function(req, res) { res.json({ service: "Solomon Coatings", version: "17.0 - Modular 3-File", modules: ["index.js", "bot-core.js", "bot-content.js"] }); });
app.get("/webhook", function(req, res) {
  console.log("📡 Webhook GET request received");
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VT) {
    console.log("✅ Webhook verified!");
    return res.status(200).send(req.query["hub.challenge"]);
  }
  console.log("❌ Webhook verification failed");
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  console.log("📨 Webhook POST received!");
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
          
          console.log("📩 Message from:", from);
          console.log("📩 Text:", text);

          if (type === "image" && imageId) {
            try {
              await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
                { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
                { headers: { Authorization: "Bearer " + WA_TOKEN } });
              await sendMessage(from, "Thanks! Your photo has been forwarded to Ridhor.");
            } catch (e) {
              console.error("Image error:", e.message);
              await sendMessage(from, "Could not forward image.");
            }
            continue;
          }

          if (!text) continue;

          console.log("🧠 Processing message:", text);
          var session = await getSession(from);
          var reply = await handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession);

          // FORCE reply to be a string
          if (typeof reply !== 'string') {
            console.log("⚠️ Reply is not a string! Converting...");
            reply = String(reply || "I'm not sure how to help with that.");
          }

          console.log("💬 Sending reply:", reply.substring(0, 100));
          await sendMessage(from, reply);

          session.history = session.history || [];
          session.history.push({ role: "user", content: text }, { role: "model", content: reply });
          if (session.history.length > 40) session.history = session.history.slice(-20);
          await saveSession(from, session);
        }
      }
    }
  } catch (e) {
    console.error("💥 WEBHOOK ERROR:", e.message);
  }
});

app.get("/api/chats", async function(req, res) {
  try {
    var phone = req.query.phone;
    var { redis } = require("./db");
    if (phone) {
      var key = "session:" + phone;
      var data = await redis.get(key);
      if (data) {
        var session = JSON.parse(data);
        res.json({ phone: phone, messages: session.history || [] });
      } else {
        res.json({ phone: phone, messages: [] });
      }
    } else {
      var keys = await redis.keys("session:*");
      var chats = [];
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var p = k.replace("session:", "");
        var data = await redis.get(k);
        if (data) {
          var session = JSON.parse(data);
          var lastMsg = "";
          if (session.history && session.history.length > 0) {
            var last = session.history[session.history.length - 1];
            lastMsg = last.content ? last.content.substring(0, 80) : "";
          }
          chats.push({ phone: p, lastMsg: lastMsg, time: session.lastUpdated || session.createdAt || "" });
        }
      }
      res.json({ chats: chats });
    }
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.post("/api/reply", async function(req, res) {
  try {
    var { to, message } = req.body;
    if (!to || !message) return res.json({ error: "Missing to or message" });
    var result = await sendMessage(to, message);
    res.json({ success: true, result: result });
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.post("/api/ai-suggest", async function(req, res) {
  try {
    var { getAiSuggestion } = require("./ai-helper");
    var { message, phone } = req.body;
    if (!message) return res.json({ error: "Missing message" });
    var suggestion = await getAiSuggestion(message, phone, redis);
    if (suggestion) res.json({ suggestion: suggestion });
    else res.json({ error: "AI unavailable" });
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.listen(PORT, function() {
  console.log("\n✅ SOLOMON v17.0 MODULAR — 3 FILES");
  console.log("   ✓ Listening on port " + PORT);
  console.log("\n📡 Webhook ready at /webhook\n");
});
