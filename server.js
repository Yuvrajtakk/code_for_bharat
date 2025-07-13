const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const { generateText } = require("ai")
const { openai } = require("@ai-sdk/openai")
const twilio = require("twilio")
const Scheme = require("./models/Scheme")

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected to bharat_sanchar_ai database"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Twilio Client
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)

// Routes

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Bharat Sanchar AI Backend is running!" })
})

// POST /ask endpoint
app.post("/ask", async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ error: "Query is required" })
    }

    // Search for relevant schemes based on keywords
    const schemes = await Scheme.find({
      $or: [
        { keywords: { $regex: query, $options: "i" } },
        { scheme_name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { eligibility: { $regex: query, $options: "i" } },
        { benefits: { $regex: query, $options: "i" } },
      ],
    }).limit(3)

    let contextInfo = ""
    if (schemes.length > 0) {
      contextInfo = schemes
        .map(
          (scheme) =>
            `योजना: ${scheme.scheme_name}\nश्रेणी: ${scheme.category}\nपात्रता: ${scheme.eligibility}\nलाभ: ${scheme.benefits}\nआवेदन कैसे करें: ${scheme.how_to_apply}`,
        )
        .join("\n\n")
    }

    // Generate AI response using OpenAI
    const systemPrompt = `आप भारत संचार AI हैं, जो भारत सरकार की योजनाओं के बारे में हिंदी में जानकारी देते हैं। आपको उपयोगकर्ता के प्रश्न का उत्तर सरल और स्पष्ट हिंदी में देना है। यदि कोई विशिष्ट योजना की जानकारी उपलब्ध है, तो उसका उपयोग करें।`

    const userPrompt = `प्रश्न: ${query}\n\n${contextInfo ? `संबंधित योजनाएं:\n${contextInfo}` : "कोई विशिष्ट योजना नहीं मिली।"}\n\nकृपया इस प्रश्न का उत्तर हिंदी में दें।`

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"),
      system: systemPrompt,
      prompt: userPrompt,
    })

    res.json({ answer: text })
  } catch (error) {
    console.error("Error in /ask endpoint:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// POST /send-sms endpoint
app.post("/send-sms", async (req, res) => {
  try {
    const { phone, message } = req.body

    if (!phone || !message) {
      return res.status(400).json({ error: "Phone and message are required" })
    }

    // Send SMS using Twilio
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phone,
    })

    res.json({ message: "SMS sent" })
  } catch (error) {
    console.error("Error sending SMS:", error)
    res.status(500).json({ error: "Failed to send SMS" })
  }
})

// Get all schemes endpoint (for testing)
app.get("/schemes", async (req, res) => {
  try {
    const schemes = await Scheme.find()
    res.json(schemes)
  } catch (error) {
    console.error("Error fetching schemes:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

module.exports = app
