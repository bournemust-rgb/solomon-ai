var fs = require("fs");
var content = fs.readFileSync("index.js", "utf8");

// Find the QR object start
var qrStart = content.indexOf('var QR = {');
var qrEnd = content.indexOf('"thanks":"Pleasure!');
if (qrEnd === -1) qrEnd = content.indexOf('"thank you":"Only');
if (qrEnd === -1) qrEnd = content.indexOf('"bye":"Cheers!');

var newQR = 'var QR = {\n' +
'  "menu":"WHAT I CAN DO - pick a number:\\n\\n1. Pricing\\n2. Colours\\n3. Quote estimate\\n4. Turnaround times\\n5. Business hours\\n6. Delivery & collection\\n7. Blasting services\\n8. T&Cs & warranties\\n9. Colour Gallery (30+ photos)\\n10. Socials (FB/TikTok/Web)\\n11. Leave a review\\n12. Book a callback\\n13. Talk to Ridhor\\n14. Account queries\\n15. TPS Daily Wisdom\\n\\nType *gallery* or *socials* anytime.\\n\\nOr just tell me what you need priced.",\n' +
'  "pricing":"PRICING (excl VAT)\\nRims: R1000-R1500/set\\nSheet: R175-R350/sqm\\nCoating: R16/kg B/W, R17-R20/kg premium\\nBlasting: R8-R12/kg\\nTruck: R5000-R7500\\nMin: R173.99\\n\\nType *menu* to go back.",\n' +
'  "colours":"COLOURS\\nStandard: Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\\nHammered: R225+\\nMetallic/Custom/RAL: R300+\\n\\nType *gallery* for 30+ colour photos!\\n\\nType *menu* to go back.",\n' +
'  "hours":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.\\n\\nType *menu* to go back.",\n' +
'  "turnaround":"Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.\\n\\nType *menu* to go back.",\n' +
'  "delivery":"R150 Cape Town metro. Free collection. 7% daily storage after 7 days.\\n\\nType *menu* to go back.",\n' +
'  "contact":"060 507 4461 | Office: "+OFFICE_NUMBER+" | Email: "+OFFICE_EMAIL+"\\n\\nType *menu* to go back.",\n' +
'  "1":"PRICING (excl VAT)\\nRims: R1000-R1500/set\\nSheet: R175-R350/sqm\\nCoating: R16/kg B/W, R17-R20/kg premium\\nBlasting: R8-R12/kg\\nTruck: R5000-R7500\\nMin: R173.99\\n\\nFor estimate: quote 20kg gate black\\n\\nType *menu* to go back.",\n' +
'  "2":"COLOURS\\nStandard: Black, White, Brown, Bronze, Charcoal\\nHammered: R225+\\nMetallic/Custom/RAL: R300+\\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture\\n\\nType *gallery* for photos!\\n\\nType *menu* to go back.",\n' +
'  "3":"QUOTE ESTIMATE\\nSend: quote 20kg gate charcoal | quote 4 rims metallic | quote 10sqm sheet black | quote 20kg blasting only\\n\\nType *menu* to go back.",\n' +
'  "4":"TURNAROUND\\nUnder 1 ton: 3 working days. Over 1 ton: 5-8 working days.\\n\\nType *menu* to go back.",\n' +
'  "5":"BUSINESS HOURS\\nMon-Thurs: 8AM-4:45PM\\nFri: 8AM-2:45PM\\nClosed weekends.\\n\\nType *menu* to go back.",\n' +
'  "6":"DELIVERY & COLLECTION\\nR150 metro. Free collection. Collect within 7 days. Late: 7% daily storage.\\n\\nType *menu* to go back.",\n' +
'  "7":"BLASTING SERVICES\\nR8-R12/kg. Truck R5,000-R7,500. Grit 0.12-0.4mm, 6 bar. Client risk.\\n\\nType *menu* to go back.",\n' +
'  "8":"TERMS\\nCOD only. No coastal warranties (15km). 7% daily storage. Items ours until paid.\\n\\nType *menu* to go back.",\n' +
'  "9":"COLOUR GALLERY\\n30+ colours with photos. Type *gallery* to browse.\\n\\nType *menu* to go back.",\n' +
'  "10":"SOCIALS\\nFacebook, TikTok, Website. Type *socials* for links.\\n\\nType *menu* to go back.",\n' +
'  "11":"REVIEW US\\n"+GOOGLE_REVIEW+"\\n\\nType *menu* to go back.",\n' +
'  "12":"BOOK A CALLBACK\\nSend name + number. Or call "+OFFICE_NUMBER+"\\n\\nType *menu* to go back.",\n' +
'  "13":"TALK TO RIDHOR\\nWhatsApp: 076 760 4350 | Email: "+QUOTE_EMAIL+"\\n\\nType *menu* to go back.",\n' +
'  "14":"ACCOUNT QUERIES\\nEmail: "+OFFICE_EMAIL+" | Phone: "+OFFICE_NUMBER+"\\n\\nType *menu* to go back.",\n' +
'  "15":"TPS DAILY WISDOM\\nType *tps* or *wisdom* for a daily quote from Tommy Phillip Solomon.\\n\\nType *menu* to go back.",\n' +
'  "thanks":"Pleasure! Anything else? Type *menu*",\n' +
'  "thank you":"Only a pleasure! Type *menu* for more.",\n' +
'  "bye":"Cheers! Sien jou later."\n' +
'};\n' +
'// END QR';

if (qrStart !== -1 && qrEnd !== -1) {
  var before = content.substring(0, qrStart);
  var after = content.substring(qrEnd);
  // Find the next }; after thanks to close the QR properly
  var realEnd = after.indexOf("};");
  if (realEnd !== -1) {
    after = after.substring(realEnd + 2);
  }
  var newContent = before + newQR + after;
  fs.writeFileSync("index.js", newContent, "utf8");
  console.log("QR object replaced successfully");
} else {
  console.log("Could not find QR start or end. Start:", qrStart, "End:", qrEnd);
}
