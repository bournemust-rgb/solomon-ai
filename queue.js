const axios = require('axios');

var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function sendMessage(to, message) {
  try {
    // FORCE message to be a clean string
    const cleanMessage = String(message).trim();
    
    console.log("📤 Sending to:", to);
    console.log("📤 PHONE_ID:", PHONE_ID);
    console.log("📤 WA_TOKEN exists:", !!WA_TOKEN);
    console.log("📤 Message length:", cleanMessage.length);
    console.log("📤 First 50 chars:", cleanMessage.substring(0, 50));
    
    if (!WA_TOKEN || !PHONE_ID) {
      console.error("❌ Missing WA_TOKEN or PHONE_ID");
      return false;
    }

    if (!cleanMessage || cleanMessage.length === 0) {
      console.error("❌ Empty message");
      return false;
    }

    const response = await axios.post(
      "https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: cleanMessage }
      },
      {
        headers: {
          Authorization: "Bearer " + WA_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Message sent! Status:", response.status);
    return true;
  } catch (error) {
    console.error("❌ sendMessage Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

module.exports = { sendMessage };
