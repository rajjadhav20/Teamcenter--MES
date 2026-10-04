const express = require('express');
const ingestionRoutes = require('./ingestionRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

router.use('/ingest', ingestionRoutes);
router.use('/pipeline', pipelineRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
