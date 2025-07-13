const mongoose = require("mongoose")
const dotenv = require("dotenv")
const Scheme = require("../models/Scheme")

dotenv.config()

// Sample scheme data
const sampleSchemes = [
  {
    scheme_name: "प्रधानमंत्री जन धन योजना",
    category: "वित्तीय समावेशन",
    eligibility: "भारत का कोई भी नागरिक जिसके पास बैंक खाता नहीं है",
    benefits: "मुफ्त बैंक खाता, डेबिट कार्ड, 2 लाख रुपये का दुर्घटना बीमा, ओवरड्राफ्ट सुविधा",
    how_to_apply: "नजदीकी बैंक शाखा में जाकर आधार कार्ड के साथ आवेदन करें",
    keywords: "बैंक खाता, जन धन, वित्तीय समावेशन, मुफ्त खाता, डेबिट कार्ड",
    language_version: {
      hi: "प्रधानमंत्री जन धन योजना एक वित्तीय समावेशन कार्यक्रम है जो सभी भारतीयों को बैंकिंग सेवाएं प्रदान करता है।",
    },
  },
  {
    scheme_name: "आयुष्मान भारत योजना",
    category: "स्वास्थ्य",
    eligibility: "गरीब और कमजोर परिवार (SECC 2011 के अनुसार)",
    benefits: "5 लाख रुपये तक का मुफ्त इलाज, कैशलेस उपचार, पैनल अस्पतालों में सुविधा",
    how_to_apply: "नजदीकी CSC केंद्र या अस्पताल में आयुष्मान कार्ड बनवाएं",
    keywords: "स्वास्थ्य बीमा, आयुष्मान भारत, मुफ्त इलाज, 5 लाख कवर, कैशलेस",
    language_version: {
      hi: "आयुष्मान भारत योजना दुनिया की सबसे बड़ी स्वास्थ्य बीमा योजना है जो गरीब परिवारों को मुफ्त इलाज प्रदान करती है।",
    },
  },
  {
    scheme_name: "प्रधानमंत्री किसान सम्मान निधि",
    category: "कृषि",
    eligibility: "छोटे और सीमांत किसान (2 हेक्टेयर तक भूमि)",
    benefits: "सालाना 6000 रुपये की आर्थिक सहायता (तीन किस्तों में)",
    how_to_apply: "PM-KISAN पोर्टल पर ऑनलाइन आवेदन या CSC केंद्र में जाकर",
    keywords: "किसान, PM-KISAN, 6000 रुपये, कृषि सहायता, सीमांत किसान",
    language_version: {
      hi: "प्रधानमंत्री किसान सम्मान निधि योजना छोटे किसानों को आर्थिक सहायता प्रदान करती है।",
    },
  },
  {
    scheme_name: "बेटी बचाओ बेटी पढ़ाओ",
    category: "महिला कल्याण",
    eligibility: "सभी बालिकाएं और उनके परिवार",
    benefits: "बालिकाओं की शिक्षा और सुरक्षा, जागरूकता कार्यक्रम, छात्रवृत्ति",
    how_to_apply: "स्थानीय महिला एवं बाल विकास कार्यालय में संपर्क करें",
    keywords: "बेटी बचाओ, बालिका शिक्षा, महिला सशक्तिकरण, छात्रवृत्ति",
    language_version: {
      hi: "बेटी बचाओ बेटी पढ़ाओ योजना बालिकाओं की सुरक्षा और शिक्षा को बढ़ावा देती है।",
    },
  },
  {
    scheme_name: "प्रधानमंत्री आवास योजना",
    category: "आवास",
    eligibility: "आर्थिक रूप से कमजोर वर्ग, निम्न आय वर्ग, मध्यम आय वर्ग",
    benefits: "सब्सिडी के साथ घर खरीदने या बनाने में सहायता, कम ब्याज दर",
    how_to_apply: "PMAY पोर्टल पर ऑनलाइन आवेदन या बैंक में जाकर",
    keywords: "आवास योजना, घर, सब्सिडी, PMAY, कम ब्याज दर",
    language_version: {
      hi: "प्रधानमंत्री आवास योजना सभी को पक्का घर उपलब्ध कराने का लक्ष्य रखती है।",
    },
  },
]

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("Connected to MongoDB")

    // Clear existing data
    await Scheme.deleteMany({})
    console.log("Cleared existing schemes")

    // Insert sample data
    await Scheme.insertMany(sampleSchemes)
    console.log("Sample schemes inserted successfully")

    // Close connection
    await mongoose.connection.close()
    console.log("Database seeding completed")
  } catch (error) {
    console.error("Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seeding function
seedDatabase()
