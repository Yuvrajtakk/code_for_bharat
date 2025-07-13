const mongoose = require("mongoose")

const schemeSchema = new mongoose.Schema(
  {
    scheme_name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    eligibility: {
      type: String,
      required: true,
    },
    benefits: {
      type: String,
      required: true,
    },
    how_to_apply: {
      type: String,
      required: true,
    },
    keywords: {
      type: String,
      required: true,
    },
    language_version: {
      hi: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  },
)

// Create indexes for better search performance
schemeSchema.index({ keywords: "text", scheme_name: "text", category: "text" })

module.exports = mongoose.model("Scheme", schemeSchema)
