// ============================================================
// bot-core.js — Handle incoming WhatsApp images
// After you download WhatsApp media to buffer
// ============================================================
const { analyzeCoatingImage } = require('./services/nvidia');

async function handleImage(mediaId) {
  // 1. Download from WhatsApp (your existing code)
  const buffer = await downloadWhatsAppMedia(mediaId);

  // 2. Convert to base64
  const base64Image = buffer.toString('base64');

  // 3. Analyze with NVIDIA
  const desc = await analyzeCoatingImage(base64Image);

  if (desc) {
    return `I see ${desc}. What is the weight?`;
  }
  // Continue your quote flow — calculator.js prices
}
