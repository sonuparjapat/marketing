'use client';

import axios from 'axios';

export const customerApiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`,
  withCredentials: false,
});

customerApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('customer_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unlike the admin client, a 401 here doesn't force-navigate anywhere — a logged-out visitor is
// still just a visitor, free to keep browsing the public site. CustomerAuthContext clears the
// stale session and the UI reflects "signed out" wherever it's showing account state.
customerApiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_user');
    }
    return Promise.reject(error);
  }
);

export default customerApiClient;
