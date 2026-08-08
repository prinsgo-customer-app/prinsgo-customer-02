import apiClient from './client';

export const getMyTransactions = (page = 1, limit = 20) =>
  apiClient.get(`/wallet/transactions?page=${page}&limit=${limit}`);
