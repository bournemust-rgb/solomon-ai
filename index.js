const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const express = require('express');
const P = require('pino');

const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));
let latestQR = '';

async function startSolomon() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');

  const sock = makeWASocket({
    version,
    logger: P({ level: 'silent' }),
    auth: state,
    browser: ['Solomon', 'Chrome', '120'],
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, qr }) => {
    if (qr) latestQR = await QRCode.toDataURL(qr);
    if (connection === 'open') {
      console.log('✅ CONNECTED - listening for messages');
      latestQR = '';
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    console.log('MESSAGE RECEIVED:', JSON.stringify(m.messages[0]?.message));
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();

    console.log(`From ${from}: ${text}`);

    // ALWAYS reply to test
    await sock.sendMessage(from, { text: `Got it! You said: "${text}". Solomon's Rice is R35. Type MENU for full menu.` });
  });
}

startSolomon();

const app = express();
app.get('/qr', (req,res) => res.send(latestQR? `<img src="${latestQR}">` : 'Connected'));
app.listen(process.env.PORT || 10000);
