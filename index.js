
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Fuse = require('fuse.js');
const express = require('express');
const fs = require('fs');
const dayjs = require('dayjs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

let faq = JSON.parse(fs.readFileSync('./faq.json'));
const fuse = new Fuse(faq, { keys:['q'], threshold:0.4, includeScore:true });
const memory = {};

function solomonBrain(msg, from) {
  const text = msg.toLowerCase().trim();
  const user = memory[from] || {count:0};
  user.count++; user.lastSeen = Date.now(); memory[from]=user;
  const found = fuse.search(text)[0];
  if(found && found.score < 0.4) return `*Solomon AI* (+27 60 507 4461) 🤖\n${found.item.a}\n\n_Ask me anything — prices, colours, how-to._`;
  if(/hi|hello|howzit|hola/.test(text)){
    const hour = dayjs().hour();
    const greet = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
    return `${greet}! It's Solomon Coatings AI 🇿🇦\nI'm alive on +27 60 507 4461. Ask: "price epoxy", "open times", or just chat.`;
  }
  if(/time|open|close/.test(text)) return faq[0].a;
  if(/weather|rain/.test(text)) return "Cape Town today — typical! Bring a jacket, paint inside 😉 Want indoor coating tips?";
  const replies = [
    `Sharp! I didn't find that in my FAQ, but I know coatings. Tell me more about '${msg}' — garage, roof, or factory?`,
    `I'm Solomon AI, built different. We coat floors, roofs, steel. What project you tackling?`,
    `Good question. While I check, quick tip: prep is 80% of a good coating. Need my prep checklist?`,
  ];
  return replies[Math.floor(Math.random()*replies.length)];
}

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: { 
    headless: true, 
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'],
   executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  }
});

client.on('qr', qr => { qrcode.generate(qr, {small:true}); console.log('SCAN QR ABOVE WITH +27 60 507 4461'); });
client.on('ready', () => console.log('✅ Solomon AI is LIVE on WhatsApp +27 60 507 4461'));
client.on('message', async msg => {
  if(msg.fromMe) return;
  const chat = await msg.getChat(); chat.sendStateTyping();
  const reply = solomonBrain(msg.body||'', msg.from);
  setTimeout(()=> msg.reply(reply), 900);
});
client.initialize();

app.get('/', (req,res)=> res.send('Solomon WhatsApp AI running'));
app.listen(PORT, ()=> console.log('Web on', PORT));
cron.schedule('0 3 * * *', ()=> { for(const k in memory) if(Date.now()-memory[k].lastSeen>604800000) delete memory[k]; });
