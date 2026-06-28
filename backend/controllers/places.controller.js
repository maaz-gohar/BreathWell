const { isValidCoordinates } = require('../utils/geo');
const { findNearbyPlaces } = require('../services/overpass.service');

/**
 * GET /api/places/nearby?lat=&lng=&type=mosque&radius=5000
 */
exports.getNearbyPlaces = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const type = req.query.type || 'mosque';
    const radius = parseInt(req.query.radius, 10) || 5000;

    if (!isValidCoordinates(lat, lng)) {
      return res.status(400).json({ message: 'Valid lat and lng query parameters are required' });
    }

    const places = await findNearbyPlaces({ lat, lng, type, radius });

    res.json({
      places,
      count: places.length,
      origin: { latitude: lat, longitude: lng },
      type,
      radius,
    });
  } catch (error) {
    console.error('Nearby places error:', error);
    res.status(500).json({ message: 'Failed to fetch nearby places' });
  }
};
