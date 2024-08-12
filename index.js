require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cron = require("node-cron");

const app = express();
app.use(bodyParser.json());

// Template names for 28 days
const templateNames = [
  "_dag_1_intro__dutch",
  "start__dag_2",
  "start__dag_3",
  "start__dag_4",
  "start__dag_5",
  "start__dag_6",
  "start__dag7",
  "start__dag8",
  "start__dag9",
  "start__dag10",
  "start__dag11",
  "start__dag12",
  "start__dag13",
  "start__dag14",
  "start__dag15",
  "start__dag16",
  "start__dag17",
  "start__dag18",
  "start__dag19",
  "start__dag20",
  "start__dag21",
  "start__dag22",
  "start__dag23",
  "start__dag24",
  "start__dag25",
  "start__dag26",
  "start__dag27",
  "kopie_van_start__dag28",
];

// Webhook for receiving messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    body.entry.forEach(async (entry) => {
      const changes = entry.changes;
      changes.forEach(async (change) => {
        if (
          change.value &&
          change.value.messages &&
          change.value.messages.length > 0
        ) {
          const messageData = change.value.messages[0];
          const from = messageData.from; // The WhatsApp ID of the user who sent the message
          const msg_body = messageData.text.body.toLowerCase(); // Convert the message text to lowercase

          if (msg_body === "start") {
            // Send the Day 1 template immediately
            sendTemplateMessage(from, templateNames[0]);

            // Schedule the next 27 days of messages
            for (let i = 1; i < templateNames.length; i++) {
              scheduleMessage(from, templateNames[i], i);
            }
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

// Function to send a template message
async function sendTemplateMessage(to, templateName) {
  const url = `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`;
  const data = {
    messaging_product: "whatsapp",
    to: to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: "nl", // Dutch language code
      },
    },
  };
  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log(
      `Template message "${templateName}" sent successfully to ${to}`
    );
  } catch (error) {
    console.error(
      "Error sending template message:",
      error.response ? error.response.data : error.message
    );
  }
}

// Function to schedule a message
function scheduleMessage(to, templateName, dayOffset) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset); // Schedule for the next days

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const cronTime = `0 7 ${day} ${month} *`;

  cron.schedule(
    cronTime,
    () => {
      sendTemplateMessage(to, templateName);
      console.log(
        `Scheduled template "${templateName}" sent to ${to} on ${date}`
      );
    },
    {
      timezone: "Etc/UTC", // You can adjust the timezone according to your needs
    }
  );
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});
