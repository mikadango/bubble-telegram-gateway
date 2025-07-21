require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Team member IDs
const TEAM_MEMBERS = [
  parseInt(process.env.JAMES_TELEGRAM_ID),
  parseInt(process.env.SIMON_TELEGRAM_ID)
];



// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Bubble → Telegram: Send message to existing topic or create new one
app.post('/api/telegram/send', async (req, res) => {
  try {
    console.log('\n📨 NEW REQUEST: /api/telegram/send');
    console.log('⏰ Time:', new Date().toISOString());
    
    // Accept chat_id, subject, message, email from Bubble
    const { chat_id, subject, message, email } = req.body;
    console.log('📝 Request Data:', {
      chat_id: chat_id || 'not provided',
      subject: subject || 'not provided',
      message: message ? `${message.slice(0, 50)}${message.length > 50 ? '...' : ''}` : 'not provided',
      email: email || 'not provided'
    });

    // Map chat_id to topicId for internal logic, treating empty as invalid
    const topicId = chat_id;
    console.log(`🔄 Mapped chat_id to topicId: ${topicId}`);

    if (!message) {
      console.log('❌ Validation Failed:', {
        hasMessage: !!message,
        chat_id_value: chat_id
      });
      return res.status(400).json({ 
        error: 'Missing required field: message' 
      });
    }

    // --- Helper: Compose the message ---
    function composeMessage(subject, message, email) {
      console.log('📋 Composing message...');
      let composedMessage = '';
      if (subject) {
        composedMessage += `**Subject:** ${subject}\n`;
        console.log('✍️ Added subject to message');
      }
      composedMessage += message;
      if (email) {
        composedMessage += `\n\n**Email:** ${email}`;
        console.log('✉️ Added email to message');
      }
      console.log('📎 Final message length:', composedMessage.length);
      return composedMessage;
    }

    // --- Helper: Send message to a topic ---
    async function sendMessageToTopic(targetTopicId, composedMessage) {
      console.log(`\n📤 SENDING MESSAGE:`);
      console.log(`🎯 Target Topic ID: ${targetTopicId}`);
      console.log(`📦 Group ID: ${process.env.TELEGRAM_GROUP_ID}`);
      const messageResult = await bot.sendMessage(
        process.env.TELEGRAM_GROUP_ID,
        `**Customer Message:**\n${composedMessage}`,
        {
          message_thread_id: targetTopicId,
          parse_mode: 'Markdown'
        }
      );
      console.log(`\n✅ SUCCESS:`);
      console.log(`📝 Message ID: ${messageResult.message_id}`);
      console.log(`💬 Topic ID: ${targetTopicId}`);
      return messageResult;
    }

    // --- Helper: Create a new topic ---
    async function createNewTopic(email) {
      if (!email) {
        console.log('❌ Cannot create new topic: No email provided');
        throw new Error('chat_id is 0 and email not provided for new topic creation');
      }
      console.log('\n🆕 CREATING NEW TOPIC (chat_id=0):');
      console.log(`- Customer Email: ${email}`);
      // Create new topic using email as the title
      const topicTitle = `Customer: ${email}`;
      console.log(`- Topic Title: ${topicTitle}`);
      const topicResult = await bot.createForumTopic(
        process.env.TELEGRAM_GROUP_ID,
        topicTitle,
        { icon_color: 0x6FB9F0 }
      );
      const newTopicId = topicResult.message_thread_id;
      console.log(`✅ New topic created: ${newTopicId}`);
      return newTopicId;
    }

    // Compose the message
    const composedMessage = composeMessage(subject, message, email);

    // If chat_id is 0, create a new topic
    if (Number(chat_id) === 0) {
      try {
        const newTopicId = await createNewTopic(email);
        console.log('\n📤 SENDING TO NEW TOPIC:');
        console.log(`- Topic ID: ${newTopicId}`);
        const newMessageResult = await sendMessageToTopic(newTopicId, composedMessage);
        console.log('\n✅ SUCCESS:');
        console.log(`- Message ID: ${newMessageResult.message_id}`);
        console.log(`- New Topic ID: ${newTopicId}`);
        return res.json({
          success: true,
          chat_id: newTopicId,
          messageId: newMessageResult.message_id,
          topicCreated: true
        });
      } catch (err) {
        if (err.message === 'chat_id is 0 and email not provided for new topic creation') {
          return res.status(400).json({ error: err.message });
        }
        throw err;
      }
    }

    // Try to send message to the topic (for non-zero chat_id)
    try {
      const messageResult = await sendMessageToTopic(topicId, composedMessage);
      res.json({
        success: true,
        chat_id: topicId,
        messageId: messageResult.message_id
      });
    } catch (sendError) {
      console.log('\n❌ ERROR SENDING MESSAGE:');
      console.log('🔍 Error Details:', {
        statusCode: sendError.response?.statusCode,
        description: sendError.response?.body?.description,
        message: sendError.message,
        code: sendError.code
      });
      // Check if topic doesn't exist (common error codes)
      const errorDescription = sendError.response?.body?.description || '';
      const isTopicError = errorDescription.includes('TOPIC_DELETED') || 
                          errorDescription.includes('message_thread_id') ||
                          errorDescription.includes('TOPIC_NOT_FOUND') ||
                          errorDescription.includes('Bad Request: message_thread_id') ||
                          errorDescription.includes('message thread not found');
      console.log(`\n🔍 ERROR ANALYSIS:`);
      console.log(`- Is Topic Error: ${isTopicError ? 'YES' : 'NO'}`);
      console.log(`- Error Description: "${errorDescription}"`);
      if (sendError.response?.statusCode === 400 && isTopicError) {
        try {
          const newTopicId = await createNewTopic(email);
          const newMessageResult = await sendMessageToTopic(newTopicId, composedMessage);
          res.json({
            success: true,
            chat_id: newTopicId,
            messageId: newMessageResult.message_id,
            topicCreated: true,
            topicRecreated: true
          });
        } catch (err) {
          if (err.message === 'chat_id is 0 and email not provided for new topic creation') {
            return res.status(400).json({ error: err.message });
          }
          throw err;
        }
      } else {
        console.log('\n❗ UNHANDLED ERROR:');
        console.log('- Not a topic error, re-throwing');
        throw sendError;
      }
    }
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error);
    console.log('- Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to send message to Telegram',
      details: error.message 
    });
  }
});

