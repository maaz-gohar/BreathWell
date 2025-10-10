// In your journal routes (routes/journal.js)
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const journalController = require('../controllers/journal.controller');
const { uploadAudio, handleMulterError } = require('../config/multer');

const router = express.Router();

router.use(authMiddleware);

// Voice journal with file upload
router.post(
  '/voice', 
  uploadAudio.single('audio'),
  handleMulterError,
  journalController.saveVoiceJournal
);

// Get all journals
router.get('/', journalController.getJournals);

// Get specific journal
router.get('/:id', journalController.getJournal);

// Delete journal
router.delete('/:id', journalController.deleteJournal);

// ✅ IMPORTANT: Add this route to serve audio files
router.get('/audio/:filename', journalController.getAudioFile);

module.exports = router;