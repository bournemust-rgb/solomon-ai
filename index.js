const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const P = require('pino');

const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    auth: state,
    browser: ['Solomon AI', 'Chrome', '1.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log('\n');
      qrcode.generate(qr, { small: true });
      console.log('\n>>> SCAN WITH WHATSAPP +27 60 507 4461 <<<\n');
    }
    if (connection === 'open') {
      console.log('✅ Solomon AI CONNECTED');
    }
    if (connection === 'close') {
      console.log('Reconnecting...');
      start();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    if (jid.endsWith('@g.us')) return; // ignore groups

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();
    const name = msg.pushName || 'there';

    // Greeting
    if (/^(hi|hello|hey|hola|sawubona|molo|menu)$/.test(text)) {
      await sock.sendMessage(jid, {
        text: `Hey ${name}! 👋 Welcome to *Solomon's Rice on a Colour*\n\n📋 *MENU:*\n• Rice on a Colour - R35\n• Extra meat - R15\n• Drink - R15\n\n⏰ Hours: Mon-Sat 9am-7pm\n📍 Location: Cape Town\n📞 Order: 060 507 4461\n\nReply: 1 for menu, 2 for hours, 3 to order`
      });
      return;
    }

    // Check FAQ
    for (const item of faq) {
      if (item.keywords.some(k => text.includes(k))) {
        await sock.sendMessage(jid, { text: item.answer });
        return;
      }
    }

    // Default
    if (text.length > 1) {
      await sock.sendMessage(jid, {
        text: `Thanks ${name}! For menu type "menu", hours type "hours", or call 060 507 4461 to order.`
      });
    }
  });
}

start();

// Keep Render alive
const app = express();
app.get('/', (req, res) => res.send('Solomon AI is running'));
app.listen(process.env.PORT || 10000, () => console.log('Web server on port 10000'));
