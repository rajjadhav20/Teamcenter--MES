const express = require('express');
const {
  getAllRuns,
  getRunById,
  getLogsForRun,
  getPayloadsForRun,
} = require('../controllers/pipelineController');

const router = express.Router();

router.get('/runs', getAllRuns);
router.get('/runs/:id', getRunById);
router.get('/runs/:id/logs', getLogsForRun);
router.get('/runs/:id/payloads', getPayloadsForRun);

module.exports = router;
