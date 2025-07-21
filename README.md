# Telegram ↔ Bubble Gateway Server

A Node.js gateway server that enables real-time communication between Bubble.io customers and Telegram team members using forum topics.

## 🚀 Features

- **Bubble → Telegram**: Sends customer messages to existing Telegram topics
- **Telegram → Bubble**: Receives team replies via webhook and forwards to Bubble
- **Topic Management**: Bubble manages topic creation and provides topic IDs
- **Team Filtering**: Only James and Simon can reply
- **Webhook Mode**: Real-time message processing via Telegram webhooks
- **Security**: Rate limiting, CORS, and helmet protection
- **Health Monitoring**: Built-in health check endpoint

## 📋 Prerequisites

1. **Telegram Bot Token**: Create a bot via [@BotFather](https://t.me/botfather)
2. **Telegram Group**: Create a supergroup with Topics enabled
3. **Bubble API Key**: Get from your Bubble app settings
4. **Node.js**: Version 16 or higher

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Required environment variables:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_GROUP_ID=your_telegram_group_id_here

# Team Member Telegram IDs
JAMES_TELEGRAM_ID=1131267522
SIMON_TELEGRAM_ID=2092022125

# Bubble API Configuration
BUBBLE_API_URL=https://your-bubble-app.bubbleapps.io
BUBBLE_API_KEY=your_bubble_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Webhook Configuration
WEBHOOK_BASE_URL=https://your-domain.com
```

### 3. Telegram Bot Setup

1. Add your bot to the Telegram group
2. Give the bot admin rights:
   - ✅ Can manage topics
   - ✅ Can read messages
   - ✅ Can post messages
3. Add James and Simon as group members
4. **Important**: Your server must be accessible via HTTPS for webhooks to work

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

### Send Message to Telegram
```
POST /api/telegram/send
```

**Request Body (Existing Topic):**
```json
{
  "message": "Hello, I need help!",
  "topicId": 123,
  "chatChannelId": "bubble_chat_channel_id"
}
```

**Request Body (New Topic):**
```json
{
  "message": "Hello, I need help!",
  "customerId": "customer123",
  "chatChannelId": "bubble_chat_channel_id"
}
```

**Response:**
```json
{
  "success": true,
  "topicId": 123,
  "messageId": 456,
  "topicCreated": false
}
```

**Response (New Topic Created):**
```json
{
  "success": true,
  "topicId": 789,
  "messageId": 456,
  "topicCreated": true
}
```

### Webhook (Required)
```
POST /api/telegram/webhook
```
Receives messages from Telegram webhook. This endpoint is automatically configured when the server starts.

## 🔄 Flow Diagram

```
Bubble (with/without Topic ID) → Gateway → Telegram Topic
                                              ↓
Bubble ← Gateway ← Team Reply (Telegram)
```

**Topic Creation Flow:**
1. Bubble sends message without `topicId`
2. Gateway creates new Telegram topic
3. Gateway returns new `topicId` to Bubble
4. Bubble stores `topicId` for future messages

## 🧪 Testing

### Test the Gateway

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Send Test Message (Existing Topic):**
   ```bash
   curl -X POST http://localhost:3000/api/telegram/send \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Test message from Bubble",
       "topicId": 123,
       "chatChannelId": "test_channel_id"
     }'
   ```

3. **Create New Topic:**
   ```bash
   curl -X POST http://localhost:3000/api/telegram/send \
     -H "Content-Type: application/json" \
     -d '{
       "message": "First message from new customer",
       "customerId": "customer123",
       "chatChannelId": "test_channel_id"
     }'
   ```

### Test URL
Use the provided test URL: [https://everyevent.uk/version-test/chat_test](https://everyevent.uk/version-test/chat_test)

## 🔧 Bubble Integration

### Trigger API Call from Bubble

When a customer sends a message in Bubble, trigger a workflow that calls:

```
POST https://your-gateway-domain.com/api/telegram/send
```

### Receive Messages in Bubble

The gateway automatically sends team replies to your Bubble app via the API.

## 🚨 Production Considerations

1. **Webhook Security**: Implement webhook signature verification
2. **SSL**: Use HTTPS in production (required for Telegram webhooks)
3. **Webhook URL**: Set `WEBHOOK_BASE_URL` to your production domain
4. **Monitoring**: Add logging and monitoring
5. **Error Handling**: Implement retry logic for failed API calls
6. **Topic Management**: Bubble handles topic creation and storage

## 🐛 Troubleshooting

### Common Issues

1. **Bot can't create topics**: Check admin permissions
2. **Messages not received**: Verify team member IDs and webhook URL
3. **Webhook not working**: Ensure HTTPS is enabled and `WEBHOOK_BASE_URL` is set
4. **API errors**: Check Bubble API key and URL
5. **CORS issues**: Verify CORS configuration

### Logs

The server logs all operations. Check console output for debugging.

## 📝 License

MIT License - feel free to modify and use as needed. 