import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/api/client';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('API Client Interceptors', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should attach token to request headers if available', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce('fake_token_123');

    const config = { headers: {} };
    // Call the fulfilled handler for requests directly.
    const result = await apiClient.interceptors.request.handlers[0].fulfilled(config);

    expect(AsyncStorage.getItem).toHaveBeenCalledWith('prinsgo_token');
    expect(result.headers.Authorization).toBe('Bearer fake_token_123');
  });

  it('should NOT attach token if none exists', async () => {
    AsyncStorage.getItem.mockResolvedValueOnce(null);

    const config = { headers: {} };
    const result = await apiClient.interceptors.request.handlers[0].fulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should remove token on 401 response and reject with message', async () => {
    const error = {
      response: {
        status: 401,
        data: { message: 'Unauthorized access' }
      }
    };

    // The rejection handler is typically the second function in the array for responses
    const rejectionHandler = apiClient.interceptors.response.handlers[0].rejected;

    await expect(rejectionHandler(error)).rejects.toMatchObject({
      message: 'Unauthorized access'
    });

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('prinsgo_token');
  });

  it('should reject with default message if no response data exists', async () => {
    const error = {
      message: 'Network Error'
    };

    const rejectionHandler = apiClient.interceptors.response.handlers[0].rejected;

    await expect(rejectionHandler(error)).rejects.toMatchObject({
      message: 'Network Error'
    });
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });
});
