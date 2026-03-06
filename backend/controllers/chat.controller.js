const ChatSession = require('../models/Chat');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const {
  ISLAMIC_THERAPIST_SYSTEM_PROMPT,
  ISLAMIC_FALLBACK_RESPONSES,
} = require('../config/islamic-therapist-prompt');

const groqApiKey = process.env.GROQ_API_KEY;

// Keywords mapped to emotionalState for Islamic module lookup
const EMOTION_KEYWORDS = {
  anger: ['angry', 'anger', 'mad', 'furious', 'irritated', 'frustrated'],
  unloved: ['unloved', 'lonely', 'rejected', 'unwanted', 'not loved'],
  neglected: ['neglected', 'ignored', 'forgotten', 'overlooked'],
  hardened: ['hardened', 'heart hard', 'cold', 'numb', 'distant'],
  injustice: ['injustice', 'unfair', 'wronged', 'treated badly'],
  separation: ['separation', 'divorce', 'leaving', 'split'],
  parenting: ['parent', 'children', 'kids', 'burnout', 'overwhelmed parent'],
  resentment: ['resentment', 'resent', 'forgive', 'grudge', 'bitter'],
  anxiety: ['anxious', 'anxiety', 'worried', 'worry', 'nervous', 'panic', 'stress'],
  fear: ['fear', 'scared', 'afraid', 'nightmare', 'bad dream', 'terrified'],
  overthinking: ['overthink', 'overthinking', 'racing thoughts', 'cant stop thinking'],
  guilt: ['guilty', 'guilt', 'regret', 'ashamed', 'sin', 'wrong'],
  spiritual_exhaustion: ['exhausted', 'tired', 'drained', 'spiritually empty', 'no iman'],
};

/**
 * Load Islamic modules and find context matching the user message.
 * Returns a string to append to the system prompt, or empty string if no match.
 */
function getIslamicContextForMessage(messageText) {
  try {
    const relationshipPath = path.join(__dirname, '../data/relationship-modules.json');
    const sleepPath = path.join(__dirname, '../data/sleep-modules.json');
    const relationshipData = JSON.parse(fs.readFileSync(relationshipPath, 'utf8'));
    const sleepData = JSON.parse(fs.readFileSync(sleepPath, 'utf8'));
    const allModules = [
      ...(relationshipData.modules || []),
      ...(sleepData.modules || []),
    ];

    const lower = messageText.toLowerCase();
    let matchedModule = null;

    for (const [emotionalState, keywords] of Object.entries(EMOTION_KEYWORDS)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        matchedModule = allModules.find((m) => m.emotionalState === emotionalState);
        if (matchedModule) break;
      }
    }

    if (!matchedModule) return '';

    const parts = [];
    parts.push(`Relevant Islamic context for this conversation (use when helpful):`);
    parts.push(`Emotional theme: ${matchedModule.displayLabel || matchedModule.emotionalState}.`);
    parts.push(`Validation: ${matchedModule.emotionalValidation}`);
    if (matchedModule.verses && matchedModule.verses.length > 0) {
      const verseList = matchedModule.verses
        .slice(0, 2)
        .map((v) => `- ${v.surah} ${v.verseRange}: ${v.translation}`)
        .join('\n');
      parts.push(`Verses:\n${verseList}`);
    }
    if (matchedModule.sunnahPractices && matchedModule.sunnahPractices.length > 0) {
      const sunnahList = matchedModule.sunnahPractices
        .slice(0, 2)
        .map((s) => `- ${s.title}: ${s.description} (${s.hadithSource || 'Sunnah'})`)
        .join('\n');
      parts.push(`Sunnah practices:\n${sunnahList}`);
    }
    if (matchedModule.regulationLayer && matchedModule.regulationLayer.instruction) {
      parts.push(`Practical step: ${matchedModule.regulationLayer.instruction}`);
    }
    if (matchedModule.closingAffirmation) {
      parts.push(`Affirmation: ${matchedModule.closingAffirmation}`);
    }
    return '\n\n' + parts.join('\n');
  } catch (err) {
    console.error('Islamic context load error:', err);
    return '';
  }
}

const analyzeSentiment = (text) => {
  const negativeWords = ['suicide', 'kill myself', 'end it all', 'want to die', 'hopeless', 'helpless', 'cant go on'];
  const positiveWords = ['happy', 'good', 'great', 'better', 'improving', 'hope', 'excited', 'thankful'];

  const lowerText = text.toLowerCase();

  if (negativeWords.some((word) => lowerText.includes(word))) {
    return 'crisis';
  } else if (positiveWords.some((word) => lowerText.includes(word))) {
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
        title: `Chat ${new Date().toLocaleDateString()}`,
      });
    }

    if (!chatSession) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    const userMessage = {
      text: message,
      isUser: true,
      sentiment: analyzeSentiment(message),
    };
    chatSession.messages.push(userMessage);

    const islamicContext = getIslamicContextForMessage(message);
    const systemContent =
      ISLAMIC_THERAPIST_SYSTEM_PROMPT + islamicContext;

    let aiResponse =
      "I'm here to listen and support you with an Islamic perspective. How are you feeling today?";

    if (groqApiKey) {
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: systemContent,
              },
              ...chatSession.messages.map((msg) => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text,
              })),
            ],
            max_tokens: 500,
            temperature: 0.7,
          },
          {
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        aiResponse = response.data.choices[0].message.content;
      } catch (apiError) {
        console.error('Groq API error:', apiError);
        aiResponse =
          ISLAMIC_FALLBACK_RESPONSES[
            Math.floor(Math.random() * ISLAMIC_FALLBACK_RESPONSES.length)
          ];
      }
    }

    const aiMessage = {
      text: aiResponse,
      isUser: false,
      sentiment: 'neutral',
      timestamp: new Date(),
    };
    chatSession.messages.push(aiMessage);

    const crisisDetected = chatSession.messages.some(
      (msg) => msg.sentiment === 'crisis'
    );
    chatSession.crisisDetected = crisisDetected;
    chatSession.lastActivity = new Date();

    await chatSession.save();

    res.json({
      sessionId: chatSession._id,
      aiResponse: aiMessage,
      crisisDetected,
      messages: chatSession.messages,
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
