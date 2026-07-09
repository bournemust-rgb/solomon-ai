const Bottleneck = require('bottleneck');
const axios = require('axios');
const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 67, reservoir: 50, reservoirRefreshAmount: 50, reservoirRefreshInterval: 1000 });
limiter.on('failed', function(err, info) { console.warn('Queue fail (' + info.retryCount + '):', err.message); });
async function sendMessage(to, text, retries) {
  retries = retries || 3;
  return limiter.schedule(async function() {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await axios({
          method: 'POST',
          url: 'https://graph.facebook.com/v21.0/' + process.env.WHATSAPP_PHONE_NUMBER_ID + '/messages',
          headers: { 'Authorization': 'Bearer ' + process.env.WHATSAPP_ACCESS_TOKEN, 'Content-Type': 'application/json' },
          data: { messaging_product: 'whatsapp', recipient_type: 'individual', to: to, type: 'text', text: { body: text, preview_url: false } },
          timeout: 15000
        });
        console.log('Sent to ' + to + ': "' + text.substring(0, 60) + '..."');
        return { success: true, messageId: res.data && res.data.messages && res.data.messages[0] ? res.data.messages[0].id : null };
      } catch (err) {
        const status = err.response ? err.response.status : null;
        if (status === 429) { const wait = (err.response && err.response.headers && err.response.headers['retry-after']) ? parseInt(err.response.headers['retry-after']) : 5; await new Promise(function(r) { setTimeout(r, wait * 1000); }); }
        else if (status === 401 || status === 403) return { success: false, error: 'Auth failed' };
        else if (attempt < retries) await new Promise(function(r) { setTimeout(r, Math.pow(2, attempt - 1) * 1000); });
        else return { success: false, error: (err.response && err.response.data) ? err.response.data : err.message };
      }
    }
  });
}
async function sendAcknowledgment(to) {
  const msgs = ['Checking that for you...', 'Let me look that up...', 'One moment...', 'Pulling up that info...'];
  sendMessage(to, msgs[Math.floor(Math.random() * msgs.length)], 1).catch(function() {});
}
module.exports = { sendMessage, sendAcknowledgment };
