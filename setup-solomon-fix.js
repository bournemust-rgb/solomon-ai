// FIXED SETUP - Handles broken package.json
const fs = require('fs');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }

// 1. Create services folder + nvidia.js (if not already)
ensureDir('services');
if(!fs.existsSync('services/nvidia.js')){
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
} else {
  console.log('ℹ️ services/nvidia.js already exists - keeping it');
}

// 2. Fix package.json - handles invalid JSON
let pkgPath = 'package.json';
if(fs.existsSync(pkgPath)){
  let raw = fs.readFileSync(pkgPath,'utf8');
  let pkg;
  try{
    pkg = JSON.parse(raw);
  }catch(e){
    console.log('⚠️ package.json is broken, backing up to package.json.bak');
    fs.writeFileSync('package.json.bak', raw, 'utf8');
    console.log('First 200 chars of broken file:', raw.slice(0,200));
    // Create minimal valid one
    pkg = {
      name: "solomon-bit-bot",
      version: "1.0.0",
      main: "bot-core.js",
      dependencies: {}
    };
  }
  if(!pkg.dependencies) pkg.dependencies = {};
  if(!pkg.dependencies.openai){
    pkg.dependencies.openai = "^4.0.0";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2), 'utf8');
    console.log('✅ Fixed package.json and added openai');
  } else {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2), 'utf8');
    console.log('✅ Repaired package.json');
  }
} else {
  console.log('❌ No package.json found - creating minimal');
  fs.writeFileSync(pkgPath, JSON.stringify({
    name: "solomon-bit-bot",
    version: "1.0.0",
    dependencies: { openai: "^4.0.0" }
  },null,2));
}

console.log('\nDone! Now run:');
console.log('npm i');
console.log('node --check services/nvidia.js && node --check options/quote_flow.js');
