require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cron = require("node-cron");
const moment = require("moment-timezone");

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

          // Simulate capturing the user's timezone (in reality, you'd need a way to determine or receive this)
          const userTimezone = "Europe/Amsterdam"; // Example; in practice, capture this dynamically

          if (msg_body === "start") {
            // Send the Day 1 template immediately
            sendTemplateMessage(from, templateNames[0]);

            // Schedule the next 27 templates at 7:00 AM in the user's timezone
            for (let i = 1; i < templateNames.length; i++) {
              scheduleMessageAt7AM(from, templateNames[i], i, userTimezone);
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
    console.error("Full error:", error); // Additional error logging
  }
}

// Function to schedule a message at 7:00 AM daily in the user's timezone
function scheduleMessageAt7AM(to, templateName, dayOffset, timezone) {
  const startDate = moment().tz(timezone).startOf("day").add(dayOffset, "days");
  const cronTime = `${startDate.minutes()} ${startDate.hours()} ${startDate.date()} ${
    startDate.month() + 1
  } *`;

  cron.schedule(
    cronTime,
    () => {
      console.log(
        `Running scheduled job for ${templateName} at ${moment()
          .tz(timezone)
          .format()}`
      );
      sendTemplateMessage(to, templateName);
    },
    {
      timezone: timezone, // Schedule in the user's timezone
    }
  );

  console.log(
    `Scheduled template "${templateName}" to be sent to ${to} at 7:00 AM ${timezone} time on day ${dayOffset}.`
  );
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});
