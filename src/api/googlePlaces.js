import apiClient from './client';

/**
 * Low-level API client for Google Places autocomplete search.
 * Connects directly to the backend proxy endpoint without using any location services.
 */
export const getGooglePlacesSearch = (input, lat, lng) =>
  apiClient.get('/places/search', { params: { input, lat, lng } });

/**
 * Low-level API client for Google Places reverse geocoding.
 * Connects directly to the backend proxy endpoint without using any location services.
 */
export const getGooglePlacesReverse = (lat, lng) =>
  apiClient.get('/places/reverse', { params: { lat, lng } });

/**
 * Low-level API client for Google Places location details.
 * Connects directly to the backend proxy endpoint without using any location services.
 */
export const getGooglePlacesDetails = (placeId) =>
  apiClient.get('/places/details', { params: { placeId } });
