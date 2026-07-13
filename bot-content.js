// ============================================
// BOT-CONTENT: QR Menu, Socials, Gallery, Terms
// ============================================

function getSocialsResponse(FACEBOOK, TIKTOK) {
  return "🌐 FOLLOW SOLOMON COATINGS!\n\n📱 Facebook\n" + FACEBOOK + "\n\n🎵 TikTok\n" + TIKTOK + "\n\n🌐 Website\nhttps://solomoncoatings.co.za\n\nSee our latest projects, before/after photos, and coating tips!\n\nType *menu* to go back.";
}

var GALLERY_COLORS = [
  { id: "1", name: "🔴 Red", images: ["https://solomon-ai-izyb.onrender.com/photos/red-gloss-001.jpg", "https://solomon-ai-izyb.onrender.com/photos/red-gloss-002.jpg"] },
  { id: "2", name: "🟡 Yellow", images: ["https://solomon-ai-izyb.onrender.com/photos/yellow-001.jpg"] },
  { id: "3", name: "🟢 Green", images: ["https://solomon-ai-izyb.onrender.com/photos/green-001.jpg"] },
  { id: "4", name: "🔵 Blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-001.jpg"] },
  { id: "5", name: "💙 Light Blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-light-001.jpg"] },
  { id: "6", name: "🟦 Dark Blue", images: ["https://solomon-ai-izyb.onrender.com/photos/blue-dark-001.jpg"] },
  { id: "7", name: "⬛ Black", images: ["https://solomon-ai-izyb.onrender.com/photos/black-gloss-001.jpg", "https://solomon-ai-izyb.onrender.com/photos/black-gloss-002.jpg"] },
  { id: "8", name: "⚫ Matt Black", images: ["https://solomon-ai-izyb.onrender.com/photos/black-matte-001.jpg"] },
  { id: "9", name: "🔨 Hammered Black", images: ["https://solomon-ai-izyb.onrender.com/photos/hammered-black-001.jpg"] },
  { id: "10", name: "⚪ White", images: ["https://solomon-ai-izyb.onrender.com/photos/white-001.jpg"] },
  { id: "11", name: "🩶 Grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-001.jpg"] },
  { id: "12", name: "🌫️ Dark Grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-dark-001.jpg"] },
  { id: "13", name: "☁️ Light Grey", images: ["https://solomon-ai-izyb.onrender.com/photos/grey-light-001.jpg"] },
  { id: "14", name: "🟤 Brown", images: ["https://solomon-ai-izyb.onrender.com/photos/brown-001.jpg"] },
  { id: "15", name: "🥉 Bronze", images: ["https://solomon-ai-izyb.onrender.com/photos/bronze-001.jpg"] },
  { id: "16", name: "✨ Charcoal", images: ["https://solomon-ai-izyb.onrender.com/photos/charcoal-001.jpg", "https://solomon-ai-izyb.onrender.com/photos/charcoal-002.jpg"] },
  { id: "17", name: "🟪 Purple", images: ["https://solomon-ai-izyb.onrender.com/photos/purple-001.jpg"] },
  { id: "18", name: "🌅 Orange", images: ["https://solomon-ai-izyb.onrender.com/photos/orange-001.jpg"] },
  { id: "19", name: "🎨 Silver", images: ["https://solomon-ai-izyb.onrender.com/photos/silver-001.jpg"] },
  { id: "20", name: "🥇 Gold", images: ["https://solomon-ai-izyb.onrender.com/photos/gold-001.jpg"] }
];

function getGalleryMenu(pageNumber) {
  pageNumber = pageNumber || 1;
  var itemsPerPage = 10;
  var totalPages = Math.ceil(GALLERY_COLORS.length / itemsPerPage);
  var startIdx = (pageNumber - 1) * itemsPerPage;
  var endIdx = Math.min(startIdx + itemsPerPage, GALLERY_COLORS.length);
  var pageItems = GALLERY_COLORS.slice(startIdx, endIdx);
  var menu = "🎨 COLOUR GALLERY - Page " + pageNumber + "/" + totalPages + "\n\n";
  for (var i = 0; i < pageItems.length; i++) {
    var cat = pageItems[i];
    var number = startIdx + i + 1;
    menu += number + ". " + cat.name + "\n";
  }
  if (pageNumber === 1 && totalPages > 1) menu += "\n➡️ Type *S2* for page 2.";
  else if (pageNumber === 2 && totalPages > 2) menu += "\n➡️ Type *S3* for page 3.";
  menu += "\n\n📌 Reply with *C* + number (e.g., *C1* for Red)\n\n🔗 View full gallery:\nhttps://drive.google.com/drive/folders/YOUR-FOLDER-ID\n\nType *menu* to go back.";
  return menu;
}

