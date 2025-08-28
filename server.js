// server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.use(bodyParser.json());
app.use(cors());
// Serve frontend from public folder
app.use(express.static("public"));


// === CONFIG ===
const SHEET_ID = process.env.SPREADSHEET_ID || "1GOTjxdcb2hTqTqR_xG-4WCk6gADnHiSb9LYzUufBSwQ";
const SHEET_NAME = "Sheet1"; // change if your sheet tab has a different name

// === Google Auth (service account) ===
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function appendBooking(row) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });
  return sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:I`,
    valueInputOption: "USER_ENTERED",
    resource: { values: [row] },
  });
}

// === Endpoints ===
app.post("/api/check", (req, res) => {
  const { roomType, checkin, checkout } = req.body;
  if (!roomType || !checkin || !checkout) {
    return res.json({ ok: false, message: "Missing fields" });
  }
  // Minimal demo availability: always available
  res.json({ ok: true, message: "Room available ✅" });
});

app.post("/api/book", async (req, res) => {
  try {
    const { name, email, checkin, checkout, roomType, guests, price } = req.body;
    if (!name || !email || !checkin || !checkout || !roomType) {
      return res.json({ ok: false, message: "Missing required fields" });
    }

    const ref = "REF-" + Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    const timestamp = new Date().toISOString();
    const row = [timestamp, ref, name, email, checkin, checkout, roomType, guests, price];

    await appendBooking(row);

    res.json({ ok: true, ref, message: "Booking saved to Google Sheets ✅" });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, message: "Error saving booking", error: err.message });
  }
});

// health check
app.get("/health", (req, res) => res.send("ok"));

// === Serve frontend ===
// this will serve index.html and any CSS/JS in the same folder
app.use(express.static(__dirname));

// === Start server ===
// serve index.html
const fs = require("fs");
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

