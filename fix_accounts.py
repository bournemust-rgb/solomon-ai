import re

with open('bot-content.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Accounts (12)
old12 = '"12": "ACCOUNTS\\nFor invoices & statements, email accounts."'
new12 = '"12": "📊 ACCOUNTS & INVOICES\\n\\nFor invoices, statements, or payment queries:\\n📧 Email: infosc@mweb.co.za\\n📞 Phone: 076 760 4350\\n\\nPlease include your reference number if you have one."'
content = content.replace(old12, new12)

# Fix TPS Wisdom (13)
old13 = '"13": "TPS Wisdom"'
new13 = '"13": "💡 TPS DAILY WISDOM\\n\\n\\"Quality isn\\'t expensive, it\\'s priceless.\\"\\n\\nAt Solomon Coatings, we believe in doing things right the first time. Since 1988, we\\'ve built our reputation on quality workmanship.\\n\\nNeed advice? Call Ridhor: 076 760 4350"'
content = content.replace(old13, new13)

# Fix Technical Support (11)
old11 = '"11": "TECHNICAL SUPPORT\\nWhatsApp: 076 760 4350 | Email: " + QUOTE_EMAIL + QUOTE_EMAIL'
new11 = '"11": "TECHNICAL SUPPORT\\nWhatsApp: 076 760 4350 | Email: infosc@mweb.co.za"'
content = content.replace(old11, new11)

with open('bot-content.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed!')
