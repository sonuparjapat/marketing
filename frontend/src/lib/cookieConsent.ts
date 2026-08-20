'use client';

const KEY = 'cookie_consent';
export const COOKIE_CONSENT_EVENT = 'cookieconsent-change';

export type ConsentValue = 'accepted' | 'declined';

export function getConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function setConsent(value: ConsentValue) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, value);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }));
}
