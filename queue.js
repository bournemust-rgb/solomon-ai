const axios = require('axios');

var WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
var PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

async function sendMessage(to, message) {
  try {
    console.log("📤 Sending to:", to);
    console.log("📤 PHONE_ID:", PHONE_ID);
    console.log("📤 WA_TOKEN exists:", !!WA_TOKEN);
    
    if (!WA_TOKEN || !PHONE_ID) {
      console.error("❌ Missing WA_TOKEN or PHONE_ID");
      return false;
    }

    const response = await axios.post(
      "https://graph.facebook.com/v21.0/" + PHONE_ID + "/messages",
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message }
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
      console.error("Data:", JSON.stringify(error.response.data));
    }
    return false;
  }
}

module.exports = { sendMessage };
