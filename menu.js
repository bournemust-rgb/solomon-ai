function buildMenu(OFFICE_NUMBER, OFFICE_EMAIL, QUOTE_EMAIL, FACEBOOK, TIKTOK, GOOGLE_REVIEW) {
  return {
    "hi":"Howzit! SC here, lekker ready to help — what are we coating today?\n\nType *menu* to see our Secret List.\n\nOr tell me what you need priced — gates, rims, steel, shotblasting, trucks.",
    "hello":"Howzit! SC here, lekker ready to help — what are we coating today?\n\nType *menu* to see our Secret List.",
    "hey":"Howzit! SC here — what are we coating today?\n\nType *menu* for the full list.",
    "howzit":"Howzit! SC here — what are we coating today?\n\nType *menu* for the full list.",
    "good morning":"Morning! SC here, lekker ready — what are we coating today?\n\nType *menu* for the full list.",
    "menu":"WHAT I CAN DO - pick a number:\n\n1. Pricing\n2. Colours\n3. Get a quote estimate\n4. Turnaround times\n5. Business hours\n6. Delivery & collection\n7. Blasting services\n8. T&Cs & warranties\n9. View our gallery\n10. Leave a review\n11. Book a callback\n12. Talk to Ridhor\n13. Account queries\n14. TPS Daily Wisdom\n\nOr just tell me what you need priced.",
    "pricing":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99",
    "colours":"Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nFinishes: Gloss, Matte, Satin, Wrinkle, Hammertone, Sand Texture",
    "hours":"Mon-Thurs 8AM-4:45PM. Fri 8AM-2:45PM. Closed weekends.",
    "turnaround":"Under 1 ton: 3 working days. Over 1 ton: 5-8 working days.",
    "delivery":"R150 Cape Town metro. Free collection. 7% daily storage after 7 days.",
    "contact":"060 507 4461 | Office: "+OFFICE_NUMBER+" | Email: "+OFFICE_EMAIL,
    "1":"PRICING (excl VAT)\nRims: R1000-R1500/set\nSheet: R175-R350/sqm\nCoating: R16/kg B/W, R17-R20/kg premium\nBlasting: R8-R12/kg\nTruck: R5000-R7500\nMin: R173.99\n\nType *menu* to go back.",
    "2":"COLOURS\nStandard: Black, White, Brown, Bronze, Charcoal: R175-R250/sqm\nHammered: R225+\nMetallic/Custom/RAL: R300+\n\nType *menu* to go back.",
    "3":"Send: quote 20kg gate charcoal | quote 4 rims metallic | quote 10sqm sheet black | quote 20kg blasting only\n\nType *menu* to go back.",
    "4":"TURNAROUND\nUnder 1 ton: 3 working days. Over 1 ton: 5-8 working days.\n\nType *menu* to go back.",
    "5":"BUSINESS HOURS\nMon-Thurs: 8AM-4:45PM\nFri: 8AM-2:45PM\nClosed weekends.\n\nType *menu* to go back.",
    "6":"DELIVERY & COLLECTION\nR150 metro. Free collection. Collect within 7 days. Late: 7% daily storage.\n\nType *menu* to go back.",
    "7":"BLASTING SERVICES\nR8-R12/kg. Truck R5,000-R7,500. Grit 0.12-0.4mm, 6 bar. Client risk.\n\nType *menu* to go back.",
    "8":"TERMS\nCOD only. No coastal warranties (15km). 7% daily storage. Items ours until paid.\n\nType *menu* to go back.",
    "9":"GALLERY\nFB: "+FACEBOOK+" | TikTok: "+TIKTOK+"\n\nType *menu* to go back.",
    "10":"REVIEW US\n"+GOOGLE_REVIEW+"\n\nType *menu* to go back.",
    "11":"BOOK A CALLBACK\nSend name + number. Or call "+OFFICE_NUMBER+"\n\nType *menu* to go back.",
    "12":"TALK TO RIDHOR\nWhatsApp: 076 760 4350 | Email: "+QUOTE_EMAIL+"\n\nType *menu* to go back.",
    "13":"ACCOUNT QUERIES\nEmail: "+OFFICE_EMAIL+" | Phone: "+OFFICE_NUMBER+"\n\nType *menu* to go back.",
    "thanks":"Pleasure! Anything else? Type *menu*",
    "thank you":"Only a pleasure! Type *menu* for more.",
    "bye":"Cheers! Sien jou later."
  };
}
module.exports = { buildMenu };

