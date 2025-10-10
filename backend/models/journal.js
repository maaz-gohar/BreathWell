const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['voice', 'text'],
    required: true
  },
  audioUrl: {
    type: String,
    required: function() { return this.type === 'voice'; }
  },
  transcription: {
    type: String
  },
  duration: {
    type: Number, // in seconds
    required: function() { return this.type === 'voice'; }
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  title: {
    type: String,
    default: 'Journal Entry'
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  mimeType: {
    type: String,
    default: 'audio/mpeg'
  }
}, {
  timestamps: true
});

// Virtual for audio file URL
journalSchema.virtual('audioFileUrl').get(function() {
  if (this.audioUrl && !this.audioUrl.startsWith('http')) {
    return `${process.env.BASE_URL || ''}${this.audioUrl}`;
  }
  return this.audioUrl;
});

module.exports = mongoose.model('Journal', journalSchema);