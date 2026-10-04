import { Factory } from 'lucide-react';
import { useSocketConnection } from '../../hooks/useSocket';

export default function Header() {
  const connected = useSocketConnection();

  return (
    <header className="flex items-center justify-between border-b border-base-700 bg-base-900 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2.5">
        <Factory size={20} className="text-andon-processing" aria-hidden="true" />
        <div>
          <h1 className="font-mono-industrial text-sm font-semibold uppercase tracking-wide text-base-100 sm:text-base">
            Teamcenter <span className="text-base-500">&rarr;</span> MES
          </h1>
          <p className="text-[11px] text-base-400 sm:text-xs">Ingestion Bridge &amp; Monitoring</p>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono-industrial text-[11px] uppercase tracking-wide sm:text-xs">
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'bg-andon-success' : 'bg-andon-failed animate-andon-pulse'}`}
          aria-hidden="true"
        />
        <span className={connected ? 'text-andon-success' : 'text-andon-failed'}>
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
    </header>
  );
}
