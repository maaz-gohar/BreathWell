const LOCATION_INTENT_KEYWORDS = [
  'near me',
  'nearby',
  'closest',
  'around me',
  'in my area',
  'close to me',
  'nearest',
];

const PLACE_TYPE_KEYWORDS = {
  mosque: ['mosque', 'masjid', 'prayer', 'jummah', 'jumah', 'salah', 'place of worship'],
  halal: ['halal', 'halal restaurant', 'halal food'],
};

/**
 * Detect if a message is asking about nearby places.
 * Returns { isNearMe: boolean, placeType: string }.
 */
function isNearMeQuery(message) {
  if (!message || typeof message !== 'string') {
    return { isNearMe: false, placeType: null };
  }

  const lower = message.toLowerCase();
  const hasLocationIntent = LOCATION_INTENT_KEYWORDS.some((kw) => lower.includes(kw));

  let placeType = null;
  for (const [type, keywords] of Object.entries(PLACE_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      placeType = type;
      break;
    }
  }

  // Default to mosque in Islamic app context when location intent is present
  if (hasLocationIntent && !placeType) {
    placeType = 'mosque';
  }

  return {
    isNearMe: hasLocationIntent,
    placeType,
  };
}

module.exports = {
  isNearMeQuery,
  LOCATION_INTENT_KEYWORDS,
  PLACE_TYPE_KEYWORDS,
};
