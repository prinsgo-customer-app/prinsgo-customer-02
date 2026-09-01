import apiClient from './client';

export const getWorkersCategories = () => apiClient.get('/workers/categories');

export const getWorkers = (params) => apiClient.get('/workers', { params });

export const getWorkerById = (id) => apiClient.get(`/workers/${id}`);

export const createWorkerBooking = (payload) => apiClient.post('/workers/book', payload);

export const getWorkerBookingById = (id) => apiClient.get(`/workers/bookings/${id}`);

export const getWorkerHistory = (page = 1, limit = 30) => apiClient.get('/workers/bookings/history', { params: { page, limit } });
