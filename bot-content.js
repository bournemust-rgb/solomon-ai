// ============================================================
// bot-content.js - SOLOMON COATINGS BOT CONTENT
// ============================================================

function buildMenu() {
  return "🤖 *SOLOMON COATINGS - MAIN MENU*\n\n" +
         "1️⃣ *QUOTE* - Get a price estimate\n" +
         "2️⃣ *COLOURS* - View our colour gallery\n" +
         "3️⃣ *GALLERY* - See our work\n" +
         "4️⃣ *ABOUT* - Learn about us\n" +
         "5️⃣ *CONTACT* - Get in touch\n" +
         "6️⃣ *DELIVERY* - Delivery info\n" +
         "7️⃣ *HOURS* - Business hours\n" +
         "8️⃣ *TERMS* - Terms & conditions\n" +
         "9️⃣ *FAQ* - Frequently asked questions\n" +
         "🔟 *SOCIAL* - Follow us\n" +
         "1️⃣1️⃣ *REVIEW* - Leave a review\n" +
         "1️⃣2️⃣ *TPS* - Truth Bombs\n\n" +
         "📞 Call Ridhor: 076 760 4350\n" +
         "📧 Email: infosc@mweb.co.za\n" +
         "🏠 5 Jakaranda Street, Blackheath\n\n" +
         "Type the number or keyword.";
}

function getGalleryMenu() {
  return "🎨 *COLOUR GALLERY*\n\n" +
         "We have 20+ colours available:\n\n" +
         "⚫ Black\n" +
         "⚪ White\n" +
         "🔘 Grey\n" +
         "🔘 Charcoal\n" +
         "🔘 Silver\n" +
         "🔴 Red\n" +
         "🔵 Blue\n" +
         "🟢 Green\n" +
         "🟡 Yellow\n" +
         "🟠 Orange\n" +
         "🟣 Purple\n" +
         "🩷 Pink\n" +
         "🟤 Brown\n" +
         "🟤 Beige\n" +
         "🟤 Cream\n\n" +
         "💡 *TEXTURED FINISHES:*\n" +
         "- Wrinkle\n" +
         "- Hammer tone\n" +
         "- Vein patterns\n\n" +
         "✨ *SPECIALTY:*\n" +
         "- Metallic\n" +
         "- Pearl\n" +
         "- Candy colours\n" +
         "- RAL matches\n\n" +
         "Send *quote* for pricing or ask Ridhor!";
}

function getColorResponse(color) {
  return "🎨 *" + color.charAt(0).toUpperCase() + color.slice(1) + "* is available!\n\n" +
         "We have " + color + " in:\n" +
         "- Gloss finish\n" +
         "- Satin finish\n" +
         "- Matte finish\n" +
         "- Textured finish\n\n" +
         "Price: R20/kg (premium colour)\n" +
         "Minimum charge: R250\n\n" +
         "📞 WhatsApp Ridhor: 076 760 4350";
}

function getSocialsResponse(facebook, tiktok) {
  return "📱 *FOLLOW US*\n\n" +
         "📘 Facebook: https://www.facebook.com/SolomonCoatings/\n" +
         "🎵 TikTok: https://www.tiktok.com/@solomon.coatings\n\n" +
         "We post:\n" +
         "✅ Before/after shots\n" +
         "✅ New colours\n" +
         "✅ Special offers\n" +
         "✅ Customer projects\n\n" +
         "Follow us and tag us in your projects!";
}

module.exports = {
  buildMenu,
  getGalleryMenu,
  getColorResponse,
  getSocialsResponse
};
