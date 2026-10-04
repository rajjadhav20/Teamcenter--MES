const PipelineRun = require('../models/PipelineRun');
const { RUN_STATUS } = require('../config/constants');

/**
 * Total Transferred / Active Jobs / Failed Batches / Success Rate — the
 * four numbers the overview cards show. Recomputed from PipelineRun on
 * demand rather than kept as a running counter, so it's always consistent
 * with the log table even if a run's status is corrected after the fact.
 */
async function getStats() {
  const [totals] = await PipelineRun.aggregate([
    {
      $group: {
        _id: null,
        totalRuns: { $sum: 1 },
        totalTransferred: { $sum: '$successCount' },
        activeJobs: {
          $sum: {
            $cond: [{ $in: ['$status', [RUN_STATUS.PENDING, RUN_STATUS.PROCESSING]] }, 1, 0],
          },
        },
        failedBatches: {
          $sum: { $cond: [{ $eq: ['$status', RUN_STATUS.FAILED] }, 1, 0] },
        },
        completedBatches: {
          $sum: {
            $cond: [{ $in: ['$status', [RUN_STATUS.SUCCESS, RUN_STATUS.FAILED]] }, 1, 0],
          },
        },
        successBatches: {
          $sum: { $cond: [{ $eq: ['$status', RUN_STATUS.SUCCESS] }, 1, 0] },
        },
      },
    },
  ]);

  const totalRuns = totals?.totalRuns || 0;
  const totalTransferred = totals?.totalTransferred || 0;
  const activeJobs = totals?.activeJobs || 0;
  const failedBatches = totals?.failedBatches || 0;
  const completedBatches = totals?.completedBatches || 0;
  const successBatches = totals?.successBatches || 0;

  const successRate = completedBatches > 0 ? (successBatches / completedBatches) * 100 : 0;

  return {
    totalRuns,
    totalTransferred,
    activeJobs,
    failedBatches,
    successRate: Math.round(successRate * 10) / 10,
  };
}

module.exports = { getStats };
