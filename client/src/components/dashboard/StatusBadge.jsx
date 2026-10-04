import { STATUS_META } from '../../utils/constants';

const DOT_CLASS = {
  PENDING: 'bg-andon-pending',
  PROCESSING: 'bg-andon-processing animate-andon-pulse',
  SUCCESS: 'bg-andon-success',
  FAILED: 'bg-andon-failed',
};

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status };
  const dotClass = DOT_CLASS[status] || 'bg-base-400';

  return (
    <span className="inline-flex items-center gap-1.5 rounded-badge border border-base-700 bg-base-900 px-2 py-1 font-mono-industrial text-[11px] uppercase tracking-wide text-base-100">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
