const axios = require('axios');
const { haversineDistanceKm, formatDistance } = require('../utils/geo');

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';
const DEFAULT_RADIUS_M = 5000;
const DEFAULT_LIMIT = 10;
const REQUEST_TIMEOUT_MS = 25000;

/**
 * Build Overpass QL query for nearby places by type.
 */
function buildOverpassQuery(lat, lng, type, radiusM) {
  const around = `around:${radiusM},${lat},${lng}`;

  if (type === 'halal') {
    return `
      [out:json][timeout:25];
      (
        node["amenity"="restaurant"]["cuisine"~"halal|muslim",i](${around});
        way["amenity"="restaurant"]["cuisine"~"halal|muslim",i](${around});
        node["diet:halal"="yes"](${around});
        way["diet:halal"="yes"](${around});
      );
      out center ${DEFAULT_LIMIT};
    `;
  }

  // Default: mosque
  return `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](${around});
      way["amenity"="place_of_worship"]["religion"="muslim"](${around});
      node["building"="mosque"](${around});
      way["building"="mosque"](${around});
      node["religion"="muslim"]["amenity"="place_of_worship"](${around});
      way["religion"="muslim"]["amenity"="place_of_worship"](${around});
    );
    out center ${DEFAULT_LIMIT};
  `;
}

/**
 * Extract coordinates from an Overpass element.
 */
function getElementCoordinates(element) {
  if (element.type === 'node' && element.lat != null && element.lon != null) {
    return { lat: element.lat, lng: element.lon };
  }
  if (element.center) {
    return { lat: element.center.lat, lng: element.center.lon };
  }
  return null;
}

/**
 * Build a readable address from OSM tags.
 */
function buildAddress(tags = {}) {
  const streetPart = [tags['addr:housenumber'], tags['addr:street']]
    .filter(Boolean)
    .join(' ');

  const parts = [
    streetPart || null,
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:state'],
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return tags['addr:full'] || null;
}

/**
 * Parse Overpass response into normalized place objects.
 */
function parseOverpassElements(elements, originLat, originLng, type) {
  const places = [];

  for (const element of elements) {
    const coords = getElementCoordinates(element);
    if (!coords) continue;

    const tags = element.tags || {};
    const name = tags.name || tags['name:en'] || 'Unnamed place';
    const address = buildAddress(tags);
    const distanceKm = haversineDistanceKm(originLat, originLng, coords.lat, coords.lng);

    places.push({
      id: `${element.type}/${element.id}`,
      name,
      type,
      latitude: coords.lat,
      longitude: coords.lng,
      address,
      distanceKm,
      distanceFormatted: formatDistance(distanceKm),
    });
  }

  places.sort((a, b) => a.distanceKm - b.distanceKm);
  return places.slice(0, DEFAULT_LIMIT);
}

/**
 * Find nearby places using OpenStreetMap Overpass API.
 */
async function findNearbyPlaces({ lat, lng, type = 'mosque', radius = DEFAULT_RADIUS_M }) {
  const query = buildOverpassQuery(lat, lng, type, radius);

  const response = await axios.post(
    OVERPASS_API_URL,
    `data=${encodeURIComponent(query)}`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: REQUEST_TIMEOUT_MS,
    }
  );

  const elements = response.data?.elements || [];
  return parseOverpassElements(elements, lat, lng, type);
}

/**
 * Build context string for AI system prompt from place results.
 */
function buildPlacesContext(places, placeType) {
  const label = placeType === 'halal' ? 'halal restaurants' : 'mosques';

  if (!places || places.length === 0) {
    return `\n\nNearby places context: No ${label} were found within 5 km of the user's location. Tell the user honestly and suggest they try a wider area or check local listings.`;
  }

  const lines = places.map((p, i) => {
    const addr = p.address || 'Address not available';
    return `${i + 1}. ${p.name} — ${p.distanceFormatted} — ${addr}`;
  });

  return `\n\nNearby ${label} from the user's current location (sorted by distance):\n${lines.join('\n')}\nIf the user asks about nearby places, answer using ONLY this list. Include name, distance, and address for each. Be warm and helpful.`;
}

module.exports = {
  findNearbyPlaces,
  buildPlacesContext,
  DEFAULT_RADIUS_M,
  DEFAULT_LIMIT,
};
