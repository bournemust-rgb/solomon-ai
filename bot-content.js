// ============================================================
// bot-content.js - SOLOMON COATINGS BOT CONTENT
// ============================================================

function buildMenu(officeNumber, officeEmail, quoteEmail, facebook, tiktok, googleReview, termsUrl) {
  return `
🤖 *SOLOMON COATINGS - MAIN MENU*

1️⃣ *QUOTE* - Get a price estimate
2️⃣ *COLOURS* - View our colour gallery
3️⃣ *GALLERY* - See our work
4️⃣ *ABOUT* - Learn about us
5️⃣ *CONTACT* - Get in touch
6️⃣ *DELIVERY* - Delivery info
7️⃣ *HOURS* - Business hours
8️⃣ *TERMS* - Terms & conditions
9️⃣ *FAQ* - Frequently asked questions
🔟 *SOCIAL* - Follow us
1️⃣1️⃣ *REVIEW* - Leave a review
1️⃣2️⃣ *TPS* - Truth Bombs

📞 Call Ridhor: 076 760 4350
📧 Email: infosc@mweb.co.za
🏠 5 Jakaranda Street, Blackheath

Type the number or keyword.`;
}

function getGalleryMenu() {
  return `🎨 *COLOUR GALLERY*

We have 20+ colours available:

⚫ Black
⚪ White
🔘 Grey
🔘 Charcoal
🔘 Silver
🔴 Red
🔵 Blue
🟢 Green
🟡 Yellow
🟠 Orange
🟣 Purple
🩷 Pink
🟤 Brown
🟤 Beige
🟤 Cream

💡 *TEXTURED FINISHES:*
- Wrinkle
- Hammer tone
- Vein patterns

✨ *SPECIALTY:*
- Metallic
- Pearl
- Candy colours
- RAL matches

Send *quote* for pricing or ask Ridhor!`;
}

function getColorResponse(color) {
  return `🎨 *${color.charAt(0).toUpperCase() + color.slice(1)}* is available!

We have ${color} in:
- Gloss finish
- Satin finish  
- Matte finish
- Textured finish

Price: R20/kg (premium colour)
Minimum charge: R250

📞 WhatsApp Ridhor: 076 760 4350`;
}

function getSocialsResponse(facebook, tiktok) {
  return `📱 *FOLLOW US*

📘 Facebook: ${facebook || 'https://www.facebook.com/SolomonCoatings/'}
🎵 TikTok: ${tiktok || 'https://www.tiktok.com/@solomon.coatings'}

We post:
✅ Before/after shots
✅ New colours
✅ Special offers
✅ Customer projects

Follow us and tag us in your projects!`;
}

module.exports = {
  buildMenu,
  getGalleryMenu,
  getColorResponse,
  getSocialsResponse
};
