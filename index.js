require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const cron = require("node-cron");
const moment = require("moment-timezone");

const app = express();
app.use(bodyParser.json());

const templateNames = [
  { name: "_dag_1_intro__dutch", time: 0 },
  { name: "start__dag_2", time: 24 },
  { name: "start__dag_3", time: 48 },
  { name: "start__dag_4", time: 72 },
  { name: "start__dag_5", time: 96 },
  { name: "start__dag_6", time: 120 },
  { name: "start__dag7", time: 144 },
  { name: "start__dag8", time: 168 },
  { name: "start__dag9", time: 192 },
  { name: "start__dag10", time: 216 },
  { name: "start__dag11", time: 240 },
  { name: "start__dag12", time: 264 },
  { name: "start__dag13", time: 288 },
  { name: "start__dag14", time: 312 },
  { name: "start__dag15", time: 336 },
  { name: "start__dag16", time: 360 },
  { name: "start__dag17", time: 384 },
  { name: "start__dag18", time: 408 },
  { name: "start__dag19", time: 432 },
  { name: "start__dag20", time: 456 },
  { name: "start__dag21", time: 480 },
  { name: "start__dag22", time: 504 },
  { name: "start__dag23", time: 528 },
  { name: "start__dag24", time: 552 },
  { name: "start__dag25", time: 576 },
  { name: "start__dag26", time: 600 },
  { name: "start__dag27", time: 624 },
  { name: "kopie_van_start__dag28", time: 648 },
];

// Object to store scheduled messages in memory
const scheduledMessages = {};

app.get("/test", (req, res) => {
  res.send("Server is running successfully")
})

app.get('/webhook', (req, res) => {
  const challenge = req.query['hub.challenge'];  // Facebook sends the challenge parameter
  const verifyToken = req.query['hub.verify_token'];  // Token to verify with your provided token

  // Replace with your verification token
  // const myVerifyToken = "1ec7-2401-4900-1c43-bd37-654e-2dc5-2e7c-de09";
  const myVerifyToken = process.env.VERIFY_TOKEN;

  if (verifyToken === myVerifyToken) {
    res.send(challenge);  // Respond with the challenge token to verify
  } else {
    res.sendStatus(403);  // Forbidden if tokens do not match
  }
});

app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log("Inside webhook");

  if (body.object === "whatsapp_business_account") {
    body.entry.forEach(async (entry) => {
      const changes = entry.changes;
      let messagesFound = false;

      for (const change of changes) {
        if (
          change.value &&
          change.value.messages &&
          change.value.messages.length > 0
        ) {
          const messageData = change.value.messages[0];
          const from = messageData.from; // The WhatsApp ID of the user who sent the message

          if (messageData.text && messageData.text.body) {
            const msg_body = messageData.text.body.toLowerCase();
            const userTimezone = "Europe/Amsterdam"; // Example; capture this dynamically if needed

            if (msg_body === "start") {
              // Send the Day 1 template immediately
              sendTemplateMessage(from, templateNames[0].name);

              // Schedule the next 27 templates every 24 hours

              for (let i = 1; i < templateNames.length; i++) {
                // const timeInSeconds = templateNames[i].time * 3600;
                let nextTriggerTime = moment().tz(userTimezone).add(templateNames[i].time, "hours");
                console.log(templateNames[i].time, nextTriggerTime);
                scheduleMessage(
                  from,
                  templateNames[i].name,
                  nextTriggerTime,
                  userTimezone
                );
                // nextTriggerTime = nextTriggerTime.add(24, "hours");
              }
            }
            messagesFound = true;
          }
        }
      }

      if (!messagesFound) {
        console.log("No messages found in this webhook event");
      }
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

app.get('/keep-alive', (req, res) => {
  console.log('Keep-alive ping received');
  res.send('Server is awake');
});

// Function to schedule a message
function scheduleMessage(to, templateName, triggerTime, timezone) {
  scheduledMessages[to] = scheduledMessages[to] || [];
  scheduledMessages[to].push({
    templateName: templateName,
    triggerTime: triggerTime,
    timezone: timezone,
    sent: false,
  });
  console.log(
    `Scheduled template "${templateName}" for ${to} at ${triggerTime.format()} (${timezone}).`
  );
}

// Cron job to check for pending messages every 5 minutes
cron.schedule("* * * * *", async () => {
  try {
    const keepAliveData = await axios.get(`https://nodejs-whatsapp-automation.onrender.com/keep-alive`);
    if (keepAliveData.status === 200) {
      console.log("Keep-alive ping received", keepAliveData.data)
    }
    console.log(`Starting 5-minute check at ${moment().format()}`);
    const now = moment();
    console.log("scheduledMessages", scheduledMessages);

    for (const [to, messages] of Object.entries(scheduledMessages)) {
      messages.forEach((message) => {
        const bufferTimeStart = moment(message.triggerTime).subtract(
          5,
          "minutes"
        );
        const bufferTimeEnd = moment(message.triggerTime).add(5, "minutes");

        if (!message.sent && now.isBetween(bufferTimeStart, bufferTimeEnd)) {
          sendTemplateMessage(to, message.templateName);
          message.sent = true;
          console.log(
            `Sent message "${message.templateName}" to ${to} at ${now.format()}`
          );
        }
      });
    }

    console.log(`Finished 5-minute check at ${moment().format()}`);
  } catch (error) {
    console.error("Error during 5-minute cron job execution:", error);
  }
});

console.log("5-minute cron job scheduled successfully.");

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});
