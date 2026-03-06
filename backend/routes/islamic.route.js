const express = require('express');
const islamicController = require('../controllers/islamic.controller');

const router = express.Router();

// Public routes - no auth required for Islamic content
router.get('/modules', islamicController.getModules);
router.get('/modules/:id', islamicController.getModuleById);
router.get('/sleep/rituals', islamicController.getSleepRituals);
router.get('/sleep/morning-adhkar', islamicController.getMorningAdhkar);
router.get('/sleep/tahajjud', islamicController.getTahajjudContent);
router.get('/ruqyah', islamicController.getRuqyahVerses);

module.exports = router;
