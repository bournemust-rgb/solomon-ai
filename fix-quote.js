const fs = require('fs');

let core = fs.readFileSync('bot-core.js', 'utf8');

const quoteCode = `const quoteState = new Map();

function handleQuoteFlow(phone, text) {
  if (!phone) return null;
  const t = text.toLowerCase().trim();
  const state = quoteState.get(phone);
  
  if (t === 'menu' || t === '0') { quoteState.delete(phone); return null; }
  
  if (!state && (t === '3' || t === 'quote')) {
    quoteState.set(phone, { step: 'category' });
    return "💰 NEED A QUOTE?\\n\\nWhat item do you need coated?\\n\\n1️⃣ Security / Fencing\\n(gates, fences, balustrades, palisades, mesh, spikes, security gates, clear view, sliding gates)\\n\\n2️⃣ Sheet Metal\\n\\n3️⃣ Auto Parts\\n(rims, tappet covers, intercoolers, bumpers, mouse bars, styling bars, nudge bars, bull bars)\\n\\nReply with the number or item name.\\n\\nType *menu* to cancel.";
  }
  
  if (!state) return null;
  
  if (state.step === 'category') {
    if (t.includes('1') || t.includes('security') || t.includes('fence') || t.includes('gate') || t.includes('balustrade') || t.includes('palisade') || t.includes('mesh') || t.includes('spike') || t.includes('clear view') || t.includes('sliding')) {
      quoteState.set(phone, { step: 'sec_colour' });
      return "🛡️ SECURITY / FENCING selected.\\n\\nWhat colour?\\n• Black/White: R16/kg\\n• Other colours: R17-20/kg\\n\\nReply with colour name.\\n\\nType *menu* to cancel.";
    }
    if (t.includes('2') || t.includes('sheet')) {
      quoteState.set(phone, { step: 'sheet_colour' });
      return "📋 SHEET METAL selected.\\n\\nWhat colour?\\n• Standard: R175-250/sqm\\n• Premium: R251-350/sqm\\n\\nReply with colour name.\\n\\nType *menu* to cancel.";
    }
    if (t.includes('3') || t.includes('auto') || t.includes('car') || t.includes('rim') || t.includes('tappet') || t.includes('intercooler') || t.includes('bumper') || t.includes('mouse') || t.includes('styling') || t.includes('nudge') || t.includes('bull')) {
      quoteState.set(phone, { step: 'auto_part' });
      return "🚗 AUTO PARTS selected.\\n\\nWhich part?\\n• Rims (see pricing for sizes)\\n• Tappet cover: R350 excl VAT\\n• Intercooler: R550 excl VAT\\n• Bumper / Mouse bar / Styling bar / Nudge bar / Bull bar: R650 excl VAT each\\n\\nReply with the part name.\\n\\nType *menu* to cancel.";
    }
    return "Please reply with 1, 2, or 3 (or the item name).\\n\\nType *menu* to cancel.";
  }
  
  if (state.step === 'sec_colour') {
    const isCheap = t.includes('black') || t.includes('white');
    quoteState.set(phone, { step: 'sec_weight', colour: text, isCheap: isCheap });
    return "Colour: " + text + "\\nWhat weight in kg?\\nReply: e.g. \\"50kg\\" or just \\"50\\"\\n\\nType *menu* to cancel.";
  }
  
  if (state.step === 'sec_weight') {
    const w = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    const rate = state.isCheap ? 16 : 18.5;
    const total = w * rate;
    quoteState.delete(phone);
    return "📊 ESTIMATE\\n\\nItem: Security/Fencing\\nColour: " + state.colour + "\\nWeight: " + w + "kg\\nRate: R" + rate + "/kg\\n\\nEstimated: R" + total.toFixed(2) + " excl VAT\\n\\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\\n📞 076 760 4350\\n\\nType *menu* to go back to LIST.";
  }
  
  if (state.step === 'sheet_colour') {
    const isStandard = !['silver','gold','premium','metallic','pearl','candy'].some(p => t.includes(p));
    quoteState.set(phone, { step: 'sheet_width', colour: text, isStandard: isStandard });
    return "Colour: " + text + "\\nWidth in metres?\\nReply: e.g. \\"1.5\\" or \\"2m\\"\\n\\nType *menu* to cancel.";
  }
  
  if (state.step === 'sheet_width') {
    const width = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    quoteState.set(phone, { step: 'sheet_height', colour: state.colour, isStandard: state.isStandard, width: width });
    return "Width: " + width + "m\\nHeight in metres?\\nReply: e.g. \\"2\\" or \\"1.8m\\"\\n\\nType *menu* to cancel.";
  }
  
  if (state.step === 'sheet_height') {
    const h = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
    const area = (state.width || 0) * h;
    const rate = state.isStandard ? 212.5 : 300;
    const total = area * rate;
    quoteState.delete(phone);
    return "📊 ESTIMATE\\n\\nItem: Sheet Metal\\nColour: " + state.colour + "\\nSize: " + state.width + "m × " + h + "m = " + area.toFixed(2) + "sqm\\nRate: R" + rate + "/sqm\\n\\nEstimated: R" + total.toFixed(2) + " excl VAT\\n\\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\\n📞 076 760 4350\\n\\nType *menu* to go back to LIST.";
  }
  
  if (state.step === 'auto_part') {
    if (t.includes('rim')) {
      quoteState.delete(phone);
      return "🛞 RIMS PRICING\\n\\n• 10-15 inch (Black/White): R1,000-1,500/set\\n• 10-15 inch (Other): R1,300-1,700/set\\n• 16-18 inch (Black/White): R1,500-1,800/set\\n• 16-18 inch (Other): R1,700-2,200/set\\n\\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\\n📞 076 760 4350\\n\\nType *menu* to go back to LIST.";
    }
    let price = 0, part = '';
    if (t.includes('tappet')) { price = 350; part = 'Tappet cover'; }
    else if (t.includes('intercooler')) { price = 550; part = 'Intercooler'; }
    else if (t.includes('bumper') || t.includes('mouse') || t.includes('styling') || t.includes('nudge') || t.includes('bull')) { price = 650; part = text; }
    else { return "Please reply with the part name.\\n\\nType *menu* to cancel."; }
    quoteState.delete(phone);
    return "📊 ESTIMATE\\n\\nItem: " + part + "\\nPrice: R" + price + " excl VAT\\n\\n⚠️ This is an estimate. Final price will be confirmed by Ridhor.\\n📞 076 760 4350\\n\\nType *menu* to go back to LIST.";
  }
  
  return null;
}

`;

