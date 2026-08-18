import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './client';

export type AdminUser = { id: number; name: string; email: string; role: string };

export const adminLogin = async (email: string, password: string) => {
  const res = await api.post<{ success: true; data: { token: string; admin: AdminUser } }>('/admin/login', {
    email,
    password,
  });
  const { token, admin } = res.data.data;
  await AsyncStorage.setItem('admin_token', token);
  await AsyncStorage.setItem('admin_user', JSON.stringify(admin));
  return admin;
};

export const getStoredAdmin = async (): Promise<AdminUser | null> => {
  const raw = await AsyncStorage.getItem('admin_user');
  return raw ? JSON.parse(raw) : null;
};

export const adminLogout = async () => {
  await AsyncStorage.removeItem('admin_token');
  await AsyncStorage.removeItem('admin_user');
};

export const getAdminStats = () =>
  api
    .get<{
      success: true;
      data: {
        leadsToday: number;
        leadsTotal: number;
        pendingCallbacks: number;
        recentLeads: { id: number; name: string; email: string; status: string; created_at: string }[];
      };
    }>('/admin/stats')
    .then((r) => r.data.data);

export const registerPushToken = (token: string, platform: string) =>
  api.post('/admin/push-tokens', { token, platform });

export const unregisterPushToken = (token: string) => api.delete(`/admin/push-tokens/${encodeURIComponent(token)}`);
