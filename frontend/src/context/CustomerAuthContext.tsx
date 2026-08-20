'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import customerApiClient from '@/lib/customerApiClient';
import {
  getCustomerToken,
  getCustomerUser,
  setCustomerSession,
  clearCustomerSession,
  type CustomerUser,
} from '@/lib/customerAuth';

type AuthResult = { success: true } | { success: false; message: string };

type CustomerAuthValue = {
  customer: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, password: string) => Promise<AuthResult>;
  updateProfile: (name: string) => Promise<AuthResult>;
};

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { message?: string } } }).response?.data?.message || fallback;
  }
  return fallback;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Show the cached user immediately, then quietly confirm against the server in the
    // background — same pattern as AdminAuthContext, avoids a flash of "signed out" on load.
    setCustomer(getCustomerUser());
    customerApiClient
      .get('/auth/me')
      .then((res) => {
        setCustomerSession(token, res.data.data);
        setCustomer(res.data.data);
      })
      .catch(() => {
        clearCustomerSession();
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await customerApiClient.post('/auth/login', { email, password });
      const { token, customer: user } = res.data.data;
      setCustomerSession(token, user);
      setCustomer(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: errMessage(err, 'Invalid credentials.') };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await customerApiClient.post('/auth/register', { name, email, password });
      const { token, customer: user } = res.data.data;
      setCustomerSession(token, user);
      setCustomer(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: errMessage(err, 'Something went wrong.') };
    }
  }, []);

  const logout = useCallback(() => {
    clearCustomerSession();
    setCustomer(null);
    customerApiClient.post('/auth/logout').catch(() => {});
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await customerApiClient.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (err) {
      return { success: false, message: errMessage(err, 'Something went wrong.') };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string): Promise<AuthResult> => {
    try {
      await customerApiClient.post('/auth/reset-password', { token, password });
      return { success: true };
    } catch (err) {
      return { success: false, message: errMessage(err, 'Something went wrong.') };
    }
  }, []);

  const updateProfile = useCallback(
    async (name: string): Promise<AuthResult> => {
      try {
        const res = await customerApiClient.patch('/auth/me', { name });
        const token = getCustomerToken();
        if (token) setCustomerSession(token, res.data.data);
        setCustomer(res.data.data);
        return { success: true };
      } catch (err) {
        return { success: false, message: errMessage(err, 'Something went wrong.') };
      }
    },
    []
  );

  const value = useMemo(
    () => ({ customer, loading, login, register, logout, forgotPassword, resetPassword, updateProfile }),
    [customer, loading, login, register, logout, forgotPassword, resetPassword, updateProfile]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
