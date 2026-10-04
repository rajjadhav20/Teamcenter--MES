const PipelineRun = require('../models/PipelineRun');
const IngestionLog = require('../models/IngestionLog');
const IngestionPayload = require('../models/IngestionPayload');
const AppError = require('../utils/AppError');

const MAX_PAGE_SIZE = 100;

function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.limit) || 25));
  return { page, limit, skip: (page - 1) * limit };
}

/** GET /api/v1/pipeline/runs?status=&source=&format=&page=&limit= */
async function getAllRuns(req, res) {
  const { status, source, format } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (format) filter.format = format;

  const [runs, total] = await Promise.all([
    PipelineRun.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PipelineRun.countDocuments(filter),
  ]);

  res.json({
    success: true,
    runs: runs.map((r) => r.toJSON()),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

/** GET /api/v1/pipeline/runs/:id */
async function getRunById(req, res) {
  const run = await PipelineRun.findById(req.params.id);
  if (!run) throw new AppError('Pipeline run not found', 404);
  res.json({ success: true, run: run.toJSON() });
}

/** GET /api/v1/pipeline/runs/:id/logs */
async function getLogsForRun(req, res) {
  const exists = await PipelineRun.exists({ _id: req.params.id });
  if (!exists) throw new AppError('Pipeline run not found', 404);

  const logs = await IngestionLog.find({ pipelineRunId: req.params.id }).sort({ createdAt: 1 });
  res.json({ success: true, logs: logs.map((l) => l.toJSON()) });
}

/** GET /api/v1/pipeline/runs/:id/payloads?page=&limit= */
async function getPayloadsForRun(req, res) {
  const exists = await PipelineRun.exists({ _id: req.params.id });
  if (!exists) throw new AppError('Pipeline run not found', 404);

  const { page, limit, skip } = parsePagination(req.query);
  const [payloads, total] = await Promise.all([
    IngestionPayload.find({ pipelineRunId: req.params.id }).sort({ createdAt: 1 }).skip(skip).limit(limit),
    IngestionPayload.countDocuments({ pipelineRunId: req.params.id }),
  ]);

  res.json({
    success: true,
    payloads: payloads.map((p) => p.toJSON()),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

module.exports = { getAllRuns, getRunById, getLogsForRun, getPayloadsForRun };
