const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const twilio = require("twilio");
const Scheme = require("./models/Scheme");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// MongoDB — non-blocking, safe
// ─────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.warn("⚠️  MONGODB_URI not set — DB features disabled");
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));
}

// ─────────────────────────────────────────────
// Twilio — optional, safe init
// ─────────────────────────────────────────────
let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  try {
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    console.log("✅ Twilio initialized");
  } catch (err) {
    console.warn("⚠️  Twilio init failed:", err.message);
  }
} else {
  console.warn("⚠️  Twilio env vars missing — SMS disabled");
}

// ─────────────────────────────────────────────
// OpenAI via fetch — avoids SDK version issues
// ─────────────────────────────────────────────
async function generateAIResponse(systemPrompt, userPrompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "कोई उत्तर नहीं मिला।";
}

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Bharat Sanchar AI Backend is running 🚀",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    twilio: twilioClient ? "configured" : "disabled",
    openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
  });
});

// ─────────────────────────────────────────────
// POST /ask
// ─────────────────────────────────────────────
app.post("/ask", async (req, res) => {
  const { query } = req.body;

  if (!query || typeof query !== "string" || query.trim() === "") {
    return res.status(400).json({ error: "Query is required and must be a non-empty string" });
  }

  // 1. Fetch relevant schemes from DB (safe — skip if DB down)
  let schemes = [];
  try {
    if (mongoose.connection.readyState === 1) {
      schemes = await Scheme.find({
        $or: [
          { keywords: { $regex: query.trim(), $options: "i" } },
          { scheme_name: { $regex: query.trim(), $options: "i" } },
          { category: { $regex: query.trim(), $options: "i" } },
        ],
      }).limit(3);
    }
  } catch (dbErr) {
    console.error("⚠️  DB query error (non-fatal):", dbErr.message);
  }

  // 2. Build context
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
      : "कोई विशेष योजना नहीं मिली। सामान्य जानकारी दें।";

  const systemPrompt =
    "आप Bharat Sanchar AI हैं। आप भारत सरकार की योजनाओं के बारे में सरल हिंदी में जवाब देते हैं। जानकारी सटीक और संक्षिप्त रखें।";
  const userPrompt = `प्रश्न: ${query}\n\nसंदर्भ:\n${contextInfo}`;

  // 3. Call OpenAI (safe)
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI service not configured. Please set OPENAI_API_KEY.",
      fallback: contextInfo !== "कोई विशेष योजना नहीं मिली। सामान्य जानकारी दें।" ? contextInfo : null,
    });
  }

  try {
    const text = await generateAIResponse(systemPrompt, userPrompt);
    return res.json({ answer: text });
  } catch (aiErr) {
    console.error("❌ AI error:", aiErr.message);
    return res.status(502).json({
      error: "AI service temporarily unavailable. Please try again.",
      detail: process.env.NODE_ENV === "development" ? aiErr.message : undefined,
    });
  }
});

// ─────────────────────────────────────────────
// POST /send-sms
// ─────────────────────────────────────────────
app.post("/send-sms", async (req, res) => {
  if (!twilioClient) {
    return res.status(503).json({ error: "SMS service not configured" });
  }

  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: "Phone and message are required" });
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    res.json({ message: "SMS sent ✅" });
  } catch (err) {
    console.error("❌ SMS error:", err.message);
    res.status(500).json({ error: "Failed to send SMS", detail: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /schemes
// ─────────────────────────────────────────────
app.get("/schemes", async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const schemes = await Scheme.find().select("-__v");
    res.json(schemes);
  } catch (err) {
    console.error("❌ /schemes error:", err.message);
    res.status(500).json({ error: "Failed to fetch schemes" });
  }
});

// ─────────────────────────────────────────────
// 404 handler
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─────────────────────────────────────────────
// Global error handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─────────────────────────────────────────────
// Start Server — bind 0.0.0.0 for Render
// ─────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
