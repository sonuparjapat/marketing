import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  type CustomerUser,
  getStoredCustomerToken,
  getStoredCustomer,
  clearCustomerSession,
  customerLogin,
  customerRegister,
  customerLogout,
  getMe,
} from '../api/customerAuth';

type AuthResult = { success: true } | { success: false; message: string };

type CustomerAuthValue = {
  customer: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  refresh: () => Promise<void>;
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

  const refresh = useCallback(async () => {
    const token = await getStoredCustomerToken();
    if (!token) {
      setCustomer(null);
      return;
    }
    try {
      const me = await getMe();
      setCustomer(me);
    } catch {
      await clearCustomerSession();
      setCustomer(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const cached = await getStoredCustomer();
      if (cached) setCustomer(cached);
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const user = await customerLogin(email, password);
      setCustomer(user);
      return { success: true };
    } catch (err) {
      return { success: false, message: errMessage(err, 'Invalid credentials.') };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      await customerRegister(name, email, password);
      return { success: true };
    } catch (err) {
      return { success: false, message: errMessage(err, 'Something went wrong.') };
    }
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    customerLogout();
  }, []);

  const value = useMemo(
    () => ({ customer, loading, login, register, logout, refresh }),
    [customer, loading, login, register, logout, refresh]
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
