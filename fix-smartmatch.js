const fs = require('fs');
const path = 'smartmatch.js';
let src = fs.readFileSync(path, 'utf8');
let lines = src.split(/\r?\n/);

let fallbackIdx = lines.findIndex(l => l.trim() === 'return randomFallback();');
if (fallbackIdx === -1) fallbackIdx = lines.findIndex(l => l.includes('return randomFallback()'));

if (fallbackIdx === -1) { console.error('Could not find return randomFallback'); process.exit(1); }

let alreadyWired = lines.slice(Math.max(0, fallbackIdx-3), fallbackIdx+1).some(l => l.includes('searchTCDB'));
if (!alreadyWired) {
  lines.splice(fallbackIdx, 0,
    '  if (tcdb) { var tcMatch = tcdb.searchTCDB(text); if (tcMatch) return tcMatch; }'
  );
  console.log('Wired tcdb search into smartmatch.js before randomFallback');
}

fs.writeFileSync(path, lines.join('\n'), {encoding:'utf8'});
const { execSync } = require('child_process');
try { execSync('node --check ' + path, {stdio:'inherit'}); console.log('Syntax OK'); }
catch(e) { console.error('Syntax error'); process.exit(1); }
