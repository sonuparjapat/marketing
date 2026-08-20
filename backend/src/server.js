require('dotenv').config();
require('./config/sentry').init();

const http = require('http');
const app = require('./app');
const initDB = require('./database/init');
const { initSocket } = require('./socket');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initDB();
    const httpServer = http.createServer(app);
    initSocket(httpServer);
    httpServer.listen(PORT, () => {
      console.log(`Agency backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
