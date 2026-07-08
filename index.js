const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
const P = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, printQRInTerminal: false });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, qr }) => {
    if (qr) { qrcode.generate(qr, {small:true}); console.log('\nSCAN QR WITH +27 60 507 4461\n'); }
    if (connection === 'open') console.log('✅ Solomon AI LIVE');
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();
    const from = msg.key.remoteJid;

    if (/^(hi|hello|hey)$/.test(body)) {
      await sock.sendMessage(from, { text: `Hey! Solomon's Rice on a Colour 👋\n\n1️⃣ Menu\n2️⃣ Hours\n3️⃣ Order\n4️⃣ Location` });
      return;
    }
    for (const item of faq) {
      if (item.keywords.some(k => body.includes(k))) {
        await sock.sendMessage(from, { text: item.answer });
        return;
      }
    }
  });
}
start();

const app = express();
app.get('/', (_, res) => res.send('OK'));
app.listen(process.env.PORT || 10000);
