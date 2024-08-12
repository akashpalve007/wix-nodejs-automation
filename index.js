require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("Webhook verification failed");
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
        // Ensure messages exist before trying to access them
        if (
          change.value &&
          change.value.messages &&
          change.value.messages.length > 0
        ) {
          const messageData = change.value.messages[0];
          const from = messageData.from; // The WhatsApp ID of the user who sent the message
          const msg_body = messageData.text.body.toLowerCase(); // Convert the message text to lowercase

          console.log(`Message received from ${from}: ${msg_body}`);

          // Check if the message is "start"
          if (msg_body === "start") {
            const responseMessage =
              "Thanks for your message! How can I help you?";
            await sendWhatsAppMessage(from, responseMessage);
            console.log(
              `Automated message sent to ${from}: ${responseMessage}`
            );
          } else {
            console.log(`No automated response sent. Message was: ${msg_body}`);
          }
        } else {
          console.log("No messages found in this webhook event");
        }
      });
    });
    res.sendStatus(200);
  } else {
    console.log("Webhook received unsupported event type");
    res.sendStatus(404);
  }
});

async function sendWhatsAppMessage(to, message) {
  const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: "whatsapp",
    to: to,
    text: { body: message },
  };
  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Message sent successfully: ${JSON.stringify(response.data)}`);
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
