import LocationProvider from './LocationProvider';
import {
  getGooglePlacesSearch,
  getGooglePlacesReverse,
  getGooglePlacesDetails,
} from '../../api/googlePlaces';

export default class GoogleProvider extends LocationProvider {
  async getCurrentLocation() {
    throw new Error('getCurrentLocation not implemented on GoogleProvider directly');
  }

  async search(query, lat, lng) {
    const res = await getGooglePlacesSearch(query, lat, lng);

    const predictions = res.data?.predictions || [];

    return predictions.map((item) => ({
      placeId: item.place_id,
      description: item.description || item.address,
      address: item.description || item.address,
    }));
  }

  async reverseGeocode(lat, lng) {
    const res = await getGooglePlacesReverse(lat, lng);

    return {
      address: res.data?.address,
      lat: res.data?.lat ?? lat,
      lng: res.data?.lng ?? lng,
    };
  }

  async getRoute(pickup, drop) {
    throw new Error('getRoute via Google API directly is optional');
  }

  async getDistance(pickup, drop) {
    throw new Error('getDistance via Google API directly is optional');
  }

  async getDetails(placeId) {
    const res = await getGooglePlacesDetails(placeId);

    return {
      address: res.data?.address,
      lat: res.data?.lat,
      lng: res.data?.lng,
    };
  }
}
