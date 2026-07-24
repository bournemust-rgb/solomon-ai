const fs = require('fs');
const path = 'index.js';
let src = fs.readFileSync(path, 'utf8');
let lines = src.split(/\r?\n/);

let deliveryIdx = lines.findIndex(l => l.includes("require('./delivery')") || l.includes('require("./delivery")'));
if (deliveryIdx === -1) { console.error('Could not find delivery require'); process.exit(1); }

let hasTcdbRequire = lines.some(l => l.includes('tcdb') && l.includes('require'));
if (!hasTcdbRequire) {
  lines.splice(deliveryIdx + 1, 0, "var tcdb = require('./tcdb');");
  console.log('Inserted tcdb require');
}

let fallbackIdx = lines.findIndex(l => l.trim() === 'return randomFallback();');
if (fallbackIdx === -1) fallbackIdx = lines.findIndex(l => l.includes('return randomFallback()'));
if (fallbackIdx === -1) { console.error('Could not find return randomFallback'); process.exit(1); }

let alreadyWired = lines.slice(Math.max(0, fallbackIdx-3), fallbackIdx+1).some(l => l.includes('searchTCDB'));
if (!alreadyWired) {
  lines.splice(fallbackIdx, 0,
    '  var tcMatch = null;',
    '  try { tcMatch = tcdb.searchTCDB(text); } catch(e) { tcMatch = null; }',
    '  if (tcMatch) return tcMatch;'
  );
  console.log('Wired tcdb before randomFallback');
}

fs.writeFileSync(path, lines.join('\n'), {encoding:'utf8'});
const { execSync } = require('child_process');
try { execSync('node --check ' + path, {stdio:'inherit'}); console.log('Syntax OK'); }
catch(e) { console.error('Syntax error'); process.exit(1); }
