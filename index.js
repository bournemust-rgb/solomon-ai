const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const express = require('express');
const P = require('pino');

// Load FAQ
const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

async function startSolomon() {
  const { version } = await fetchLatestBaileysVersion();
  console.log(`Using WhatsApp version: ${version.join('.')}`);

  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Solomon AI', 'Chrome', '120.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log(`Connection closed. Status: ${statusCode}`);

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('Reconnecting in 5 seconds...');
        setTimeout(startSolomon, 5000);
      }
    }

    if (connection === 'connecting') {
      // Request pairing code when connecting for first time
      if (!state.creds.registered) {
        setTimeout(async () => {
          try {
            const code = await sock.requestPairingCode('27605074461');
            console.log('\n========================================');
            console.log('PAIRING CODE FOR WHATSAPP');
            console.log('========================================');
            console.log(`CODE: ${code}`);
            console.log('Phone: +27 60 507 4461');
            console.log('WhatsApp > Settings > Linked Devices');
            console.log('> Link with phone number > Enter code');
            console.log('========================================\n');
          } catch (e) {
            console.log('Could not get pairing code:', e.message);
          }
        }, 3000);
      }
    }

    if (connection === 'open') {
      console.log('✅ SUCCESS: Solomon AI is connected to WhatsApp');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    if (from.endsWith('@g.us')) return;

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();
    const name = msg.pushName || 'there';

    if (/^(hi|hello|hey|hola|sawubona|molo|menu|start)$/i.test(text)) {
      await sock.sendMessage(from, {
        text: `Hey ${name}! 👋 *Solomon's Rice on a Colour*\n\n🍛 *MENU*\n• Rice on a Colour - R35\n• Extra Meat - R15\n• Cold Drink - R15\n\n⏰ *HOURS:* Mon-Sat 9AM-7PM\n📍 *LOCATION:* Cape Town\n📞 *ORDER:* 060 507 4461\n\nReply:\n1️⃣ Menu\n2️⃣ Hours\n3️⃣ Order\n4️⃣ Location`
      });
      return;
    }

    for (const item of faq) {
      if (item.keywords.some(k => text.includes(k.toLowerCase()))) {
        await sock.sendMessage(from, { text: item.answer });
        return;
      }
    }

    if (text.length > 2) {
      await sock.sendMessage(from, {
        text: `Thanks ${name}! Type "menu" for menu or call 060 507 4461.`
      });
    }
  });
}

startSolomon();

// Web server for Render
const app = express();
app.get('/', (req, res) => {
  res.send('Solomon AI WhatsApp Bot is Running ✅');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});