function getColorResponse(colorId) {
  var category = GALLERY_COLORS.find(function(cat) { return cat.id === String(colorId); });
  if (!category) return "Sorry, that colour not found. Type *gallery* to see all colours.";
  var msg = category.name + "\n\n";
  for (var i = 0; i < category.images.length; i++) {
    msg += "📸 Example " + (i + 1) + ":\n" + category.images[i] + "\n\n";
  }
  msg += "Want this colour? Type: quote 20kg gate\n\nType *menu* to go back.";
  return msg;
}

function buildMenu(OFFICE_NUMBER, OFFICE_EMAIL, QUOTE_EMAIL, FACEBOOK, TIKTOK, GOOGLE_REVIEW, TERMS_URL) {
  var QR = {
    "menu": "SOLOMON COATINGS - Since 1988\n\n1.Pricing\n2.Colours\n3.Quote\n4.Turnaround\n5.Hours\n6.Delivery\n7.Blasting\n8.T&Cs\n9.GALLERY (20+ colours)\n10.Follow Us\n11.Review\n12.Callback\n13.Ridhor\n14.Accounts\n15.TPS Wisdom\n\nOr just tell me what you need priced.",
    "pricing": "PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nFor a calculated estimate: quote 20kg gate black",
    "colours": "Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\n\nType *gallery* to see 20+ colour examples!",
    "hours": "Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
    "turnaround": "Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
    "delivery": "R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
    "1": "PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99",
    "2": "COLOURS\nStandard: Black, White, Brown, Bronze, Charcoal\nHammered: R225+\nMetallic/Custom/RAL: R300+\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone\n\nType *gallery* for examples!",
    "3": "Send: quote 20kg gate charcoal | quote 4 rims metallic | quote 10sqm sheet black | quote 20kg blasting only",
    "4": "TURNAROUND\nUnder 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
    "5": "BUSINESS HOURS\nMon-Thurs: 8AM-4:45PM\nFri: 8AM-2:45PM\nClosed weekends.",
    "6": "DELIVERY & COLLECTION\nR150 metro. Free collection. Collect within 7 days. Late: 7% daily storage.",
    "7": "BLASTING SERVICES\nR8-R12/kg. Truck R5,000-R7,500. Grit 0.12-0.4mm, 6 bar. Client risk. Remove plastic/glass.",
    "8": "TERMS & CONDITIONS\n\nCOD only. No coastal warranties (15km). 7% daily storage after 7 days. Items our property until paid.\n\nFull terms: " + TERMS_URL + "\n\nType *menu* to go back.",
    "9": "Type *gallery* to see 20+ colour examples with photos!",
    "10": getSocialsResponse(FACEBOOK, TIKTOK),
    "11": "REVIEW US\n" + GOOGLE_REVIEW,
    "12": "BOOK A CALLBACK\nSend name + number. Or call " + OFFICE_NUMBER,
    "13": "TALK TO RIDHOR\nWhatsApp: 076 760 4350 | Email: " + QUOTE_EMAIL,
    "14": "ACCOUNT QUERIES\nEmail: " + OFFICE_EMAIL + " | Phone: " + OFFICE_NUMBER,
    "15": "TPS Wisdom - Type *menu* to go back.",
    "thanks": "Pleasure! Anything else? Type *menu*",
    "thank you": "Only a pleasure! Type *menu* for more.",
    "bye": "Cheers! Sien jou later."
  };
  return QR;
}

module.exports = { getSocialsResponse, getGalleryMenu, getColorResponse, buildMenu };
