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

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer-core');

const chromePaths = [
  process.env.CHROME_PATH || '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chrome'
];

let chromePath = chromePaths.find(p => {
  try {
    require('fs').accessSync(p, require('fs').constants.X_OK);
    return true;
  } catch { return false; }
});

console.log('Chrome path found:', chromePath || 'NOT FOUND - will use default');

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

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: chromePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('\nSCAN THIS QR CODE WITH WHATSAPP:');
  qrcode.generate(qr, { small: true });
  console.log('\n');
});

client.on('ready', () => {
  console.log('WhatsApp client ready!');
  console.log('Bot is now online and receiving messages.');
});

client.on('auth_failure', (msg) => {
  console.error('Auth failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

client.on('message', async (message) => {
  try {
    if (message.from.includes('@g.us')) return;
    if (message.from === 'status@broadcast') return;

    const from = message.from;
    const text = message.body?.trim();
    const isImage = message.hasMedia && message.type === 'image';

    if (isImage) {
      try {
        await sendMessage(from, 'Thanks! Your photo has been forwarded to Ridhor (076 760 4350). He will get back to you shortly.');
        await client.sendMessage(PERSONAL_NUMBER + '@c.us', 'Image from ' + from);
        const media = await message.downloadMedia();
        if (media) {
          await client.sendMessage(PERSONAL_NUMBER + '@c.us', media);
        }
        return;
      } catch (e) {
        console.error('Image error:', e.message);
        await sendMessage(from, 'Could not process image. Please send again or contact Ridhor directly.');
        return;
      }
    }

    if (!text) return;

    console.log('Message from ' + from + ': ' + text);

    let session = await getSession(from);
    let reply = await handleMessage(text, from, session, smartMatchFn, QR, getOrderRef, saveSession);

    if (isAfterHours()) {
      const showClosed = Math.floor(Math.random() * 4) === 0;
      if (showClosed) {
        reply = reply + '\n\nOur workshop is closed (Mon-Thurs 8AM-4:45PM, Fri 8AM-2:45PM). But I can still help!';
      }
    }

    await sendMessage(from, reply);

    session.history = session.history || [];
    session.history.push({ role: "user", content: text }, { role: "model", content: reply });
    if (session.history.length > 40) session.history = session.history.slice(-20);
    await saveSession(from, session);

    if (/complaint|problem|unhappy|angry|furious|refund/.test(text)) {
      try {
        await client.sendMessage(PERSONAL_NUMBER + '@c.us', 'Complaint from ' + from + ': ' + text);
      } catch(e) {}
    } else if (/speak.*ridhor|talk.*ridhor|technical|owner|boss/.test(text)) {
      try {
        await client.sendMessage(PERSONAL_NUMBER + '@c.us', 'Customer ' + from + ' wants to talk: ' + text);
      } catch(e) {}
    }

  } catch (error) {
    console.error('Message error:', error.message);
  }
});

client.initialize();

app.get("/health", function(req, res) { 
  res.json({ status: "healthy", version: "17.0", arch: "modular-3file" }); 
});

app.get("/", function(req, res) { 
  res.json({ 
    service: "Solomon Coatings", 
    version: "17.0 - Modular 3-File", 
    modules: ["index.js", "bot-core.js", "bot-content.js"],
    whatsapp: client.info ? "Connected" : "Connecting..."
  }); 
});

app.get("/webhook", function(req, res) {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VT) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

app.post("/webhook", validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
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
          chats.push({
            phone: p,
            lastMsg: lastMsg,
            time: session.lastUpdated || session.createdAt || ""
          });
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

    var { sendMessage } = require("./queue");
    var result = await sendMessage(to, message);

    var { getSession, saveSession } = require("./db");
    var session = await getSession(to);
    if (!session.history) session.history = [];
    session.history.push({ role: "model", content: message });
    if (session.history.length > 40) session.history = session.history.slice(-20);
    await saveSession(to, session);

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
  console.log("\nSOLOMON v17.0 MODULAR — 3 FILES");
  console.log("   index.js    (server + wiring)");
  console.log("   bot-core.js (logic + flows)");
  console.log("   bot-content.js (menu + gallery + socials)");
  console.log("   Listening on port " + PORT);
  console.log("\nWaiting for WhatsApp QR code...\n");
});

async function forwardImageToOwner(imageId, fromNumber) {
  try {
    if (!WA_TOKEN || !PHONE_ID) return false;
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "image", image: { id: imageId } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    await axios.post("https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      { messaging_product: "whatsapp", recipient_type: "individual", to: PERSONAL_NUMBER, type: "text", text: { body: "Image from " + fromNumber } },
      { headers: { Authorization: "Bearer " + WA_TOKEN } });
    return true;
  } catch (e) {
    console.error("[forwardImage] error:", e.response?.data || e.message);
    return false;
  }
}
