const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: { 
    headless: true, 
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
  }
});

client.on('qr', qr => { 
  qrcode.generate(qr, {small:true}); 
  console.log('SCAN QR ABOVE WITH +27 60 507 4461'); 
});

client.on('ready', () => console.log('✅ Solomon AI is LIVE on WhatsApp +27 60 507 4461'));

client.on('message', async msg => {
  const chat = await msg.getChat();
  if (chat.isGroup) return;
  
  const body = msg.body.toLowerCase().trim();
  const name = msg._data.notifyName || 'there';
  
  // Greeting
  if (/^(hi|hello|hey|hola|sawubona|molo)$/i.test(body)) {
    return msg.reply(`Hey ${name}! 👋 Solomon's Rice on a Colour here. What you need?\n\n1️⃣ Menu & prices\n2️⃣ Hours\n3️⃣ Order now\n4️⃣ Location`);
  }
  
  // FAQ matching
  for (const item of faq) {
    if (item.keywords.some(k => body.includes(k))) {
      return msg.reply(item.answer);
    }
  }
  
  // Default
  if (body.length > 2) {
    msg.reply(`Thanks ${name}! For orders call 060 507 4461 or reply:\n• "menu"\n• "hours"\n• "location"\n• "order"`);
  }
});

client.initialize();

// Keep alive for Render
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Solomon AI running'));
app.listen(process.env.PORT || 3000);
