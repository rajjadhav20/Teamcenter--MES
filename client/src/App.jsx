import Header from './components/layout/Header';
import StatCardGrid from './components/dashboard/StatCardGrid';
import IngestPanel from './components/dashboard/IngestPanel';
import PipelineLogTable from './components/dashboard/PipelineLogTable';
import ActivityFeed from './components/dashboard/ActivityFeed';
import { useDashboardData } from './hooks/useDashboardData';

export default function App() {
  const { stats, runs, logs, loading, error, refresh } = useDashboardData();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-4 sm:p-6">
        {error && (
          <div className="panel border-andon-failed/40 px-4 py-2 text-xs text-andon-failed">
            Could not reach the API: {error}
          </div>
        )}

        <StatCardGrid stats={stats} />

        <IngestPanel onSubmitted={refresh} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          <PipelineLogTable runs={runs} loading={loading} />
          <div className="min-h-[320px] lg:min-h-0">
            <ActivityFeed logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}
