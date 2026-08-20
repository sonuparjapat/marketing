module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  // Every test that touches the app must mock config/db (never hit a real database), and JWT_SECRET
  // must exist before any module reads it at require-time.
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  // sanitize-html pulls in htmlparser2, which ships ESM-only — node_modules is untransformed by
  // default, so this carves out just that dependency chain to run through babel-jest.
  transformIgnorePatterns: ['node_modules/(?!(htmlparser2|domhandler|domutils|domelementtype|entities|dom-serializer)/)'],
};
