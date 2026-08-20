import AsyncStorage from '@react-native-async-storage/async-storage';
import customerApi from './customerClient';

export type CustomerUser = { id: number; name: string; email: string; is_premium: boolean; created_at: string };

export const getStoredCustomerToken = () => AsyncStorage.getItem('customer_token');

export const getStoredCustomer = async (): Promise<CustomerUser | null> => {
  const raw = await AsyncStorage.getItem('customer_user');
  return raw ? JSON.parse(raw) : null;
};

const setSession = async (token: string, user: CustomerUser) => {
  await AsyncStorage.setItem('customer_token', token);
  await AsyncStorage.setItem('customer_user', JSON.stringify(user));
};

export const clearCustomerSession = () => AsyncStorage.multiRemove(['customer_token', 'customer_user']);

// Registering does NOT log in — the account needs email verification first (login 403s until
// is_verified is true). The verification link opens the web site's /verify-email page in the
// phone's browser; there's no separate mobile verification flow to build.
export const customerRegister = (name: string, email: string, password: string) =>
  customerApi.post('/auth/register', { name, email, password }).then((r) => r.data.data);

export const customerLogin = async (email: string, password: string) => {
  const res = await customerApi.post<{ success: true; data: { token: string; customer: CustomerUser } }>('/auth/login', {
    email,
    password,
  });
  const { token, customer } = res.data.data;
  await setSession(token, customer);
  return customer;
};

export const customerLogout = async () => {
  await clearCustomerSession();
  customerApi.post('/auth/logout').catch(() => {});
};

export const getMe = () => customerApi.get<{ success: true; data: CustomerUser }>('/auth/me').then((r) => r.data.data);

export const resendVerification = (email: string) => customerApi.post('/auth/resend-verification', { email }).then((r) => r.data);

export const forgotPassword = (email: string) => customerApi.post('/auth/forgot-password', { email }).then((r) => r.data);
