const fs = require("fs");
let c = fs.readFileSync("bot-content.js", "utf8");

// Fix Accounts
c = c.replace(
  '"12": "ACCOUNTS\\nFor invoices & statements, email accounts."',
  '"12": "📊 ACCOUNTS & INVOICES\\n\\nFor invoices, statements, or payment queries:\\n📧 Email: infosc@mweb.co.za\\n📞 Phone: 076 760 4350\\n\\nPlease include your reference number if you have one."'
);

// Fix TPS
c = c.replace(
  '"13": "TPS Wisdom"',
  '"13": "💡 TPS DAILY WISDOM\\n\\n\\"Quality isnt expensive, its priceless.\\"\\n\\nAt Solomon Coatings, we believe in doing things right the first time. Since 1988, weve built our reputation on quality workmanship.\\n\\nNeed advice? Call Ridhor: 076 760 4350"'
);

// Fix Tech Support
c = c.replace(
  '"11": "TECHNICAL SUPPORT\\nWhatsApp: 076 760 4350 | Email: " + QUOTE_EMAIL + QUOTE_EMAIL',
  '"11": "TECHNICAL SUPPORT\\nWhatsApp: 076 760 4350 | Email: infosc@mweb.co.za"'
);

fs.writeFileSync("bot-content.js", c);
console.log("DONE");
