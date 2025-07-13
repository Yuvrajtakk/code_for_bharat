# Bharat Sanchar AI Backend

A Node.js + Express backend for the Bharat Sanchar AI system that provides information about Indian government schemes through AI-powered responses and SMS notifications.

## Features

- **MongoDB Integration**: Stores government scheme information
- **AI-Powered Responses**: Uses OpenAI GPT-3.5 to generate Hindi responses
- **SMS Notifications**: Twilio integration for sending SMS
- **RESTful API**: Clean API endpoints for frontend integration
- **Render.com Ready**: Configured for easy deployment

## API Endpoints

### POST `/ask`
- **Purpose**: Get AI-generated responses about government schemes
- **Body**: `{ "query": "your question in Hindi or English" }`
- **Response**: `{ "answer": "AI-generated Hindi response" }`

### POST `/send-sms`
- **Purpose**: Send SMS notifications
- **Body**: `{ "phone": "+919876543210", "message": "Your message" }`
- **Response**: `{ "message": "SMS sent" }`

### GET `/schemes`
- **Purpose**: Get all available schemes (for testing)
- **Response**: Array of scheme objects

## Setup Instructions

### 1. Environment Variables
Create a `.env` file based on `.env.example`:

\`\`\`env
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
TWILIO_SID=your_twilio_account_sid
TWILIO_TOKEN=your_twilio_auth_token
TWILIO_PHONE=your_twilio_phone_number
PORT=5000
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Seed Database
\`\`\`bash
npm run seed
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

### 5. Start Production Server
\`\`\`bash
npm start
\`\`\`

## Deployment on Render.com

1. **Create a new Web Service** on Render.com
2. **Connect your GitHub repository**
3. **Configure the service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. **Add Environment Variables** in Render dashboard
5. **Deploy**

## Database Schema

### Scheme Model
\`\`\`javascript
{
  scheme_name: String,
  category: String,
  eligibility: String,
  benefits: String,
  how_to_apply: String,
  keywords: String,
  language_version: {
    hi: String
  }
}
\`\`\`

## Frontend Integration

### Example API Calls

\`\`\`javascript
// Ask a question
const response = await fetch('https://your-backend-url.com/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: 'किसान योजना के बारे में बताएं' })
});
const data = await response.json();

// Send SMS
const smsResponse = await fetch('https://your-backend-url.com/send-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    phone: '+919876543210', 
    message: 'Your scheme information...' 
  })
});
\`\`\`

## Technologies Used

- **Node.js & Express**: Backend framework
- **MongoDB & Mongoose**: Database and ODM
- **OpenAI API**: AI text generation
- **Twilio**: SMS service
- **AI SDK**: Unified AI integration
- **CORS**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
