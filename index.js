require('dotenv').config();
const express = require('express');
const { validateWhatsAppSignature } = require('./security');
const { getSession, saveSession } = require('./db');
const { processMessage } = require('./brain');
const { sendMessage, sendAcknowledgment } = require('./queue');
const { KNOWLEDGE } = require('./knowledge');

const app = express();
app.use(express.json({ verify: function(req, res, buf) { req.rawBody = buf.toString('utf8'); } }));

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'solomon_coatings_1988';
const PORT = process.env.PORT || 3000;

const QUICK_RESPONSES = {
  'hi': "Goeie dag! Solomon Coatings - since 1988. What can I help with?",
  'hello': "Hello! Solomon Coatings. What can I help with?",
  'hey': "Howzit! What can I do for you?",
  'howzit': "Howzit! What can I do for you?",
  'menu': "SOLOMON COATINGS\n\nPowder Coating - all colours\nSandblasting\nPre-treatment\n\nPRICES:\nRims: R400-R600 each\nSmall parts: R100-R250\nGates: R1,500-R3,500\nChassis: R3,000-R8,000\nMin job: R250\n\nMon-Fri 8AM-5PM\n060 507 4461\n\nWhat are you looking to coat?",
  'pricing': "BALLPARK PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1,500-R3,500\nChassis: R3,000-R8,000\nSandblasting: R300-R600/hr\nMinimum: R250\n\nWhat are you interested in?",
  'price': "BALLPARK PRICING\nRims: R400-R600/ea\nSmall parts: R100-R250\nGates: R1,500-R3,500\nChassis: R3,000-R8,000\nMinimum: R250",
  'colours': "COLOURS & FINISHES\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\nWe match RAL codes. Most popular: Gloss Black & Satin Black.",
  'colors': "COLOURS & FINISHES\nStandard: Black, White, Silver, Grey, Charcoal, Red, Blue, Navy, Yellow, Green\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture",
  'hours': "Mon-Fri 8AM-5PM. Saturday by appointment.",
  'turnaround': "Standard: 3-5 working days. Large jobs: 1-2 weeks. Rush available.",
  'time': "Standard: 3-5 working days. Large jobs: 1-2 weeks.",
  'delivery': "R150 flat fee Cape Town metro. Free collection from workshop.",
  'contact': "Call 060 507 4461 or keep chatting here.",
  'help': "I can help with pricing, colours, turnaround, delivery, the process, or booking a callback from Ridhor. Just ask!",
  'thanks': "Pleasure! Anything else?",
  'thank you': "Only a pleasure!",
  'bye': "Cheers! Sien jou later."
};

app.get('/health', function(req, res) {
  res.json({ status: 'healthy', service: 'Solomon Coatings AI', established: 1988, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});
app.get('/', function(req, res) {
  res.json({ service: 'Solomon Coatings WhatsApp Bot', status: 'running' });
});

app.get('/webhook', function(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  console.warn('Webhook verification failed');
  res.sendStatus(403);
});

app.post('/webhook', validateWhatsAppSignature, async function(req, res) {
  res.sendStatus(200);
  try {
    const entries = req.body && req.body.entry ? req.body.entry : [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const messages = (change.value && change.value.messages) ? change.value.messages : [];
        for (const message of messages) {
          const from = message.from;
          const text = message.text && message.text.body ? message.text.body.trim() : null;
          if (!text) continue;
          console.log('[' + from + ']: "' + text + '"');
          const session = await getSession(from);
          const lower = text.toLowerCase().trim();
          if (QUICK_RESPONSES[lower]) {
            await sendMessage(from, QUICK_RESPONSES[lower]);
            session.history.push({ role: 'user', content: text }, { role: 'model', content: QUICK_RESPONSES[lower] });
            await saveSession(from, session);
            continue;
          }
          sendAcknowledgment(from);
          const aiResponse = await processMessage(text, session.history || []);
          await sendMessage(from, aiResponse);
          session.history.push({ role: 'user', content: text }, { role: 'model', content: aiResponse });
          await saveSession(from, session);
        }
      }
    }
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

app.listen(PORT, function() {
  console.log('');
  console.log('SOLOMON COATINGS AI v2.0 - Port ' + PORT);
  console.log('HMAC: ' + (process.env.WHATSAPP_APP_SECRET ? 'ENABLED' : 'DISABLED'));
  console.log('Redis: ' + (process.env.UPSTASH_REDIS_URL || process.env.UPSTASH_REDIS_HOST ? 'CONFIGURED' : 'NOT SET'));
  console.log('Gemini: ' + (process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT SET'));
  console.log('');
});

process.on('unhandledRejection', function(r) { console.error('Unhandled:', r); });
process.on('uncaughtException', function(e) { console.error('Uncaught:', e); });
