import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConsent, setConsent, COOKIE_CONSENT_EVENT } from './cookieConsent';

describe('cookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no decision has been made yet', () => {
    expect(getConsent()).toBeNull();
  });

  it('persists and returns an accepted decision', () => {
    setConsent('accepted');
    expect(getConsent()).toBe('accepted');
  });

  it('persists and returns a declined decision', () => {
    setConsent('declined');
    expect(getConsent()).toBe('declined');
  });

  it('ignores garbage previously stored under the key', () => {
    localStorage.setItem('cookie_consent', 'not-a-real-value');
    expect(getConsent()).toBeNull();
  });

  it('dispatches a window event with the chosen value when consent changes', () => {
    const handler = vi.fn();
    window.addEventListener(COOKIE_CONSENT_EVENT, handler);

    setConsent('accepted');

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toBe('accepted');

    window.removeEventListener(COOKIE_CONSENT_EVENT, handler);
  });
});
