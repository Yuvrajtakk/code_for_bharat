const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { generateText } = require("ai");
const { openai } = require("@ai-sdk/openai");
const twilio = require("twilio");
const Scheme = require("./models/Scheme");

dotenv.config();

const app = express();

// ✅ IMPORTANT for Render
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// =======================
// MongoDB Connection (SAFE)
// =======================
if (!process.env.MONGODB_URI) {
  console.warn("⚠️ No MongoDB URI provided");
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));
}

// =======================
// Twilio (SAFE INIT)
// =======================
let twilioClient = null;

if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_TOKEN
  );
} else {
  console.warn("⚠️ Twilio not configured");
}

// =======================
// ROUTES
// =======================

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Bharat Sanchar AI Backend is running 🚀" });
});

// =======================
// ASK ROUTE
// =======================
app.post("/ask", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    let schemes = [];

    // DB fetch (safe)
    try {
      if (mongoose.connection.readyState === 1) {
        schemes = await Scheme.find({
          $or: [
            { keywords: { $regex: query, $options: "i" } },
            { scheme_name: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
          ],
        }).limit(3);
      }
    } catch (dbError) {
      console.error("DB error:", dbError);
    }

    // Context
    const contextInfo =
      schemes.length > 0
        ? schemes
            .map(
              (s) =>
                `Scheme: ${s.scheme_name}
Category: ${s.category}
Eligibility: ${s.eligibility}
Benefits: ${s.benefits}
How to Apply: ${s.how_to_apply}`
            )
            .join("\n\n")
        : "No specific scheme found.";

    const systemPrompt = `You are Bharat Sanchar AI. Answer in simple Hindi.`;
    const userPrompt = `Question: ${query}\n\n${contextInfo}`;

    // AI response
    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      system: systemPrompt,
      prompt: userPrompt,
    });

    res.json({ answer: text });
  } catch (error) {
    console.error("❌ /ask error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
// SMS ROUTE
// =======================
app.post("/send-sms", async (req, res) => {
  if (!twilioClient) {
    return res.status(500).json({ error: "Twilio not configured" });
  }

  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone & message required" });
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });

    res.json({ message: "SMS sent ✅" });
  } catch (error) {
    console.error("SMS error:", error);
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

// =======================
// GET SCHEMES
// =======================
app.get("/schemes", async (req, res) => {
  try {
    const schemes = await Scheme.find();
    res.json(schemes);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// =======================
// START SERVER
// =======================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;