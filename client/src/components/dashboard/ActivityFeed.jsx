import { formatTimestamp } from '../../utils/formatters';

const LEVEL_CLASS = {
  INFO: 'text-base-300',
  WARN: 'text-andon-processing',
  ERROR: 'text-andon-failed',
};

export default function ActivityFeed({ logs }) {
  return (
    <div className="panel flex h-full flex-col">
      <div className="border-b border-base-700 px-4 py-3">
        <span className="font-mono-industrial text-[11px] uppercase tracking-wide text-base-400">Live Activity</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {logs.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-base-400">
            Activity from every batch streams here as it happens.
          </p>
        )}
        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-start gap-2 border-b border-base-800/70 pb-2 font-mono-industrial text-[11px] last:border-0 last:pb-0"
            >
              <span className="mt-0.5 shrink-0 text-base-500">{formatTimestamp(log.createdAt)}</span>
              <span className={LEVEL_CLASS[log.level] || 'text-base-300'}>{log.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
