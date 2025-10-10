const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chat.controller');

const router = express.Router();

router.use(authMiddleware);

router.post('/message', chatController.sendMessage);
router.get('/sessions', chatController.getChatSessions);
router.get('/session/:id', chatController.getChatSession);
router.delete('/session/:id', chatController.deleteChatSession);

module.exports = router;