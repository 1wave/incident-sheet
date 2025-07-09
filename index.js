require("dotenv").config();
const { google } = require("googleapis");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_FILE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// Function เช็ค pattern Incident
function getField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}

app.post("/incident", async (req, res) => {
  try {
    const data = req.body.msg;

    const incident = getField(data, [/IncidentNumber[:：]?\s*(.+)/i]);
    const branch = getField(data, [
      /หน่วยงาน\s*\/.*\/.*ชั้น[:\s]*(.+)/i,
      /ชื่อสาขา\s*[:\s]*(.+)/i,
      /ฝ่ายงาน\/สาขา[:\s]*(.+)/i,
      /สถานที่[:\s]*(.+)/i,
    ]);
    const error = getField(data, [
      /อาการเสีย\/Error message\s*[:：]\s*(.+)/i,
      /อาการ[:\s]*(.+)/i,
      /ปัญหา\s*[:：]\s*(.*)/i,
    ]);
    console.log({ incident, branch, error });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    const formatDate =
      new Date().toLocaleDateString("en-GB") +
      new Date().toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "sheet1!A1",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[formatDate, incident, branch, error]],
      },
    });

    res.status(200).send("Success");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error!");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
