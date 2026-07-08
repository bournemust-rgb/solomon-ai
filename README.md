
# Solomon WhatsApp AI — ALIVE Bot

Built for Ridhor Hendricks / Solomon Coatings. Unique hybrid, not a copy-paste template.

## What makes it different
- Fuzzy FAQ that catches typos like "rice on ac olour"
- Alive personality with Cape Town slang, remembers users
- Replies to EVERYTHING: FAQ first, then intelligent fallback
- Runs on WhatsApp Web — uses YOUR number 27767604350, no Meta tokens
- Cloud-ready: deploy to Render.com free, PC can be off

## Files
- index.js — brain
- faq.json — edit your answers here
- package.json

## Deploy to Render (free, PC-off)
1. Push this folder to GitHub
2. Render.com > New Web Service > Connect repo
3. Build: npm install
4. Start: npm start
5. First deploy: open Logs, scan QR with WhatsApp
6. Done — bot lives in cloud

## Train it
Edit faq.json, add:
{"q":"your question keywords","a":"your answer"}
Redeploy — no code change needed.
