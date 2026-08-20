const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../../src/config/db', () => ({ query: jest.fn() }));
jest.mock('otplib', () => ({ generateSecret: jest.fn(), generateURI: jest.fn(), verify: jest.fn(), generate: jest.fn() }));
jest.mock('qrcode', () => ({ toDataURL: jest.fn() }));
const pool = require('../../src/config/db');
const app = require('../../src/app');

function signAdminToken(overrides = {}) {
  return jwt.sign({ id: 1, email: 'admin@test.com', role: 'editor', permissions: [], tv: 1, ...overrides }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

beforeEach(() => {
  pool.query.mockReset();
});

describe('adminAuth token_version revocation', () => {
  it('accepts a token whose tv claim matches the current DB token_version', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ token_version: 1, is_active: true }] });

    const res = await request(app).get('/api/admin/me').set('Authorization', `Bearer ${signAdminToken({ tv: 1 })}`);

    // A stale req.admin is set from the JWT, then admin.controller.js's `me` does its own fresh
    // lookup — that second query isn't mocked here, so it 500s past the auth layer. What this test
    // actually verifies is that adminAuth let the request through (not a 401) — the real assertion.
    expect(res.status).not.toBe(401);
  });

  it('rejects a token whose tv claim is behind the current DB token_version (password changed elsewhere)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ token_version: 2, is_active: true }] });

    const res = await request(app).get('/api/admin/me').set('Authorization', `Bearer ${signAdminToken({ tv: 1 })}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/session has expired/i);
  });

  it('rejects a token for an account that no longer exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/admin/me').set('Authorization', `Bearer ${signAdminToken()}`);

    expect(res.status).toBe(401);
  });

  it('rejects a token for a deactivated account even with a matching tv', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ token_version: 1, is_active: false }] });

    const res = await request(app).get('/api/admin/me').set('Authorization', `Bearer ${signAdminToken({ tv: 1 })}`);

    expect(res.status).toBe(401);
  });
});
