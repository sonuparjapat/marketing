// Runs before every test file. These tests never connect to a real database — every test that
// exercises a route mocks `src/config/db` — so this just needs to satisfy modules that read
// process.env at require-time (JWT signing, mailer's isConfigured check, etc).
process.env.JWT_SECRET = 'test-secret-do-not-use-in-production';
process.env.NODE_ENV = 'test';