const firstFunc = core.indexOf('function ');
const insertPos = firstFunc !== -1 ? firstFunc : 0;
core = core.slice(0, insertPos) + quoteCode + core.slice(insertPos);

core = core.replace(
  /function handleMessage\s*\(\s*(\w+)\s*\)\s*\{/,
  'function handleMessage($1, from) {\n  if (from) {\n    const qr = handleQuoteFlow(from, $1);\n    if (qr) return qr;\n  }\n'
);

fs.writeFileSync('bot-core.js', core);

let content = fs.readFileSync('bot-content.js', 'utf8');
const old3 = '"3": "Send: quote 20kg gate charcoal | quote 4 rims metallic | quote 10sqm sheet black | quote 20kg blasting only"';
const new3 = '"3": "💰 NEED A QUOTE?\\n\\nWhat item do you need coated?\\n\\n1️⃣ Security / Fencing\\n(gates, fences, balustrades, palisades, mesh, spikes, security gates, clear view, sliding gates)\\n\\n2️⃣ Sheet Metal\\n\\n3️⃣ Auto Parts\\n(rims, tappet covers, intercoolers, bumpers, mouse bars, styling bars, nudge bars, bull bars)\\n\\nReply with the number or item name."';
content = content.replace(old3, new3);
fs.writeFileSync('bot-content.js', content);

let idx = fs.readFileSync('index.js', 'utf8');
const originalCalls = (idx.match(/handleMessage\s*\(\s*(\w+)\s*\)/g) || []).length;
idx = idx.replace(/handleMessage\s*\(\s*(\w+)\s*\)/g, 'handleMessage($1, from)');
const newCalls = (idx.match(/handleMessage\s*\(\s*(\w+)\s*,\s*from\s*\)/g) || []).length;
console.log('Replaced', originalCalls, 'calls, confirmed', newCalls);
fs.writeFileSync('index.js', idx);

console.log('✅ Quote flow added');
