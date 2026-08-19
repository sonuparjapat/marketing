'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { getAdminToken, getAdminUser, setAdminSession, clearAdminSession, type AdminUser } from '@/lib/adminAuth';

type AdminAuthValue = {
  admin: AdminUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  hasPermission: (key: string) => boolean;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
    router.replace('/admin/login');
  }, [router]);

  const refresh = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      setLoading(false);
      router.replace('/admin/login');
      return;
    }
    try {
      const res = await apiClient.get('/admin/me');
      const fresh = res.data.data as AdminUser;
      setAdminSession(token, fresh);
      setAdmin(fresh);
    } catch {
      clearAdminSession();
      setAdmin(null);
      router.replace('/admin/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setLoading(false);
      router.replace('/admin/login');
      return;
    }
    // Show the cached user immediately, then quietly confirm/refresh permissions in the background —
    // avoids a blank "checking session" flash on every admin page load.
    setAdmin(getAdminUser());
    setLoading(false);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSuperAdmin = admin?.role === 'super_admin';

  const hasPermission = useCallback(
    (key: string) => {
      if (!admin) return false;
      if (admin.role === 'super_admin') return true;
      return Array.isArray(admin.permissions) && admin.permissions.includes(key);
    },
    [admin]
  );

  const value = useMemo(
    () => ({ admin, loading, isSuperAdmin, hasPermission, logout, refresh }),
    [admin, loading, isSuperAdmin, hasPermission, logout, refresh]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
