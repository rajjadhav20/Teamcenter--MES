const PipelineRun = require('../models/PipelineRun');
const IngestionPayload = require('../models/IngestionPayload');
const { parseByFormat } = require('../parsers');
const { transformRecord } = require('./transformService');
const { validatePayload } = require('./validationService');
const { logEvent } = require('./auditLogService');
const { getStats } = require('./dashboardService');
const { emit } = require('./socketService');
const pipelineQueue = require('./pipelineQueue');
const logger = require('../utils/logger');
const { RUN_STATUS, STAGE, LOG_LEVEL, SOCKET_EVENTS } = require('../config/constants');

/** Persists a partial update to a run and broadcasts the new state. */
async function updateRun(run, patch) {
  Object.assign(run, patch);
  await run.save();
  emit(SOCKET_EVENTS.PIPELINE_UPDATE, run.toJSON());
  return run;
}

async function broadcastStats() {
  const stats = await getStats();
  emit(SOCKET_EVENTS.STATS_UPDATE, stats);
  return stats;
}

/**
 * Creates the PipelineRun row for an incoming batch and enqueues the actual
 * processing work. Returns immediately with the PENDING run so the calling
 * HTTP handler can respond without waiting for the batch to finish — the
 * dashboard then watches the run progress over the socket.
 */
async function submitBatch({ source, format, fileName = null, rawInput }) {
  const run = await PipelineRun.create({ source, format, fileName, status: RUN_STATUS.PENDING });
  emit(SOCKET_EVENTS.PIPELINE_NEW, run.toJSON());
  await broadcastStats();

  await logEvent(run.id, {
    level: LOG_LEVEL.INFO,
    stage: STAGE.RECEIVE,
    message: `Batch received from ${source}${fileName ? ` (${fileName})` : ''}`,
  });

  pipelineQueue.enqueue(() => processRun(run.id, rawInput));

  return run;
}

/**
 * The actual OP-10 -> OP-40 pipeline job. Re-fetches the run by id (rather
 * than closing over the document instance) since some time may have
 * passed between enqueue and the queue actually picking this job up.
 */
async function processRun(runId, rawInput) {
  const run = await PipelineRun.findById(runId);
  if (!run) {
    logger.error(`processRun: PipelineRun ${runId} vanished before processing`);
    return;
  }

  try {
    await updateRun(run, { status: RUN_STATUS.PROCESSING, stage: STAGE.RECEIVE, startedAt: new Date() });

    // --- OP-20: PARSE -------------------------------------------------
    await updateRun(run, { stage: STAGE.PARSE });
    let rawRecords;
    try {
      rawRecords = await parseByFormat(run.format, rawInput);
    } catch (err) {
      await logEvent(run.id, { level: LOG_LEVEL.ERROR, stage: STAGE.PARSE, message: `Parse failed: ${err.message}` });
      await updateRun(run, {
        status: RUN_STATUS.FAILED,
        errorMessage: `Parse failed: ${err.message}`,
        completedAt: new Date(),
        progress: 100,
      });
      await broadcastStats();
      return;
    }

    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      await logEvent(run.id, { level: LOG_LEVEL.ERROR, stage: STAGE.PARSE, message: 'Batch contained zero parsable records' });
      await updateRun(run, {
        status: RUN_STATUS.FAILED,
        errorMessage: 'No records found in payload',
        completedAt: new Date(),
        progress: 100,
      });
      await broadcastStats();
      return;
    }

    await updateRun(run, { recordCount: rawRecords.length });
    await logEvent(run.id, {
      level: LOG_LEVEL.INFO,
      stage: STAGE.PARSE,
      message: `Parsed ${rawRecords.length} record(s) as ${run.format}`,
    });

    // --- OP-30: TRANSFORM + VALIDATE -----------------------------------
    await updateRun(run, { stage: STAGE.TRANSFORM });

    const validPayloads = [];
    let successCount = 0;
    let failedCount = 0;
    // ~20 progress ticks regardless of batch size, so a 5-record batch and
    // a 5,000-record batch both feel responsive without flooding sockets.
    const emitEvery = Math.max(1, Math.floor(rawRecords.length / 20));

    for (let i = 0; i < rawRecords.length; i += 1) {
      const transformed = transformRecord(rawRecords[i], { pipelineRunId: run.id });
      const { valid, errors } = validatePayload(transformed);

      if (valid) {
        validPayloads.push(transformed);
        successCount += 1;
      } else {
        failedCount += 1;
        await logEvent(run.id, {
          level: LOG_LEVEL.WARN,
          stage: STAGE.TRANSFORM,
          message: `Record ${i + 1} failed validation: ${errors.join('; ')}`,
          meta: { index: i, errors },
        });
      }

      const isLast = i === rawRecords.length - 1;
      if (i % emitEvery === 0 || isLast) {
        const progress = Math.round(((i + 1) / rawRecords.length) * 90); // reserve last 10% for LOAD
        await updateRun(run, { successCount, failedCount, progress });
      }
    }

    // --- OP-40: LOAD ----------------------------------------------------
    await updateRun(run, { stage: STAGE.LOAD });
    if (validPayloads.length > 0) {
      await IngestionPayload.insertMany(validPayloads, { ordered: false });
    }

    const finalStatus = successCount === 0 ? RUN_STATUS.FAILED : RUN_STATUS.SUCCESS;

    await logEvent(run.id, {
      level: finalStatus === RUN_STATUS.FAILED ? LOG_LEVEL.ERROR : LOG_LEVEL.INFO,
      stage: STAGE.LOAD,
      message: `Batch complete: ${successCount} loaded to MES, ${failedCount} failed validation`,
    });

    await updateRun(run, {
      status: finalStatus,
      progress: 100,
      completedAt: new Date(),
      errorMessage: finalStatus === RUN_STATUS.FAILED ? 'All records failed validation' : null,
    });
    await broadcastStats();
  } catch (err) {
    logger.error(`processRun crashed for ${runId}:`, err);
    await logEvent(runId, { level: LOG_LEVEL.ERROR, message: `Unexpected pipeline error: ${err.message}` });
    try {
      await updateRun(run, {
        status: RUN_STATUS.FAILED,
        errorMessage: err.message,
        completedAt: new Date(),
        progress: 100,
      });
      await broadcastStats();
    } catch (saveErr) {
      logger.error(`Failed to persist FAILED status for run ${runId}:`, saveErr);
    }
  }
}

module.exports = { submitBatch, processRun };
