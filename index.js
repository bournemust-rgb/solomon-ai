const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const express = require('express');
const faq = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

// This is the EXACT path from your last successful install
const CHROME_PATH = '/opt/render/.cache/puppeteer/chrome/linux-127.0.6533.88/chrome-linux64/chrome';

console.log('Using Chrome:', CHROME_PATH);

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: { 
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote','--single-process']
  }
});

client.on('qr', qr => { 
  qrcode.generate(qr, {small:true}); 
  console.log('\n\nSCAN QR WITH +27 60 507 4461\n\n'); 
});

client.on('ready', () => console.log('✅ Solomon AI LIVE'));

client.on('message', async msg => {
  const chat = await msg.getChat();
  if (chat.isGroup) return;
  const body = msg.body.toLowerCase().trim();
  const name = msg._data.notifyName || 'there';
  
  if (/^(hi|hello|hey)$/.test(body)) {
    return msg.reply(`Hey ${name}! Solomon's Rice on a Colour. Reply:\n1 menu\n2 hours\n3 order\n4 location`);
  }
  
  for (const item of faq) {
    if (item.keywords.some(k => body.includes(k))) {
      return msg.reply(item.answer);
    }
  }
});

client.initialize();

const app = express();
app.get('/', (req,res)=>res.send('ok'));
app.listen(process.env.PORT||10000);
