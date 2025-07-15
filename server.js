const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")
const { generateText } = require("ai")
const { google } = require("@ai-sdk/google")
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

// POST /ask endpoint with improved error handling
app.post("/ask", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    let schemes;
    // 1. Try to get data from the database
    try {
      schemes = await Scheme.find({
        $or: [
          { keywords: { $regex: query, $options: "i" } },
          { scheme_name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
        ],
      }).limit(3);
    } catch (dbError) {
      console.error("Error querying database:", dbError);
      // Don't expose detailed database errors to the client
      return res.status(500).json({ error: "A database error occurred." });
    }

    // 2. Prepare the context and prompts
    let contextInfo = "";
    if (schemes.length > 0) {
      contextInfo = schemes
        .map(
          (scheme) =>
            `Scheme: ${scheme.scheme_name}\nCategory: ${scheme.category}\nEligibility: ${scheme.eligibility}\nBenefits: ${scheme.benefits}\nHow to Apply: ${scheme.how_to_apply}`
        )
        .join("\n\n");
    }

    const systemPrompt = `You are Bharat Sanchar AI, an assistant providing information about Indian government schemes in Hindi. Answer the user's question clearly and simply in Hindi. Use the provided context if available.`;
    const userPrompt = `Question: ${query}\n\n${contextInfo ? `Related Schemes:\n${contextInfo}` : "No specific scheme found."}\n\nPlease answer this question in Hindi.`;

    // 3. Try to generate a response from the AI
    try {
      const { text } = await generateText({
        model: google("gemini-pro"),
        system: systemPrompt,
        prompt: userPrompt,
      });
      res.json({ answer: text });
    } catch (aiError) {
      console.error("Error generating AI response:", aiError);
      // Provide a more specific error from the AI service
      return res.status(500).json({ error: `AI service failed: ${aiError.message}` });
    }

  } catch (error) {
    // This is a general catch-all for any other unexpected errors
    console.error("An unexpected error occurred in /ask endpoint:", error);
    res.status(500).json({ error: "An unexpected internal server error occurred." });
  }
});


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
