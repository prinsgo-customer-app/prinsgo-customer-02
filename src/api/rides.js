import apiClient from './client';

export const estimateFare = (pickupLat, pickupLng, dropLat, dropLng) =>
  apiClient.post('/rides/estimate', { pickupLat, pickupLng, dropLat, dropLng });

export const bookRide = (pickup, drop, vehicleType, paymentMethod) =>
  apiClient.post('/rides/book', { pickup, drop, vehicleType, paymentMethod });

export const getActiveRide = () => apiClient.get('/rides/active');

export const getRideById = (id) => apiClient.get(`/rides/${id}`);

export const getRideHistory = (page = 1, limit = 20) =>
  apiClient.get(`/rides/history?page=${page}&limit=${limit}`);

export const cancelRide = (id, reason) =>
  apiClient.put(`/rides/${id}/cancel`, { reason });

export const rateRide = (id, rating, review) =>
  apiClient.post(`/rides/${id}/rate`, { rating, review });
