cat > queue.js << 'EOF'
// ============================================================
// queue.js - WhatsApp Message Queue
// ============================================================
const axios = require('axios');

var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function sendMessage(to, message) {
  try {
    console.log("📤 Sending message to:", to);
    console.log("📤 Message content:", message.substring(0, 100) + "...");
    
    if (!WA_TOKEN || !PHONE_ID) {
      console.error("❌ Missing WA_TOKEN or PHONE_ID");
      console.log("WA_TOKEN:", WA_TOKEN ? "set" : "missing");
      console.log("PHONE_ID:", PHONE_ID ? "set" : "missing");
      return false;
    }

    const url = "https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages";
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: message }
    };

    console.log("📤 Sending to URL:", url);
    console.log("📤 Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: "Bearer " + WA_TOKEN,
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Message sent successfully!");
    console.log("📥 Response:", response.status, response.data);
    return true;
  } catch (error) {
    console.error("❌ sendMessage Error:", error.message);
    if (error.response) {
      console.error("📥 Response status:", error.response.status);
      console.error("📥 Response data:", JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

module.exports = { sendMessage };
EOF