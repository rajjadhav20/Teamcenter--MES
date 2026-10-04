export default function StatCard({ label, value, sublabel, icon: Icon, accentColor }) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <div className="flex items-start justify-between">
        <span className="font-mono-industrial text-[10px] uppercase tracking-wide text-base-400 sm:text-[11px]">
          {label}
        </span>
        {Icon && <Icon size={16} className="text-base-500" aria-hidden="true" />}
      </div>
      <div className="mt-2 font-mono-industrial text-2xl font-semibold text-base-100 sm:text-3xl">{value}</div>
      {sublabel && <div className="mt-1 text-[11px] text-base-400">{sublabel}</div>}
    </div>
  );
}
