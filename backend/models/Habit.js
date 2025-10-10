const mongoose = require('mongoose');

const habitEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  streakCount: {
    type: Number,
    default: 0
  },
  bestStreak: {
    type: Number,
    default: 0
  },
  entries: [habitEntrySchema],
  reminderTime: String,
  category: {
    type: String,
    enum: ['health', 'mindfulness', 'productivity', 'self_care'],
    default: 'health'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Habit', habitSchema);