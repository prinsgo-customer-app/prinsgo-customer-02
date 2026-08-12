import locationService from '../services/location/locationService';

/**
 * Wraps place search using the configured active LocationProvider with automatic fallback capability.
 */
export const searchPlaces = async (input, lat, lng) => {
  try {
    await locationService.init();
    const provider = locationService.getProvider();
    const predictions = await provider.search(input, lat, lng);
    return { data: { predictions } };
  } catch (err) {
    console.error('searchPlaces failed:', err);
    return { data: { predictions: [] } };
  }
};

/**
 * Wraps reverse geocoding with automatic fallback capability.
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    await locationService.init();
    const provider = locationService.getProvider();
    const details = await provider.reverseGeocode(lat, lng);
    return { data: details };
  } catch (err) {
    console.error('reverseGeocode failed:', err);
    return { data: { address: `Location at ${lat}, ${lng}`, lat, lng } };
  }
};

/**
 * Wraps place details fetching with automatic fallback capability.
 */
export const placeDetails = async (placeId) => {
  try {
    await locationService.init();
    const provider = locationService.getProvider();
    const details = await provider.getDetails(placeId);
    return { data: details };
  } catch (err) {
    console.error('placeDetails failed:', err);
    return { data: { address: 'Unknown Location', lat: 18.5204, lng: 73.8567 } };
  }
};
