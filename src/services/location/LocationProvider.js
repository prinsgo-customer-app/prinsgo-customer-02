/**
 * LocationProvider base / abstract interface for location providers.
 */
export default class LocationProvider {
  /**
   * Get device's current location (latitude, longitude)
   * @returns {Promise<{lat: number, lng: number, address?: string}>}
   */
  async getCurrentLocation() {
    throw new Error('getCurrentLocation not implemented');
  }

  /**
   * Search for a location matching a text query
   * @param {string} query
   * @param {number} [lat]
   * @param {number} [lng]
   * @returns {Promise<Array<{placeId: string, description: string, address: string, lat?: number, lng?: number}>>}
   */
  async search(query, lat, lng) {
    throw new Error('search not implemented');
  }

  /**
   * Reverse geocode coordinates into a human-readable address
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<{address: string, lat: number, lng: number}>}
   */
  async reverseGeocode(lat, lng) {
    throw new Error('reverseGeocode not implemented');
  }

  /**
   * Get route/coordinates between two points
   * @param {{lat: number, lng: number}} pickup
   * @param {{lat: number, lng: number}} drop
   * @returns {Promise<Array<{latitude: number, longitude: number}>>}
   */
  async getRoute(pickup, drop) {
    throw new Error('getRoute not implemented');
  }

  /**
   * Get distance and duration details between two points
   * @param {{lat: number, lng: number}} pickup
   * @param {{lat: number, lng: number}} drop
   * @returns {Promise<{distanceKm: number, durationMin: number}>}
   */
  async getDistance(pickup, drop) {
    throw new Error('getDistance not implemented');
  }

  /**
   * Get detailed info for a specific place by place ID
   * @param {string} placeId
   * @returns {Promise<{address: string, lat: number, lng: number}>}
   */
  async getDetails(placeId) {
    throw new Error('getDetails not implemented');
  }
}
