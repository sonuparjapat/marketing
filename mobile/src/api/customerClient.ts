import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// A SEPARATE axios instance from `api` (client.ts), which attaches the ADMIN token — mirrors the
// web app's split between apiClient.ts (admin) and customerApiClient.ts (customer): one browser/
// device can hold both an admin session and a customer session, and neither client should ever
// attach the other's token.
export const customerApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

customerApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('customer_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

customerApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['customer_token', 'customer_user']);
    }
    return Promise.reject(error);
  }
);

export default customerApi;
