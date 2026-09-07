import apiClient from './client';

export const getWorkersCategories = () => apiClient.get('/workers/categories');

export const getWorkers = (params) => apiClient.get('/workers', { params });

export const getWorkerById = (id) => apiClient.get(`/workers/${id}`);

export const createWorkerBooking = (payload) => apiClient.post('/workers/bookings', payload);

export const getWorkerBookingById = (id) => apiClient.get(`/workers/bookings/${id}`);

export const getWorkerHistory = (page = 1, limit = 30) => apiClient.get('/workers/bookings/history', { params: { page, limit } });

export const cancelWorkerBooking = (id, reason) => apiClient.put(`/workers/bookings/${id}/cancel`, { reason });

export const rescheduleWorkerBooking = (id, payload) => apiClient.put(`/workers/bookings/${id}/reschedule`, payload);

export const rateWorkerBooking = (id, rating, review, tip) => apiClient.post(`/workers/bookings/${id}/rate`, { rating, review, tip });

// Extended API endpoints for robust real backend integration

// Fetch Worker Packages
export const getWorkerPackages = (id) => apiClient.get(`/workers/${id}/packages`);

// Fetch Worker Gallery
export const getWorkerGallery = (id) => apiClient.get(`/workers/${id}/gallery`);

// Upload photo for service requirements
export const uploadWorkerBookingPhoto = (id, formData) => apiClient.post(`/workers/bookings/${id}/upload`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Tip professional
export const tipWorker = (bookingId, amount) => apiClient.post(`/workers/bookings/${bookingId}/tip`, { amount });

// Update booking status
export const updateWorkerBookingStatus = (id, status) => apiClient.put(`/workers/bookings/${id}/status`, { status });
