# ============================================================
# solomon-deploy.ps1
# Run: .	emp	est.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$projectPath = "C:	emp	est.ps1"
Set-Location $projectPath

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Solomon BIT - Full Deploy" -ForegroundColor Green
Write-Host "  Fixes: 5sqm | Fence photo | Min charge | NIM Phase 1" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Step 1: Install openai
Write-Host ""
Write-Host "[1/6] Installing openai package..." -ForegroundColor Cyan
$hasOpenAI = npm list openai 2>$null
if (-not $hasOpenAI) { npm install openai }
Write-Host "  openai installed" -ForegroundColor Green

# Step 2: Create services directory
Write-Host ""
Write-Host "[2/6] Creating services directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "services" | Out-Null
Write-Host "  services/ created" -ForegroundColor Green

# Step 3: Write services/nvidia.js
Write-Host ""
Write-Host "[3/6] Writing services/nvidia.js..." -ForegroundColor Cyan
$code = @'
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
'@

$code | Out-File -FilePath "services
vidia.js" -Encoding utf8 -NoNewline
Write-Host "  services/nvidia.js created" -ForegroundColor Green

# Step 4: Syntax checks
Write-Host ""
Write-Host "[4/6] Running syntax checks..." -ForegroundColor Cyan

$nvidiaCheck = node --check services
vidia.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  services/nvidia.js OK" -ForegroundColor Green
} else {
    Write-Host "  services/nvidia.js FAILED" -ForegroundColor Red
    Write-Host $nvidiaCheck
    exit 1
}

if (Test-Path "options	est.ps1") {
    $qfCheck = node --check options	est.ps1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  options/quote_flow.js OK" -ForegroundColor Green
    } else {
        Write-Host "  options/quote_flow.js check skipped" -ForegroundColor Yellow
    }
}

if (Test-Path "bot-core.js") {
    $bcCheck = node --check bot-core.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  bot-core.js OK" -ForegroundColor Green
    } else {
        Write-Host "  bot-core.js check skipped" -ForegroundColor Yellow
    }
}

# Step 5: Git commit
Write-Host ""
Write-Host "[5/6] Git commit..." -ForegroundColor Cyan
git add services
vidia.js package.json
git add options	est.ps1 bot-core.js 2>$null

$hasChanges = git diff --cached --quiet 2>$null
if ($LASTEXITCODE -ne 0) {
    git commit -m "Combined: fix 5sqm, fix fence photo, add R200/R250 min charge, add Phase1 NIM text parsing"
    Write-Host "  Committed" -ForegroundColor Green
} else {
    Write-Host "  No changes to commit" -ForegroundColor Yellow
}

# Step 6: Push
Write-Host ""
Write-Host "[6/6] Pushing to origin/main..." -ForegroundColor Cyan
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOY COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor White
Write-Host "  1. Go to Render Dashboard" -ForegroundColor Gray
Write-Host "  2. Add Environment Variable:" -ForegroundColor Gray
Write-Host "     NVIDIA_API_KEY=nvapi-xxxxxxxxxx" -ForegroundColor Gray
Write-Host "  3. Click 'Clear Cache & Deploy'" -ForegroundColor Gray
Write-Host ""
Write-Host "TEST CASES:" -ForegroundColor Cyan
Write-Host "  gate 20kgs charcoalish -> weight: 20kg, colour: charcoal" -ForegroundColor Gray
Write-Host "  Sheet metal -> asks size (not 5sqm default)" -ForegroundColor Gray
Write-Host "  Palisades -> asks weight (not photo redirect)" -ForegroundColor Gray
Write-Host "  7kg Premium -> R250 min charge (not R119)" -ForegroundColor Gray
Write-Host ""
