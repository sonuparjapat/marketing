const bcrypt = require('bcryptjs');
const request = require('supertest');

jest.mock('../../src/config/db', () => ({ query: jest.fn() }));
// otplib ships some dependencies as TS/ESM source that Jest can't parse without a much heavier
// transform setup — these tests don't exercise real 2FA code paths, just the routes that import
// admin.controller.js (which requires otplib at module load time), so a minimal stub is enough.
jest.mock('otplib', () => ({ generateSecret: jest.fn(), generateURI: jest.fn(), verify: jest.fn(), generate: jest.fn() }));
jest.mock('qrcode', () => ({ toDataURL: jest.fn() }));
const pool = require('../../src/config/db');
const app = require('../../src/app');

const PASSWORD = 'correct-horse-battery-staple';
let PASSWORD_HASH;

const BASE_ADMIN = {
  id: 1,
  name: 'Test Admin',
  email: 'admin@test.com',
  role: 'super_admin',
  department_id: null,
  is_active: true,
  token_version: 1,
  totp_enabled: false,
  totp_secret: null,
};

beforeAll(async () => {
  PASSWORD_HASH = await bcrypt.hash(PASSWORD, 4); // low cost factor — this only needs to be correct, not slow
});

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/admin/login', () => {
  it('rejects an unknown email with 401 and a generic message (no user-enumeration hint)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).post('/api/admin/login').send({ email: 'nobody@test.com', password: 'x' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('rejects a wrong password with 401', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...BASE_ADMIN, password_hash: PASSWORD_HASH }] });

    const res = await request(app).post('/api/admin/login').send({ email: BASE_ADMIN.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('rejects a deactivated account even with the correct password', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...BASE_ADMIN, is_active: false, password_hash: PASSWORD_HASH }] });

    const res = await request(app).post('/api/admin/login').send({ email: BASE_ADMIN.email, password: PASSWORD });

    expect(res.status).toBe(403);
  });

  it('issues a token and full profile for a correct password with 2FA off', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ ...BASE_ADMIN, password_hash: PASSWORD_HASH }] }) // SELECT admin
      .mockResolvedValueOnce({ rows: [] }); // UPDATE last_login

    const res = await request(app).post('/api/admin/login').send({ email: BASE_ADMIN.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.requires2fa).toBeUndefined();
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.admin.email).toBe(BASE_ADMIN.email);
    // A super_admin's permissions array is never consulted (checkPermission short-circuits on role),
    // but the login response should still not leak anything beyond the documented profile shape.
    expect(res.body.data.admin.password_hash).toBeUndefined();
  });

  it('returns a pending token instead of a session when 2FA is enabled — no full token yet', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ ...BASE_ADMIN, totp_enabled: true, password_hash: PASSWORD_HASH }] });

    const res = await request(app).post('/api/admin/login').send({ email: BASE_ADMIN.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.requires2fa).toBe(true);
    expect(typeof res.body.data.pendingToken).toBe('string');
    expect(res.body.data.token).toBeUndefined();
  });

  it('requires both email and password', async () => {
    const res = await request(app).post('/api/admin/login').send({ email: BASE_ADMIN.email });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/me', () => {
  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/admin/me');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed/garbage bearer token', async () => {
    const res = await request(app).get('/api/admin/me').set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });
});
