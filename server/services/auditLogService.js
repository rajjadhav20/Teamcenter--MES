const IngestionLog = require('../models/IngestionLog');
const { emit } = require('./socketService');
const { SOCKET_EVENTS, LOG_LEVEL } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Persists one audit log line for a run and pushes it to connected
 * dashboards in the same call — the activity feed is just this event
 * stream rendered live.
 */
async function logEvent(pipelineRunId, { level = LOG_LEVEL.INFO, stage = null, message, meta } = {}) {
  try {
    const entry = await IngestionLog.create({ pipelineRunId, level, stage, message, meta });
    emit(SOCKET_EVENTS.LOG_NEW, entry.toJSON());
    return entry;
  } catch (err) {
    // Logging must never be the reason a pipeline run fails.
    logger.error('Failed to write ingestion log entry:', err.message);
    return null;
  }
}

module.exports = { logEvent };
