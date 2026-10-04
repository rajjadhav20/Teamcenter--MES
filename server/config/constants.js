/**
 * Central constants for the ingestion pipeline.
 * Keeping these in one place avoids magic strings drifting between the
 * Mongoose schemas, the queue/services, and the API responses.
 */

// Batch/run lifecycle. Intentionally only these four states — partial
// per-record failure inside a run is tracked via successCount/failedCount
// rather than a fifth "PARTIAL" status.
const RUN_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
});

// Where a batch entered the pipeline from.
const SOURCE = Object.freeze({
  API: 'API',
  FOLDER_WATCHER: 'FOLDER_WATCHER',
  GOOGLE_DRIVE_MOCK: 'GOOGLE_DRIVE_MOCK',
});

// Payload formats the parser layer understands.
const FORMAT = Object.freeze({
  JSON: 'JSON',
  XML: 'XML',
  XLSX: 'XLSX',
  CSV: 'CSV',
});

// Routing-sheet-style operation numbering used to describe where a run
// currently sits inside the pipeline. Mirrors real Teamcenter/MES routing
// operation conventions (OP-10, OP-20, ...) rather than generic step numbers.
const STAGE = Object.freeze({
  RECEIVE: 'OP-10',
  PARSE: 'OP-20',
  TRANSFORM: 'OP-30',
  LOAD: 'OP-40',
});

const STAGE_LABELS = Object.freeze({
  [STAGE.RECEIVE]: 'RECEIVE',
  [STAGE.PARSE]: 'PARSE',
  [STAGE.TRANSFORM]: 'VALIDATE / TRANSFORM',
  [STAGE.LOAD]: 'LOAD TO MES',
});

const LOG_LEVEL = Object.freeze({
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
});

// Socket.io event names, kept in one place so client and server docs
// (and this file) stay the single source of truth.
const SOCKET_EVENTS = Object.freeze({
  PIPELINE_NEW: 'pipeline:new',
  PIPELINE_UPDATE: 'pipeline:update',
  LOG_NEW: 'log:new',
  STATS_UPDATE: 'stats:update',
});

const EXTENSION_TO_FORMAT = Object.freeze({
  '.json': FORMAT.JSON,
  '.xml': FORMAT.XML,
  '.xlsx': FORMAT.XLSX,
  '.xls': FORMAT.XLSX,
  '.csv': FORMAT.CSV,
});

module.exports = {
  RUN_STATUS,
  SOURCE,
  FORMAT,
  STAGE,
  STAGE_LABELS,
  LOG_LEVEL,
  SOCKET_EVENTS,
  EXTENSION_TO_FORMAT,
};
