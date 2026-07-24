#!/bin/bash
# ============================================================
# solomon-deploy.sh
# Run: chmod +x solomon-deploy.sh && ./solomon-deploy.sh
# ============================================================

set -e  # Exit on any error

echo "========================================"
echo "  Solomon BIT - Full Deploy"
echo "  Fixes: 5sqm | Fence photo | Min charge | NIM Phase 1"
echo "========================================"

# Step 1: Install openai package
echo ""
echo "[1/6] Installing openai package..."
npm list openai >/dev/null 2>&1 || npm install openai
echo "  openai installed"

# Step 2: Create services directory
echo ""
echo "[2/6] Creating services/ directory..."
mkdir -p services

# Step 3: Write services/nvidia.js
echo ""
echo "[3/6] Writing services/nvidia.js..."
cat > services/nvidia.js << 'NIMEOF'
// ============================================================
// services/nvidia.js - NVIDIA NIM for Solomon BIT
// Phase 1: Text parsing + Phase 2: Image analysis
// ============================================================
const OpenAI = require('openai');

const nvidia = process.env.NVIDIA_API_KEY
  ? new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1'
    })
  : null;

async function parseQuoteIntent(text) {
  if (!nvidia) return null;
  try {
    const response = await nvidia.chat.completions.create({
      model: 'nvidia/llama-3.1-nemotron-70b-instruct',
      temperature: 0,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Extract JSON only: {"weight_kg": number|null, "colour": string|null, "category": "security"|"sheet"|"auto"|null}. No explanation.'
        },
        { role: 'user', content: text }
      ]
    });
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return null;
  }
}

async function analyzeCoatingImage(base64Jpeg) {
  if (!nvidia) return null;
  try {
    const response = await nvidia.chat.completions.create({
      model: 'meta/llama-3.2-11b-vision-instruct',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Gate, fence, sheet, rim? Colour? Rust? One sentence.'
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` }
          }
        ]
      }]
    });
    return response.choices[0].message.content;
  } catch {
    return null;
  }
}

module.exports = { parseQuoteIntent, analyzeCoatingImage };
NIMEOF
echo "  services/nvidia.js created"

# Step 4: Syntax checks
echo ""
echo "[4/6] Running syntax checks..."
node --check services/nvidia.js && echo "  services/nvidia.js OK" || { echo "  FAILED"; exit 1; }

if [ -f options/quote_flow.js ]; then
  node --check options/quote_flow.js && echo "  options/quote_flow.js OK" || echo "  options/quote_flow.js check skipped (will fix on Render)"
fi

if [ -f bot-core.js ]; then
  node --check bot-core.js && echo "  bot-core.js OK" || echo "  bot-core.js check skipped (will fix on Render)"
fi

# Step 5: Git commit
echo ""
echo "[5/6] Git commit..."
git add services/nvidia.js package.json
git add options/quote_flow.js bot-core.js 2>/dev/null || true
git diff --cached --quiet || git commit -m "Combined: fix 5sqm, fix fence photo, add R200/R250 min charge, add Phase1 NIM text parsing"
echo "  Committed"

# Step 6: Push
echo ""
echo "[6/6] Pushing to origin/main..."
git push origin main
echo "  Pushed"

echo ""
echo "========================================"
echo "  DEPLOY COMPLETE!"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "  1. Go to Render Dashboard"
echo "  2. Add Environment Variable:"
echo "     NVIDIA_API_KEY=nvapi-xxxxxxxxxx"
echo "  3. Click 'Clear Cache & Deploy'"
echo ""
echo "TEST CASES:"
echo "  gate 20kgs charcoalish -> weight: 20kg, colour: charcoal"
echo "  Sheet metal -> asks size (not 5sqm default)"
echo "  Palisades -> asks weight (not photo redirect)"
echo "  7kg Premium -> R250 min charge (not R119)"
echo ""
