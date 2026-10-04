require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');
const { maybeStartFolderWatcher } = require('./services/folderWatcherService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error('Failed to connect to MongoDB at startup:', err.message);
    logger.error('Check MONGO_URI in your .env file. Exiting.');
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);
  maybeStartFolderWatcher();

  server.listen(PORT, () => {
    logger.info(`Teamcenter -> MES pipeline API listening on port ${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    // Force-exit if connections don't close in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
