const express = require('express');
const { google } = require("googleapis");
const line = require('@line/bot-sdk');
require('dotenv').config();

const app = express();

// LINE Bot configuration
const lineConfig = {
    channelAccessToken: process.env.token,
    channelSecret: process.env.secretcode
};

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const spreadsheetId = "1ZZ27xie5M0HG-RIGyXSU9hMw6Z_0PIzj7_Lz5sA77BM";

// Middleware for LINE webhook
app.post('/webhook', line.middleware(lineConfig), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvents))
        .then((result) => res.json(result))
        .catch((error) => {
            console.error(error);
            res.status(500).send("Error processing LINE events");
        });
});

// Handle different types of LINE events
async function handleEvents(event) {
    console.log(event);
    // Extract relevant data based on the event type
    const data = [
        event?.type || '',
        event?.message?.type || '',
        event?.message?.id || '',
        event?.message?.quoteToken || '',
        event?.message?.text || '',
        JSON.stringify(event?.message.emojis) || '',
        event?.message?.stickerId || '',
        event?.message?.packageId || '',
        event?.message?.stickerResourceType || '',
        JSON.stringify(event?.message?.keywords) || '',
        JSON.stringify(event?.message?.contentProvider)||'',
        event?.message?.duration || '',
        event?.webhookEventId || '',
        JSON.stringify(event?.deliveryContext) || '',
        event?.timestamp || '',
        event?.source.type || '',
        event?.source.userId || '',
        event?.replyToken || '',
        event?.mode || ''
    ];

    // Write to Google Sheets
    await writeToGoogleSheet(data);
}

// Function to write data to Google Sheets
async function writeToGoogleSheet(data) {
    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: "v4", auth: client });

        await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: "Sheet1!A:S",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [data]
            }
        });

        console.log("Data written to Google Sheets successfully.");
    } catch (error) {
        console.error("Failed to write to Google Sheets:", error);
    }
}

// Basic GET route for testing
app.get('/', async (req, res) => {
    res.send("OK");
});

// Start the server
app.listen(3000, () => console.log('Server started on port 3000'));