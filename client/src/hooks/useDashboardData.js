import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/axiosClient';
import socket from '../api/socketClient';

const EMPTY_STATS = { totalRuns: 0, totalTransferred: 0, activeJobs: 0, failedBatches: 0, successRate: 0 };
const MAX_RUNS_SHOWN = 50;
const MAX_LOGS_SHOWN = 100;

/**
 * Loads the initial dashboard snapshot over REST, then keeps it current
 * with Socket.io events for the rest of the session — the table and stat
 * cards never need to poll.
 */
export function useDashboardData() {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [runs, setRuns] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, runsRes] = await Promise.all([
        apiClient.get('/dashboard/stats'),
        apiClient.get('/pipeline/runs', { params: { limit: MAX_RUNS_SHOWN } }),
      ]);
      setStats(statsRes.data.stats);
      setRuns(runsRes.data.runs);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onNewRun(run) {
      setRuns((prev) => [run, ...prev.filter((r) => r.id !== run.id)].slice(0, MAX_RUNS_SHOWN));
    }

    function onUpdateRun(run) {
      setRuns((prev) => {
        const exists = prev.some((r) => r.id === run.id);
        if (!exists) return [run, ...prev].slice(0, MAX_RUNS_SHOWN);
        return prev.map((r) => (r.id === run.id ? run : r));
      });
    }

    function onStatsUpdate(nextStats) {
      setStats(nextStats);
    }

    function onNewLog(log) {
      setLogs((prev) => [log, ...prev].slice(0, MAX_LOGS_SHOWN));
    }

    socket.on('pipeline:new', onNewRun);
    socket.on('pipeline:update', onUpdateRun);
    socket.on('stats:update', onStatsUpdate);
    socket.on('log:new', onNewLog);

    return () => {
      socket.off('pipeline:new', onNewRun);
      socket.off('pipeline:update', onUpdateRun);
      socket.off('stats:update', onStatsUpdate);
      socket.off('log:new', onNewLog);
    };
  }, []);

  return { stats, runs, logs, loading, error, refresh };
}
