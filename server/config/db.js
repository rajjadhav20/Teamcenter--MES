const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB. Fails fast (short server selection timeout) rather
 * than hanging indefinitely, so a broken connection string surfaces
 * immediately at startup instead of as a mysterious later timeout.
 */
async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is not set. Copy .env.example to .env and configure it.');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  logger.info(`MongoDB connected -> ${mongoose.connection.host}/${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
