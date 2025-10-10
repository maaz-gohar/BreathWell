const User = require('../models/User');
const Mood = require('../models/Mood');
const axios = require('axios');

const groqApiKey = process.env.GROQ_API_KEY;

exports.generateWellnessPlan = async (req, res) => {
  try {
    // Get user's recent moods and habits
    const recentMoods = await Mood.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(10);

    const moodHistory = recentMoods.map(mood => ({
      mood: mood.moodEmoji,
      score: mood.moodScore,
      note: mood.note,
      date: mood.date
    }));

    let aiPlan = {
      daily: [
        "Practice 5 minutes of deep breathing",
        "Take a 10-minute walk outside",
        "Write down 3 things you're grateful for"
      ],
      weekly: [
        "Try a new relaxation technique",
        "Connect with a friend or family member",
        "Review your mood patterns and insights"
      ],
      tips: [
        "Stay hydrated throughout the day",
        "Take regular breaks from screens",
        "Practice mindfulness during routine activities"
      ]
    };

    if (groqApiKey && moodHistory.length > 0) {
      try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Create a personalized mental wellness plan based on mood history. 
              Provide daily activities, weekly goals, and helpful tips. 
              Keep it practical, supportive, and actionable. Return as JSON format.`
            },
            {
              role: 'user',
              content: `Create wellness plan for someone with these recent moods: ${JSON.stringify(moodHistory)}`
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        }, {
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        // Parse AI response (this would need proper JSON parsing in production)
        const aiResponse = response.data.choices[0].message.content;
        // In a real app, you'd parse the JSON response here
      } catch (apiError) {
        console.error('Groq API error for wellness plan:', apiError);
        // Use default plan
      }
    }

    res.json({ plan: aiPlan });
  } catch (error) {
    res.status(500).json({ message: 'Error generating wellness plan' });
  }
};

exports.getWellnessPlan = async (req, res) => {
  try {
    // For now, return a default plan
    // In production, you'd fetch from database
    const defaultPlan = {
      daily: [
        "Morning meditation - 5 minutes",
        "Hydration check - drink 8 glasses",
        "Evening gratitude journal"
      ],
      weekly: [
        "30 minutes of exercise 3 times",
        "Digital detox for 2 hours",
        "Social connection activity"
      ]
    };

    res.json({ plan: defaultPlan });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wellness plan' });
  }
};

exports.handleSOS = async (req, res) => {
  try {
    const { message, location } = req.body;
    
    // Get user's emergency contact
    const user = await User.findById(req.userId);
    const emergencyContact = user.preferences.emergencyContact;

    // In a real app, you would:
    // 1. Send SMS/email to emergency contact
    // 2. Log the crisis event
    // 3. Possibly connect to emergency services

    const crisisResources = {
      hotlines: [
        { name: 'National Suicide Prevention Lifeline', number: '988' },
        { name: 'Crisis Text Line', number: 'Text HOME to 741741' },
        { name: 'Emergency Services', number: '911' }
      ],
      message: 'Help is available. Please reach out to these resources.'
    };

    res.json({
      message: 'SOS activated successfully',
      resources: crisisResources,
      emergencyContact: emergencyContact || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error handling SOS' });
  }
};