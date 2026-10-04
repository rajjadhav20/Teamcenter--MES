const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { SOCKET_EVENTS } = require('../config/constants');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (${io.engine.clientsCount} online)`);

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Broadcasts an event to every connected dashboard client. Safe to call
 * before a client has connected, and safe to call in environments (like a
 * one-off script) where sockets were never initialized at all — it just
 * becomes a no-op logged at debug level instead of a crash.
 */
function emit(event, payload) {
  if (!io) {
    logger.debug(`Socket not initialized, dropped event: ${event}`);
    return;
  }
  io.emit(event, payload);
}

function getIO() {
  return io;
}

module.exports = { initSocket, emit, getIO, SOCKET_EVENTS };
