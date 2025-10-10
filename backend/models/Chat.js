const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isUser: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'crisis'],
    default: 'neutral'
  }
});

const chatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Chat Session'
  },
  messages: [messageSchema],
  crisisDetected: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);