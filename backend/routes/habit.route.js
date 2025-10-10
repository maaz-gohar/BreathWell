const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const habitController = require('../controllers/habit.controller');

const router = express.Router();

router.use(authMiddleware);

router.post('/', habitController.createHabit);
router.get('/', habitController.getHabits);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/complete', habitController.completeHabit);
router.get('/streaks', habitController.getStreaks);

module.exports = router;