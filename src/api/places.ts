import apiClient from './client';

export const searchPlaces = (input, lat, lng) =>
  apiClient.get(
    `/places/search?input=${encodeURIComponent(input)}${lat ? `&lat=${lat}` : ''}${
      lng ? `&lng=${lng}` : ''
    }`
  );

export const reverseGeocode = (lat, lng) =>
  apiClient.get(`/places/reverse-geocode?lat=${lat}&lng=${lng}`);

export const placeDetails = (placeId) =>
  apiClient.get(`/places/details?placeId=${placeId}`);
