// Only exists so Jest can transform the handful of ESM-only transitive dependencies (htmlparser2
// and friends, pulled in by sanitize-html) into CommonJS. The app itself never runs through Babel —
// server.js runs on plain Node.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
