const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const WHATSAPP_API_URL =
  "https://graph.facebook.com/v20.0/356986240839037/messages";
const WHATSAPP_API_TOKEN =
  "EAAXSzbP7mioBO12HoKqxzWeHoaI1XAgHJwC5btVZAcE0Nvk3ioDl6KLXnbHx2rG8h1rd5LRZBiLdqFOmZBRVGwh0L8wZBuO2e84HleHbajyU0xQZCbBFJbpAh83LtOWgAsNeZB9oogu0WfmxAtXjkKq6p9RhwWdIk9z2gdjWZCAtfAuqZCEZCLt0Q8cKNKJrZCeruncQZDZD";

// Endpoint to handle incoming webhook from Wix
app.post("/whatsapp-webhook", async (req, res) => {
  try {
    const { summary, contactId, contact } = req.body;
    const phoneNumber = contactId; // Assuming contactId contains the phone number

    console.log(`Received message from: ${phoneNumber}`);
    console.log(`Message content: ${summary}`);

    // Send a WhatsApp message if the summary (message content) is "send"
    if (summary.toLowerCase() === "send") {
      await sendWhatsAppMessage(phoneNumber);
    }

    res.sendStatus(200); // Acknowledge receipt of the webhook
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.sendStatus(500); // Internal Server Error
  }
});

// Function to send a message via WhatsApp Business API
async function sendWhatsAppMessage(phoneNumber) {
  const data = {
    messaging_product: "whatsapp",
    to: phoneNumber,
    type: "template",
    template: {
      name: "_dag_1_intro__dutch", // Your template name
      language: {
        code: "nl", // Dutch language code
      },
      // components: [
      //   {
      //     type: "body",
      //     parameters: [
      //       {
      //         type: "text",
      //         text: "Thanks for Choosing LifeScaping.", // Your custom message
      //       },
      //     ],
      //   },
      // ],
    },
  };

  try {
    const response = await axios.post(WHATSAPP_API_URL, data, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Message sent:", response.data);
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
