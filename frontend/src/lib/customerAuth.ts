export type CustomerUser = { id: number; name: string; email: string; is_premium: boolean };

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('customer_token');
}

export function getCustomerUser(): CustomerUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('customer_user');
  return raw ? JSON.parse(raw) : null;
}

export function setCustomerSession(token: string, user: CustomerUser) {
  localStorage.setItem('customer_token', token);
  localStorage.setItem('customer_user', JSON.stringify(user));
}

export function clearCustomerSession() {
  localStorage.removeItem('customer_token');
  localStorage.removeItem('customer_user');
}
