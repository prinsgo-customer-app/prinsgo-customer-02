import apiClient from './client';

export const sendOtp = (phone) => apiClient.post('/auth/send-otp', { phone });

export const verifyOtp = (phone, code, name) =>
  apiClient.post('/auth/verify-otp', { phone, code, name });

export const getMe = () => apiClient.get('/auth/me');

export const updateProfile = (data) => apiClient.put('/auth/profile', data);

export const addAddress = (data) => apiClient.post('/auth/address', data);

export const deleteAddress = (addressId) =>
  apiClient.delete(`/auth/address/${addressId}`);

// Customer read-only APIs for Admin settings, Banners, Feature Toggles, and Notifications
const getAdminHeaders = () => {
  const secret = process.env.EXPO_PUBLIC_ADMIN_SECRET || process.env.ADMIN_SECRET || 'PrinsGo_Session_Secret_2026_#AbC456xyz';
  return secret ? { headers: { 'x-admin-secret': secret } } : {};
};

export const getSettings = () => apiClient.get('/admin/settings', getAdminHeaders());

export const getToggles = () => apiClient.get('/admin/toggles', getAdminHeaders());

export const getBanners = () => apiClient.get('/admin/banners', getAdminHeaders());

export const getNotifications = () => apiClient.get('/notifications');
