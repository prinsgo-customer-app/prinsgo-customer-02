import apiClient from './client';

export const estimateParcelCharge = (payload) =>
  apiClient.post('/parcels/estimate', payload);

export const bookParcel = (payload) => apiClient.post('/parcels/book', payload);

export const getActiveParcels = () => apiClient.get('/parcels/active');

export const getParcelById = (id) => apiClient.get(`/parcels/${id}`);

export const getParcelHistory = (page = 1, limit = 20) =>
  apiClient.get(`/parcels/history?page=${page}&limit=${limit}`);

export const cancelParcel = (id, reason) =>
  apiClient.put(`/parcels/${id}/cancel`, { reason });
