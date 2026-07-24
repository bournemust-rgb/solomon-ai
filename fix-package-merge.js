// Merge backup dependencies + fix trailing comma bug
const fs = require('fs');
let bakRaw = fs.readFileSync('package.json.bak','utf8');
// Fix common JSON errors: trailing commas
let fixed = bakRaw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
let bak;
try{
  bak = JSON.parse(fixed);
  console.log('✅ Parsed package.json.bak after fixing trailing commas');
} catch(e){
  console.error('❌ Still broken even after fix:', e.message);
  console.log('First error near:', fixed.slice(e.message.match(/\d+/)?.[0]-50, e.message.match(/\d+/)?.[0]+50));
  process.exit(1);
}
if(!bak.dependencies) bak.dependencies = {};
bak.dependencies.openai = "^4.0.0";
fs.writeFileSync('package.json', JSON.stringify(bak,null,2),'utf8');
console.log('✅ Restored package.json with all old deps + openai added');
console.log('Deps now:', Object.keys(bak.dependencies).join(', '));
