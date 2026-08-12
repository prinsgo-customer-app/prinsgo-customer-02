import LocationProvider from './LocationProvider';
import { searchPlaces as searchApi, reverseGeocode as revGeocodeApi, placeDetails as detailsApi } from '../../api/places';

export default class GoogleProvider extends LocationProvider {
  async getCurrentLocation() {
    // Falls back to direct device sensor where applicable
    throw new Error('getCurrentLocation not implemented on GoogleProvider directly');
  }

  async search(query, lat, lng) {
    const res = await searchApi(query, lat, lng);
    const predictions = res.data?.predictions || [];
    return predictions.map((item) => ({
      placeId: item.placeId || item.place_id,
      description: item.description || item.address,
      address: item.description || item.address,
    }));
  }

  async reverseGeocode(lat, lng) {
    const res = await revGeocodeApi(lat, lng);
    return {
      address: res.data?.address,
      lat: res.data?.lat || lat,
      lng: res.data?.lng || lng,
    };
  }

  async getRoute(pickup, drop) {
    // Usually processed on-map or through direction matrix API
    throw new Error('getRoute via Google API directly from client is optional');
  }

  async getDistance(pickup, drop) {
    // Handled natively by backend or distance matrix
    throw new Error('getDistance via Google API directly is optional');
  }

  async getDetails(placeId) {
    const res = await detailsApi(placeId);
    return {
      address: res.data?.address,
      lat: res.data?.lat,
      lng: res.data?.lng,
    };
  }
}