// Telegram → Bubble: Webhook for receiving team replies
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const { message } = req.body;

    // Verify it's from Telegram (in production, verify webhook signature)
    if (!message || !message.text) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Check if message is from a team member
    if (!TEAM_MEMBERS.includes(message.from.id)) {
      return res.status(200).json({ message: 'Ignored non-team message' });
    }

    // Check if message is in a topic
    if (!message.message_thread_id) {
      return res.status(200).json({ message: 'Ignored non-topic message' });
    }

    // Send message to Bubble with topic ID
    const bubbleResponse = await axios.post(
      `${process.env.BUBBLE_API_URL}/api/1.1/obj/chat_message`,
      {
        message: message.text,
        topic_id: message.message_thread_id,
        sender_type: 'team',
        sender_name: message.from.first_name || 'Team Member'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.BUBBLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ 
      success: true, 
      bubbleResponse: bubbleResponse.data 
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message 
    });
  }
});

// Set webhook for Telegram bot
const setWebhook = async () => {
  try {
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL || `http://localhost:${PORT}`}/api/telegram/webhook`;
    
    // Use axios to set webhook directly
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        url: webhookUrl,
        max_connections: 40
      }
    );
    
    if (response.data.ok) {
      console.log(`✅ Webhook set successfully: ${webhookUrl}`);
    } else {
      console.log('❌ Failed to set webhook:', response.data.description);
    }
  } catch (error) {
    console.error('Error setting webhook:', error.message);
    console.log('💡 Note: Webhook requires HTTPS in production');
    console.log('💡 For development, you can use polling mode instead');
  }
};

// Test function to call the /api/telegram/send endpoint
const testSendEndpoint = async () => {
  try {
    console.log('🧪 Testing /api/telegram/send endpoint...');
    
    // Hardcoded Bubble data for testing
    const testData = {
      message: "🧪 **Test Message from Bubble**\n\nThis is a test message sent via the API endpoint.\n\nCustomer: John Doe\nEmail: john@example.com\nIssue: Need help with my order",
      customerId: "test-customer-123",
      chatChannelId: "bubble-chat-channel-456",
      topicId: 112  // Uncomment to test existing topic
    };
    
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    
    // Call the endpoint internally
    const response = await axios.post(
      `http://localhost:${PORT}/api/telegram/send`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Test endpoint call successful!');
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.topicCreated) {
      console.log(`🎉 New topic created with ID: ${response.data.chat_id}`);
      console.log('💡 Bubble should store this topicId for future messages');
    } else {
      console.log(`📝 Message sent to existing topic: ${response.data.chat_id}`);
    }
    
    console.log('\n📝 **Test Instructions:**');
    console.log('   1. Check your Telegram group for the test message');
    console.log('   2. Try replying to the message as James or Simon');
    console.log('   3. Check the server logs for webhook processing');
    console.log('   4. To test existing topic, uncomment topicId in testData');
    console.log('\n🔧 **To disable test, set NODE_ENV=production**\n');

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    if (error.response) {
      console.error('📥 Response error:', error.response.data);
    }
    console.log('💡 Make sure:');
    console.log('   - Bot has admin rights in the group');
    console.log('   - Group has Topics enabled');
    console.log('   - TELEGRAM_GROUP_ID is correct');
  }
};


// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Telegram Gateway Server running on port ${PORT}`);
  console.log(`📱 Bot webhook mode enabled`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Set webhook after server starts
  await setWebhook();
  
  // Test the send endpoint in development mode
  if (process.env.NODE_ENV !== 'production') {
    await testSendEndpoint();
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    console.log('✅ Webhook deleted successfully');
  } catch (error) {
    console.log('❌ Error deleting webhook:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteWebhook`);
    console.log('✅ Webhook deleted successfully');
  } catch (error) {
    console.log('❌ Error deleting webhook:', error.message);
  }
  process.exit(0);
}); 