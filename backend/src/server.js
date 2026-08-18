require('dotenv').config();

const app = require('./app');
const initDB = require('./database/init');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Agency backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
