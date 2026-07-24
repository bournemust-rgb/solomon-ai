// ONE TIME SETUP - Run once in C:\Users\popul\solomon-coatings-ai
// node setup-solomon.js
const fs = require('fs');
const path = require('path');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

// 1. Create services folder + nvidia.js
ensureDir('services');
const nvidiaCode = `const OpenAI = require('openai');
const nvidia = process.env.NVIDIA_API_KEY
  ? new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: 'https://integrate.api.nvidia.com/v1' })
  : null;

async function parseQuoteIntent(text){
  if(!nvidia) return null;
  try{
    const r = await nvidia.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {role:'system', content: 'Extract JSON only: {"weight_kg":number|null,"colour":string|null,"category":"security"|"sheet"|"auto"|null}'},
        {role:'user', content: text}
      ]
    });
    return JSON.parse(r.choices[0].message.content);
  }catch{ return null; }
}

async function analyzeCoatingImage(base64Jpeg){
  if(!nvidia) return null;
  try{
    const r = await nvidia.chat.completions.create({
      model: 'meta/llama-3.2-11b-vision-instruct',
      max_tokens: 150,
      messages: [{
        role:'user',
        content: [
          {type:'text', text: 'Gate, fence, sheet, rim? Colour? Rust? One sentence.'},
          {type:'image_url', image_url:{url: \`data:image/jpeg;base64,\${base64Jpeg}\`}}
        ]
      }]
    });
    return r.choices[0].message.content;
  }catch{ return null; }
}

module.exports = { parseQuoteIntent, analyzeCoatingImage };
`;
fs.writeFileSync('services/nvidia.js', nvidiaCode, 'utf8');
console.log('✅ Created services/nvidia.js');

// 2. Patch options/quote_flow.js - add require + min charge + AI fallback
let qPath = 'options/quote_flow.js';
if(!fs.existsSync(qPath)){ console.error('❌ options/quote_flow.js not found'); process.exit(1); }
let src = fs.readFileSync(qPath,'utf8');

// Add require at top if missing
if(!src.includes('services/nvidia')){
  src = src.replace(/(const|let|var)\s+.*require.*\n/, (m)=> m + `const { parseQuoteIntent } = require('../services/nvidia');\n`);
  // fallback if no require found
  if(!src.includes('services/nvidia')){
    src = `const { parseQuoteIntent } = require('../services/nvidia');\n` + src;
  }
}

// Replace security_weight block with AI fallback version
const newWeightBlock = `  if (flow.state === "security_weight") {
    var kgMatch = t.match(/(\\d+)/);
    var kg = kgMatch ? parseInt(kgMatch[1]) : null;
    if (!kg) {
      try {
        const ai = await parseQuoteIntent(t);
        if (ai?.weight_kg) {
          kg = ai.weight_kg;
          flow.secWeight = ai.weight_kg;
        }
      } catch {}
    }
    if (!kg) return "Please give me the estimated weight in kg. e.g. 20 or 50";
    flow.secWeight = kg;
    flow.state = "security_colour";
    session.flow = flow;
    await saveSession(from, session);
    return "Got it - about " + flow.secWeight + "kg.\\n\\nWhat colour?\\nReply: BLACK/WHITE (R16/kg) or PREMIUM (charcoal, metallic, etc. R17-R20/kg)";
  }`;

src = src.replace(/  if \(flow\.state === "security_weight"\) \{[\s\S]*?return "Got it - about "[\s\S]*?\(R16\/kg\)[\s\S]*?";\s*\}/, newWeightBlock);

// Replace security_colour block with min charge version
const newColourBlock = `  if (flow.state === "security_colour") {
    var isPrem = /charcoal|metallic|bronze|gold|red|blue|green|yellow|orange|purple|silver|premium|colour|color|custom|ral/i.test(t);
    var isBW = /black|white|bw|standard/i.test(t);
    if (!isPrem && !isBW) return "Please reply: BLACK/WHITE (R16/kg) or PREMIUM colour (R17-R20/kg)";

    var rateLow = isPrem ? 17 : 16;
    var rateHigh = isPrem ? 20 : 16;
    var weight = flow.secWeight;
    var totalLow = weight * rateLow;
    var totalHigh = weight * rateHigh;
    // Minimum charge: R200 excl VAT for B/W, R250 excl VAT for premium
    var minCharge = isPrem ? 250 : 200;
    var minApplied = totalLow < minCharge || totalHigh < minCharge;
    if (totalLow < minCharge) totalLow = minCharge;
    if (totalHigh < minCharge) totalHigh = minCharge;
    var vatLow = Math.round(totalLow * VAT);
    var vatHigh = Math.round(totalHigh * VAT);

    flow = { state: "idle" };
    session.flow = flow;
    await saveSession(from, session);

    return "SECURITY/FENCING ESTIMATE - Ref: " + ref + "\\n\\nWeight: " + weight + " kg\\nColour: " + (isPrem ? "Premium (R" + rateLow + "-R" + rateHigh + "/kg)" : "Standard Black/White (R16/kg)") + "\\n\\nCoating (blasting included): R" + totalLow.toLocaleString() + " - R" + totalHigh.toLocaleString() + "\\nVAT (15%): R" + vatLow.toLocaleString() + " - R" + vatHigh.toLocaleString() + "\\nTOTAL (incl VAT): R" + (totalLow+vatLow).toLocaleString() + " - R" + (totalHigh+vatHigh).toLocaleString() + (minApplied ? "\\n\\n📌 Minimum charge of R" + minCharge.toLocaleString() + " (excl VAT) applied." : "") + "\\n\\n⚠ Estimate only. Final price from Ridhor: 076 760 4350";
  }`;

src = src.replace(/  if \(flow\.state === "security_colour"\) \{[\s\S]*?076 760 4350";\s*\}/, newColourBlock);

fs.writeFileSync(qPath, src, 'utf8');
console.log('✅ Patched options/quote_flow.js - added min charge R200/R250 + AI fallback');

// 3. Ensure package.json has openai
let pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
if(!pkg.dependencies) pkg.dependencies = {};
if(!pkg.dependencies.openai){
  pkg.dependencies.openai = "^4.0.0";
  fs.writeFileSync('package.json', JSON.stringify(pkg,null,2),'utf8');
  console.log('✅ Added openai to package.json');
} else {
  console.log('ℹ️ openai already in package.json');
}

console.log('\\nDone! Now run:');
console.log('npm i');
console.log('node --check services/nvidia.js && node --check options/quote_flow.js');
console.log('git add services/nvidia.js options/quote_flow.js package.json package-lock.json');
console.log('git commit -m "One-time: add NIM Phase1 + R200/R250 min charge + fix 5sqm"');
console.log('git push origin main');
