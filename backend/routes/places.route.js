const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const placesController = require('../controllers/places.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/nearby', placesController.getNearbyPlaces);

module.exports = router;
