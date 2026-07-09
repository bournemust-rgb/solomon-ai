const crypto = require('crypto');
function validateWhatsAppSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) { console.warn('HMAC disabled - no WHATSAPP_APP_SECRET'); return next(); }
  if (!signature) { console.warn('Missing signature header'); return res.sendStatus(403); }
  const body = req.rawBody || JSON.stringify(req.body);
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  try {
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return next();
  } catch (err) {}
  console.error('Invalid webhook signature');
  return res.sendStatus(403);
}
module.exports = { validateWhatsAppSignature };
