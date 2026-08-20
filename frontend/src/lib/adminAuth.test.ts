import { describe, it, expect, beforeEach } from 'vitest';
import { getAdminToken, getAdminUser, setAdminSession, clearAdminSession, type AdminUser } from './adminAuth';

const USER: AdminUser = {
  id: 1,
  name: 'Test Admin',
  email: 'admin@test.com',
  role: 'editor',
  department_id: 2,
  department_name: 'Marketing',
  permissions: ['leads.read'],
  totp_enabled: false,
};

describe('adminAuth localStorage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null for both token and user before any session is set', () => {
    expect(getAdminToken()).toBeNull();
    expect(getAdminUser()).toBeNull();
  });

  it('round-trips a token and user through setAdminSession', () => {
    setAdminSession('a-jwt-token', USER);
    expect(getAdminToken()).toBe('a-jwt-token');
    expect(getAdminUser()).toEqual(USER);
  });

  it('clears both token and user on clearAdminSession', () => {
    setAdminSession('a-jwt-token', USER);
    clearAdminSession();
    expect(getAdminToken()).toBeNull();
    expect(getAdminUser()).toBeNull();
  });

  it('overwrites a previous session when a new one is set', () => {
    setAdminSession('token-one', USER);
    setAdminSession('token-two', { ...USER, name: 'Someone Else' });
    expect(getAdminToken()).toBe('token-two');
    expect(getAdminUser()?.name).toBe('Someone Else');
  });
});
