const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const moodController = require('../controllers/mood.controller');

const router = express.Router();

router.use(authMiddleware);

router.post('/', moodController.addMood);
router.get('/today', moodController.getTodayMood);
router.get('/weekly', moodController.getWeeklyMoods);
router.get('/analytics', moodController.getMoodAnalytics);
router.put('/:id', moodController.updateMood);
router.delete('/:id', moodController.deleteMood);

module.exports = router;