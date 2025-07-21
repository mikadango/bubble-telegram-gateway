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

---

## 🚀 How to Deploy This Gateway to Render

This guide will help you deploy the Telegram ↔ Bubble Gateway Server to the cloud using [Render.com](https://render.com/). Render is a free and easy-to-use platform for hosting web apps. You do **not** need to know how to code to follow these steps!

### **What You Need Before You Start**
- A GitHub account ([sign up here](https://github.com/))
- A Render account ([sign up here](https://dashboard.render.com/register))
- Your environment variables (see `.env.example` in this project)

### **Step 1: Upload Your Project to GitHub**
1. Go to [GitHub.com](https://github.com/) and log in.
2. Click the **+** icon (top right) → **New repository**.
3. Name your repository (e.g., `bubble-telegram-gateway`).
4. **Do not** initialize with a README or .gitignore (you already have these).
5. Click **Create repository**.
6. On your computer, open your project folder.
7. Right-click and select **Git Bash Here** (or open Terminal/Command Prompt and `cd` to your folder).
8. Run these commands (replace `YOUR_GITHUB_USERNAME` and `REPO_NAME`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/REPO_NAME.git
   git push -u origin main
   ```
9. Refresh your GitHub repo page. You should see your project files.

### **Alternative: Using a Repository You’ve Been Invited To**
If someone has invited you as a collaborator to their GitHub repository (instead of you creating your own):
1. Check your email or GitHub notifications for the invitation and accept it.
2. Once accepted, the repository will appear in your GitHub account under "Repositories" and in the Render dashboard when you connect your GitHub account.
3. You can now follow the same Render deployment steps below, selecting the shared repository when prompted.
4. You do **not** need to fork or copy the repository—just accept the invite and use it directly.

### **Step 2: Create a Render Account and Start a New Web Service**
1. Go to [Render.com](https://render.com/) and sign up/log in.
2. Click the **New +** button (top left), then select **Web Service**.
3. Click **Connect account** under GitHub and authorize Render to access your repositories.
4. Select your repository from the list and click **Connect**.

### **Step 3: Configure Your Web Service**
1. **Name:** Enter a name (this will be part of your app’s URL, e.g., `my-gateway.onrender.com`).
2. **Region:** Leave as default unless you have a preference.
3. **Branch:** Leave as `main` (unless you want to deploy a different branch).
4. **Build Command:** Enter:
   ```bash
   npm install
   ```
5. **Start Command:** Enter:
   ```bash
   npm start
   ```
6. **Instance Type:** The free tier is fine for most use cases.

### **Step 4: Add Environment Variables**
1. Click the **Environment** tab or scroll to the Environment section.
2. For each variable in `.env.example`, click **Add Environment Variable** and enter the key and value (e.g., `TELEGRAM_BOT_TOKEN`, etc.).
   - **Tip:** You can copy-paste the variable names from `.env.example`.
   - **Do not** include the `#` or comments.
3. If you have a `.env` file, you can click **Add from .env file** and paste the contents.

### **Step 5: Create and Deploy**
1. Review your settings.
2. Click **Create Web Service** at the bottom.
3. Wait a few minutes while Render builds and deploys your app. You can watch the logs for progress.

### **Step 6: Verify Your Deployment**
1. Once deployed, you’ll see a green “Live” indicator.
2. Click the link to your new web service (e.g., `https://my-gateway.onrender.com`).
3. Test the health endpoint by visiting:
   - `https://YOUR-APP-NAME.onrender.com/health`
   - You should see `{ "status": "OK", ... }`
4. If you see errors, check the **Logs** tab for details.

### **Step 7: Update Environment Variables (If Needed)**
- If you need to change any environment variable, go to the **Environment** tab, edit the value, and click **Save Changes**. Then click **Manual Deploy** to redeploy with the new settings.

### **Step 8: (Optional) Set Up a Custom Domain**
- In the **Settings** tab, you can add your own domain (e.g., `gateway.yourdomain.com`). Follow Render’s instructions for DNS setup.

---

**You’re done!** Your gateway is now live on the internet. You can connect Bubble and Telegram as described above.

If you get stuck, check the [Render Node.js guide](https://render.com/docs/deploy-node-express-app) or ask for help in the Render community. 