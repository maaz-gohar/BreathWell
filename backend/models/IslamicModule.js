const mongoose = require('mongoose');

const verseSchema = new mongoose.Schema({
  surah: { type: String, required: true },
  verseRange: { type: String, required: true },
  arabicText: { type: String, default: '' },
  translation: { type: String, required: true },
  hadithRef: { type: String, default: '' }
}, { _id: false });

const sunnahPracticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  hadithSource: { type: String, default: '' }
}, { _id: false });

const regulationLayerSchema = new mongoose.Schema({
  type: { type: String, enum: ['breathing', 'dhikr', 'dua', 'journal'], default: 'dhikr' },
  instruction: { type: String, default: '' },
  dhikrText: { type: String, default: '' },
  breathingConfig: {
    inhale: { type: Number, default: 4 },
    exhale: { type: Number, default: 6 },
    rounds: { type: Number, default: 10 }
  }
}, { _id: false });

const islamicModuleSchema = new mongoose.Schema({
  moduleType: {
    type: String,
    enum: ['sleep', 'relationship', 'general'],
    required: true
  },
  emotionalState: {
    type: String,
    required: true
  },
  displayLabel: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    default: ''
  },
  emotionalValidation: {
    type: String,
    default: ''
  },
  verses: [verseSchema],
  sunnahPractices: [sunnahPracticeSchema],
  regulationLayer: regulationLayerSchema,
  reflectionPrompts: [{ type: String }],
  closingAffirmation: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IslamicModule', islamicModuleSchema);
