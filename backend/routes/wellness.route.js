const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const wellnessController = require('../controllers/wellness.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/plan', wellnessController.getWellnessPlan);
router.post('/plan/generate', wellnessController.generateWellnessPlan);
router.post('/sos', wellnessController.handleSOS);

module.exports = router;