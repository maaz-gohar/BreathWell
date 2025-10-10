const ChatSession = require('../models/Chat');
const axios = require('axios');

const groqApiKey = process.env.GROQ_API_KEY;

const analyzeSentiment = (text) => {
  const negativeWords = ['suicide', 'kill myself', 'end it all', 'want to die', 'hopeless', 'helpless', 'cant go on'];
  const positiveWords = ['happy', 'good', 'great', 'better', 'improving', 'hope', 'excited', 'thankful'];
  
  const lowerText = text.toLowerCase();
  
  if (negativeWords.some(word => lowerText.includes(word))) {
    return 'crisis';
  } else if (positiveWords.some(word => lowerText.includes(word))) {
    return 'positive';
  }
  return 'neutral';
};

exports.sendMessage = async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const userId = req.userId;

    let chatSession;
    
    if (sessionId) {
      chatSession = await ChatSession.findOne({ _id: sessionId, userId });
    } else {
      chatSession = new ChatSession({ 
        userId, 
        messages: [],
        title: `Chat ${new Date().toLocaleDateString()}`
      });
    }

    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Add user message
    const userMessage = {
      text: message,
      isUser: true,
      sentiment: analyzeSentiment(message)
    };
    chatSession.messages.push(userMessage);

    // Get AI response from Groq API
    let aiResponse = "I'm here to listen and support you. How are you feeling today?";
    
    if (groqApiKey) {
      try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a compassionate mental wellness assistant. Provide supportive, 
              empathetic responses. If you detect crisis situations, gently encourage seeking 
              professional help. Keep responses concise and caring. Be conversational and warm.`
            },
            ...chatSession.messages.map(msg => ({
              role: msg.isUser ? 'user' : 'assistant',
              content: msg.text
            }))
          ],
          max_tokens: 500,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        aiResponse = response.data.choices[0].message.content;
      } catch (apiError) {
        console.error('Groq API error:', apiError);
        // Fallback responses
        const fallbackResponses = [
          "I understand this might be difficult. Remember, it's okay to seek help.",
          "Thank you for sharing. Your feelings are valid and important.",
          "I'm here to support you through this. Would you like to talk more about it?",
          "It takes courage to express your feelings. I'm proud of you for reaching out."
        ];
        aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      }
    }

    // Add AI response
    const aiMessage = {
      text: aiResponse,
      isUser: false,
      sentiment: 'neutral'
    };
    chatSession.messages.push(aiMessage);

    // Check for crisis
    const crisisDetected = chatSession.messages.some(msg => 
      msg.sentiment === 'crisis'
    );
    chatSession.crisisDetected = crisisDetected;
    chatSession.lastActivity = new Date();

    await chatSession.save();

    res.json({
      sessionId: chatSession._id,
      aiResponse: aiMessage,
      crisisDetected,
      messages: chatSession.messages
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Error processing chat message' });
  }
};

exports.getChatSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.userId })
      .sort({ lastActivity: -1 })
      .select('title lastActivity crisisDetected messages')
      .limit(10);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat sessions' });
  }
};

exports.getChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ChatSession.findOne({ _id: id, userId: req.userId });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ session });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat session' });
  }
};

exports.deleteChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await ChatSession.findOneAndDelete({ _id: id, userId: req.userId });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting chat session' });
  }
};