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

// ============================================================
// WHATSAPP WEB CLIENT (QR CODE METHOD) - NO META WEBHOOKS
// ============================================================
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer-core');

// Find Chrome/Chromium path
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

console.log('🔍 Chrome path found:', chromePath || 'NOT FOUND - will use default');

// ============================================================
// EXPRESS APP
// ============================================================
var app = express();
app.use(express.static("public"));
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString("utf8"); } }));

// ============================================================
// CONFIG
// ============================================================
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

// ============================================================
// WHATSAPP WEB CLIENT - INITIALIZE
// ============================================================
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

// QR CODE GENERATION
client.on('qr', (qr) => {
  console.log('\n📱 SCAN THIS QR CODE WITH WHATSAPP:');
  qrcode.generate(qr, { small: true });
  console.log('\n');
});

// CLIENT READY
client.on('ready', () => {
  console.log('✅ WhatsApp client ready!');
  console.log('Bot is now online and receiving messages.');
});

// AUTHENTICATION FAILURE
client.on('auth_failure', (msg) => {
  console.error('❌ Auth failed:', msg);
});

// DISCONNECTED
client.on('disconnected', (reason) => {
  console.log('⚠️ Disconnected:', reason);
});

// INCOMING MESSAGES
client.on('message', async (message) => {
  try {
    // Skip if from group or bot itself
    if (message.from.includes('@g.us')) return;
    if (message.from === 'status@broadcast') return;
    
    const from = message.from;
    const text = message.body?.trim();
    const isImage = message.hasMedia && message.type === 'image';
    
    // Handle images
    if (isImage) {
      try {
        await sendMessage(from, '📸 Thanks! Your photo has been forwarded to Ridhor (076 760 4350). He will get back to you shortly.');
        // Forward to Ridhor
        await client.sendMessage(PERSONAL_NUMBER + '@c.us', `📸 Image from ${from}`);
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
