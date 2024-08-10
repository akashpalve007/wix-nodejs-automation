const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "whatsapp_bot_12345";

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook for receiving messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    body.entry.forEach(async (entry) => {
      const changes = entry.changes;
      changes.forEach(async (change) => {
        const messageData = change.value.messages[0];
        if (messageData) {
          const from = messageData.from; // The WhatsApp ID of the user who sent the message
          const msg_body = messageData.text.body; // The message text

          console.log("Message received from:", from);
          console.log("Message text:", msg_body);

          // Respond with a message
          await sendWhatsAppMessage(
            from,
            "Thanks for your message! How can I help you?"
          );
        }
      });
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v20.0/356986240839037/messages`;
  const data = {
    messaging_product: "whatsapp",
    to: to,
    text: { body: message },
  };
  try {
    await axios.post(url, data, {
      headers: {
        Authorization: `Bearer EAAXSzbP7mioBO12HoKqxzWeHoaI1XAgHJwC5btVZAcE0Nvk3ioDl6KLXnbHx2rG8h1rd5LRZBiLdqFOmZBRVGwh0L8wZBuO2e84HleHbajyU0xQZCbBFJbpAh83LtOWgAsNeZB9oogu0WfmxAtXjkKq6p9RhwWdIk9z2gdjWZCAtfAuqZCEZCLt0Q8cKNKJrZCeruncQZDZD`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});
