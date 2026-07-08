const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');
const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

console.log('🔍 Using Chrome at:', puppeteer.executablePath());

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: { 
    headless: true,
    executablePath: puppeteer.executablePath(),
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--single-process']
  }
});

client.on('qr', qr => { 
  qrcode.generate(qr, {small:true}); 
  console.log('\n\nSCAN THIS QR WITH +27 60 507 4461\n\n'); 
});

client.on('ready', () => console.log('✅ Solomon AI is LIVE'));

client.on('message', async msg => {
  const chat = await msg.getChat();
  if (chat.isGroup) return;
  const body = msg.body.toLowerCase().trim();
  const name = msg._data.notifyName || 'there';
  
  if (/^(hi|hello|hey|hola|sawubona|molo)$/.test(body)) {
    return msg.reply(`Hey ${name}! 👋 Solomon's Rice on a Colour here.\n\n1️⃣ Menu & prices\n2️⃣ Hours\n3️⃣ Order now\n4️⃣ Location`);
  }
  
  for (const item of faq) {
    if (item.keywords.some(k => body.includes(k))) {
      return msg.reply(item.answer);
    }
  }
  
  if (body.length > 2) {
    msg.reply(`Thanks ${name}! Reply "menu", "hours", "location" or "order". Call 060 507 4461`);
  }
});

client.initialize();

const app = express();
app.get('/', (req, res) => res.send('Solomon AI running'));
app.listen(process.env.PORT || 10000);
