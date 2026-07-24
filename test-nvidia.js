// ============================================================
// test-nvidia.js - Quick test for Phase 1
// Run: node test-nvidia.js
// Requires: NVIDIA_API_KEY in .env or environment
// ============================================================
require('dotenv').config();
const { parseQuoteIntent } = require('./services/nvidia');

const tests = [
  'gate 20kgs charcoalish',
  'palisade thirty kg black',
  'sheet metal 25kg white',
  'rims 15kg silver',
  'my gate is like 20kgs',
  'twenty kg charcoalish dark thing',
  '7kg premium',
  '5 sqm sheet metal white'
];

async function runTests() {
  console.log('========================================');
  console.log('  Solomon BIT - Phase 1 NIM Tests');
  console.log('========================================
');

  for (const test of tests) {
    console.log(`Input:    "${test}"`);
    const result = await parseQuoteIntent(test);
    console.log(`Output:   ${JSON.stringify(result)}`);
    console.log('---');
  }

  console.log('
All tests complete!');
}

runTests().catch(console.error);
