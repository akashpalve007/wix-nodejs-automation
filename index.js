const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cron = require("node-cron");
const app = express();

app.use(bodyParser.json());

// In-memory storage for user message scheduling
const users = {}; // Key: phoneNumber, Value: array of dates for scheduled messages

// Endpoint to receive WhatsApp messages
app.post("/whatsapp-webhook", (req, res) => {
  const entry = req.body.entry[0];
  const messages = entry.changes[0].value.messages;

  if (messages && messages.length > 0) {
    const phoneNumber = messages[0].from;
    const messageContent = messages[0].text.body;

    console.log(`Received message from: ${phoneNumber}`);

    // Initialize scheduling for the user
    initializeUserMessages(phoneNumber);

    res.sendStatus(200);
  }
});

// Initialize the user message schedule
function initializeUserMessages(phoneNumber) {
  if (!users[phoneNumber]) {
    const startDate = new Date();
    users[phoneNumber] = [];

    // Schedule 28 messages
    for (let i = 1; i <= 28; i++) {
      const messageDate = new Date(startDate);
      messageDate.setDate(startDate.getDate() + i);

      users[phoneNumber].push({
        date: messageDate,
        message: `This is your day ${i} message.`,
      });

      // Schedule the message
      cron.schedule(
        `0 0 ${messageDate.getDate()} ${messageDate.getMonth() + 1} *`,
        () => {
          sendMessage(phoneNumber, `This is your day ${i} message.`);
        }
      );
    }
  }
}

// Function to send a message via WhatsApp Business API
function sendMessage(phoneNumber, message) {
  const apiUrl = "https://graph.facebook.com/v13.0/356986240839037/messages";
  const apiToken =
    "EAAXSzbP7mioBOyJw058qr1dzRGmyjycYh7vByNoZBoLEq0I0BOJcsUleZA3TPdBA1I6dzLZANSVvx2XceRk31NDY9EujYvz8b5JPScjUC7v7LLMc4Odf51NDfKwxjQulW9lE2lLBGZAzFWoF1kQaYGXGX34T5PFXCAyKvZCIatIbz6QqXq97zZB9HNkOzaSZC9hyisx7Xzf3QJiM3ZBDKKcZD";

  axios
    .post(
      apiUrl,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      console.log(`Message sent to ${phoneNumber}: ${message}`);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
}

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
