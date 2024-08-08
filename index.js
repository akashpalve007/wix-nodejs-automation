const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// Replace with your WhatsApp API credentials and endpoint
const WHATSAPP_API_URL =
  "https://graph.facebook.com/v13.0/356986240839037/messages";
const WHATSAPP_API_TOKEN =
  "EAAXSzbP7mioBO12HoKqxzWeHoaI1XAgHJwC5btVZAcE0Nvk3ioDl6KLXnbHx2rG8h1rd5LRZBiLdqFOmZBRVGwh0L8wZBuO2e84HleHbajyU0xQZCbBFJbpAh83LtOWgAsNeZB9oogu0WfmxAtXjkKq6p9RhwWdIk9z2gdjWZCAtfAuqZCEZCLt0Q8cKNKJrZCeruncQZDZD";

// Endpoint to receive WhatsApp messages
app.post("/whatsapp-webhook", async (req, res) => {
  try {
    const entry = req.body.entry[0];
    const messages = entry.changes[0].value.messages;

    if (messages && messages.length > 0) {
      const phoneNumber = messages[0].from;
      const messageContent = messages[0].text.body.toLowerCase(); // Convert to lowercase for comparison

      console.log(`Received message from: ${phoneNumber}`);
      console.log(`Message content: ${messageContent}`);

      if (messageContent === "send") {
        await sendMessage(phoneNumber, "Thanks for Choosing Us");
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(204); // No content
    }
  } catch (error) {
    console.error("Error processing message:", error);
    res.sendStatus(500); // Internal Server Error
  }
});

// Function to send a message via WhatsApp Business API
async function sendMessage(phoneNumber, message) {
  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Message sent to ${phoneNumber}: ${message}`);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
