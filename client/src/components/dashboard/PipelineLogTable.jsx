import { useState } from 'react';
import StatusBadge from './StatusBadge';
import StageStepper from './StageStepper';
import ProgressBar from './ProgressBar';
import RunDetailDrawer from './RunDetailDrawer';
import { SOURCE_META } from '../../utils/constants';
import { formatDateTime, formatNumber } from '../../utils/formatters';

export default function PipelineLogTable({ runs, loading }) {
  const [selectedRun, setSelectedRun] = useState(null);

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-base-700 px-4 py-3">
        <span className="font-mono-industrial text-[11px] uppercase tracking-wide text-base-400">Pipeline Log</span>
        <span className="text-[11px] text-base-400">{runs.length} run(s) shown</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-base-700 text-[10px] uppercase tracking-wide text-base-400">
              <th scope="col" className="px-4 py-2 font-medium">Source</th>
              <th scope="col" className="px-4 py-2 font-medium">Format</th>
              <th scope="col" className="px-4 py-2 font-medium">Stage</th>
              <th scope="col" className="px-4 py-2 font-medium">Status</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Records</th>
              <th scope="col" className="px-4 py-2 font-medium">Progress</th>
              <th scope="col" className="px-4 py-2 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                onClick={() => setSelectedRun(run)}
                className="cursor-pointer border-b border-base-800 font-mono-industrial transition-colors hover:bg-base-800/60"
              >
                <td className="px-4 py-2.5 text-base-200">{SOURCE_META[run.source]?.short || run.source}</td>
                <td className="px-4 py-2.5 text-base-200">{run.format}</td>
                <td className="px-4 py-2.5">
                  <StageStepper currentStage={run.stage} status={run.status} />
                </td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-2.5 text-right text-base-200">
                  {run.status === 'PENDING' ? '—' : `${formatNumber(run.successCount)}/${formatNumber(run.recordCount)}`}
                </td>
                <td className="px-4 py-2.5">
                  <div className="w-20 sm:w-24">
                    <ProgressBar value={run.progress} status={run.status} />
                  </div>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-base-400">{formatDateTime(run.createdAt)}</td>
              </tr>
            ))}

            {!loading && runs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-xs text-base-400">
                  No batches yet — trigger one above to see it land here in real time.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedRun && <RunDetailDrawer run={selectedRun} onClose={() => setSelectedRun(null)} />}
    </div>
  );
}
