import LocationProvider from './LocationProvider';
import GoogleProvider from './GoogleProvider';
import FreeProvider from './FreeProvider';

export default class AutoProvider extends LocationProvider {
  constructor() {
    super();
    this.google = new GoogleProvider();
    this.free = new FreeProvider();
    this.useFreeOnly = false; // Toggleable dynamically if we hit API key issues
  }

  async getCurrentLocation() {
    // Current location always uses FreeProvider's direct hardware GPS tracker
    return this.free.getCurrentLocation();
  }

  async search(query, lat, lng) {
    if (this.useFreeOnly) {
      return this.free.search(query, lat, lng);
    }
    try {
      return await this.google.search(query, lat, lng);
    } catch (err) {
      const isRequestDenied =
        err?.message?.includes('REQUEST_DENIED') ||
        (err?.response?.data?.message || '').includes('REQUEST_DENIED') ||
        err?.status === 500 ||
        err?.response?.status === 500;

      if (isRequestDenied) {
        console.warn('Google Places API REQUEST_DENIED/500 detected. Activating automatic FreeProvider fallback.');
        this.useFreeOnly = true;
      }
      return this.free.search(query, lat, lng);
    }
  }

  async reverseGeocode(lat, lng) {
    if (this.useFreeOnly) {
      return this.free.reverseGeocode(lat, lng);
    }
    try {
      return await this.google.reverseGeocode(lat, lng);
    } catch (err) {
      const isRequestDenied =
        err?.message?.includes('REQUEST_DENIED') ||
        (err?.response?.data?.message || '').includes('REQUEST_DENIED') ||
        err?.status === 500 ||
        err?.response?.status === 500;

      if (isRequestDenied) {
        console.warn('Google Places Reverse Geocode failed. Falling back to FreeProvider.');
        this.useFreeOnly = true;
      }
      return this.free.reverseGeocode(lat, lng);
    }
  }

  async getRoute(pickup, drop) {
    // Always fall back to premium-looking simulated or OSRM-based route
    return this.free.getRoute(pickup, drop);
  }

  async getDistance(pickup, drop) {
    // Always fall back to premium-looking simulated or OSRM-based distance matrix
    return this.free.getDistance(pickup, drop);
  }

  async getDetails(placeId) {
    if (this.useFreeOnly || placeId.startsWith('osm_') || placeId.startsWith('free_')) {
      return this.free.getDetails(placeId);
    }
    try {
      return await this.google.getDetails(placeId);
    } catch (err) {
      console.warn('Google Places Details failed, falling back to FreeProvider details.');
      return this.free.getDetails(placeId);
    }
  }
}
