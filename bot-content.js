// bot-content.js
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
         "🔟 *SOCIAL* - Follow us\n\n" +
         "📞 Call Ridhor: 076 760 4350\n" +
         "📧 Email: infosc@mweb.co.za\n\n" +
         "Type the number or keyword.";
}

function getGalleryMenu() {
  return "🎨 *COLOUR GALLERY*\n\n" +
         "20+ colours: Black, White, Grey, Charcoal, Silver, Red, Blue, Green, Yellow, Orange, Purple, Pink, Brown, Beige, Cream\n\n" +
         "Textured: Wrinkle, Hammer tone, Vein\n" +
         "Specialty: Metallic, Pearl, Candy, RAL matches\n\n" +
         "Send *quote* for pricing!";
}

function getColorResponse(color) {
  return "🎨 *" + color + "* available!\n\n" +
         "Gloss, Satin, Matte, Textured finishes\n" +
         "Price: R20/kg (premium)\n" +
         "Min charge: R250\n\n" +
         "📞 Ridhor: 076 760 4350";
}

function getSocialsResponse() {
  return "📱 *FOLLOW US*\n\n" +
         "📘 fb.me/SolomonCoatings\n" +
         "🎵 tiktok.com/@solomon.coatings\n\n" +
         "Tag us in your projects!";
}

module.exports = { buildMenu, getGalleryMenu, getColorResponse, getSocialsResponse };
