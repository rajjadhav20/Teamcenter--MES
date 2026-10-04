const { getStats } = require('../services/dashboardService');

/** GET /api/v1/dashboard/stats */
async function getDashboardStats(_req, res) {
  const stats = await getStats();
  res.json({ success: true, stats });
}

module.exports = { getDashboardStats };
