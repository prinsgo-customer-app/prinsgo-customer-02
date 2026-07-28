import apiClient from './client';

export const sendOtp = (phone) => apiClient.post('/auth/send-otp', { phone });

export const verifyOtp = (phone, code, name) =>
  apiClient.post('/auth/verify-otp', { phone, code, name });

export const getMe = () => apiClient.get('/auth/me');

export const updateProfile = (data) => apiClient.put('/auth/profile', data);

export const addAddress = (data) => apiClient.post('/auth/address', data);

export const deleteAddress = (addressId) =>
  apiClient.delete(`/auth/address/${addressId}`);
