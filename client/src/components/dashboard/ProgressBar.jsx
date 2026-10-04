const FILL_CLASS = {
  PENDING: 'bg-andon-pending',
  PROCESSING: 'bg-andon-processing',
  SUCCESS: 'bg-andon-success',
  FAILED: 'bg-andon-failed',
};

export default function ProgressBar({ value = 0, status = 'PENDING' }) {
  const fillClass = FILL_CLASS[status] || 'bg-base-400';
  const clamped = Math.min(100, Math.max(0, value ?? 0));

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-base-800"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${fillClass} transition-[width] duration-500 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
