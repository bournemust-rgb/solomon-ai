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
    browser: ['Solomon', 'Chrome', '120']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      latestQR = await QRCode.toDataURL(qr);
      console.log('QR ready at /qr');
    }
    if (connection === 'open') {
      console.log('✅ CONNECTED');
      latestQR = '';
    }
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) {
      setTimeout(startSolomon, 5000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    if (from.endsWith('@g.us')) return;

    const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase();
    const name = msg.pushName || 'there';

    if (/^(hi|hello|menu)/.test(text)) {
      await sock.sendMessage(from, { text: `Hey ${name}! Solomon's Rice on a Colour 🍛\n\nMenu: R35\nHours: 9AM-7PM\nOrder: 060 507 4461` });
    }
  });
}

startSolomon();

const app = express();
app.get('/', (req, res) => res.send('Solomon AI Running'));
app.get('/qr', (req, res) => {
  if (!latestQR) return res.send('<h1>Already connected or waiting...</h1><meta http-equiv="refresh" content="3">');
  res.send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column"><h2>Scan with +27 60 507 4461</h2><img src="${latestQR}" width="300"><script>setTimeout(()=>location.reload(),5000)</script></body></html>`);
});

app.listen(process.env.PORT || 10000);
