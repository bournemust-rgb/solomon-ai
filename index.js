const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const P = require('pino');

// Load FAQ
const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

async function startSolomon() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Solomon AI', 'Chrome', '120.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n');
      console.log('========================================');
      console.log('SCAN THIS QR CODE WITH WHATSAPP');
      console.log('Phone: +27 60 507 4461');
      console.log('========================================');
      qrcode.generate(qr, { small: true });
      console.log('========================================\n');
    }

    if (connection === 'open') {
      console.log('✅ SUCCESS: Solomon AI is connected to WhatsApp');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log(`Connection closed. Reason: ${reason}`);
      
      if (reason !== DisconnectReason.loggedOut) {
        console.log('Reconnecting in 5 seconds...');
        setTimeout(startSolomon, 5000);
      } else {
        console.log('Logged out. Delete session folder and restart.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const from = msg.key.remoteJid;
    if (from.endsWith('@g.us')) return; // Skip groups

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();
    const name = msg.pushName || 'there';

    // Greeting
    if (/^(hi|hello|hey|hola|sawubona|molo|menu|start)$/i.test(text)) {
      await sock.sendMessage(from, {
        text: `Hey ${name}! 👋 *Solomon's Rice on a Colour*\n\n🍛 *MENU*\n• Rice on a Colour - R35\n• Extra Meat - R15\n• Cold Drink - R15\n\n⏰ *HOURS:* Mon-Sat 9AM-7PM\n📍 *LOCATION:* Cape Town\n📞 *ORDER:* 060 507 4461\n\nReply:\n1️⃣ Menu\n2️⃣ Hours\n3️⃣ Order\n4️⃣ Location`
      });
      return;
    }

    // Check FAQ
    for (const item of faq) {
      if (item.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        await sock.sendMessage(from, { text: item.answer });
        return;
      }
    }

    // Default response
    if (text.length > 2 && !text.includes('reconnecting')) {
      await sock.sendMessage(from, {
        text: `Thanks ${name}! Type "menu" for our menu, or call 060 507 4461 to order directly.`
      });
    }
  });
}

startSolomon();

// Keep Render alive
const app = express();
app.get('/', (req, res) => {
  res.send('Solomon AI WhatsApp Bot is Running ✅');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
