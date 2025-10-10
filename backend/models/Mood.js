const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  moodEmoji: {
    type: String,
    required: true,
    enum: ['😊', '😄', '😐', '😔', '😢', '😡', '😴', '😰']
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  note: {
    type: String,
    maxlength: 500
  },
  tags: [String]
}, {
  timestamps: true
});

// Compound index for efficient querying
moodSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Mood', moodSchema);