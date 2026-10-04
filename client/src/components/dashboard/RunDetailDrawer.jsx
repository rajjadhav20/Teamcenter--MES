import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '../../api/axiosClient';
import StatusBadge from './StatusBadge';
import { formatDateTime } from '../../utils/formatters';
import { SOURCE_META, STAGE_META } from '../../utils/constants';

const LEVEL_CLASS = {
  INFO: 'text-base-300',
  WARN: 'text-andon-processing',
  ERROR: 'text-andon-failed',
};

export default function RunDetailDrawer({ run, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingLogs(true);

    apiClient
      .get(`/pipeline/runs/${run.id}/logs`)
      .then((res) => {
        if (!cancelled) setLogs(res.data.logs);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLogs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-panel border border-base-700 bg-base-850 sm:rounded-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Pipeline run detail"
      >
        <div className="flex items-center justify-between border-b border-base-700 px-4 py-3">
          <div>
            <p className="font-mono-industrial text-sm text-base-100">
              {run.fileName || `${SOURCE_META[run.source]?.label || run.source} batch`}
            </p>
            <p className="text-[11px] text-base-400">{formatDateTime(run.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-badge p-1.5 text-base-400 hover:bg-base-800 hover:text-base-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-base-700 p-4 text-xs sm:grid-cols-4">
          <div>
            <p className="text-base-400">Status</p>
            <div className="mt-1">
              <StatusBadge status={run.status} />
            </div>
          </div>
          <div>
            <p className="text-base-400">Stage</p>
            <p className="mt-1 font-mono-industrial text-base-100">
              {run.stage}: {STAGE_META[run.stage]?.label}
            </p>
          </div>
          <div>
            <p className="text-base-400">Records</p>
            <p className="mt-1 font-mono-industrial text-base-100">
              {run.successCount} ok / {run.failedCount} failed / {run.recordCount} total
            </p>
          </div>
          <div>
            <p className="text-base-400">Source</p>
            <p className="mt-1 font-mono-industrial text-base-100">{SOURCE_META[run.source]?.label || run.source}</p>
          </div>
        </div>

        {run.errorMessage && (
          <div className="border-b border-base-700 bg-andon-failed/10 px-4 py-2 text-xs text-andon-failed">
            {run.errorMessage}
          </div>
        )}

        <div className="p-4">
          <p className="mb-2 font-mono-industrial text-[11px] uppercase tracking-wide text-base-400">Activity Log</p>
          {loadingLogs && <p className="text-xs text-base-400">Loading…</p>}
          {!loadingLogs && logs.length === 0 && <p className="text-xs text-base-400">No log entries for this run.</p>}
          <ul className="space-y-1.5">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-2 font-mono-industrial text-[11px]">
                <span className="mt-0.5 shrink-0 text-base-500">{formatDateTime(log.createdAt)}</span>
                <span className={LEVEL_CLASS[log.level] || 'text-base-300'}>{log.message}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
