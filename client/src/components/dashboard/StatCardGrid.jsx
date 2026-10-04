import { PackageCheck, Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import { formatNumber, formatPercent } from '../../utils/formatters';

export default function StatCardGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total Transferred"
        value={formatNumber(stats.totalTransferred)}
        sublabel="records loaded to MES"
        icon={PackageCheck}
        accentColor="var(--color-andon-success)"
      />
      <StatCard
        label="Active Jobs"
        value={formatNumber(stats.activeJobs)}
        sublabel="pending or processing"
        icon={Activity}
        accentColor="var(--color-andon-processing)"
      />
      <StatCard
        label="Failed Batches"
        value={formatNumber(stats.failedBatches)}
        sublabel="across all runs"
        icon={AlertTriangle}
        accentColor="var(--color-andon-failed)"
      />
      <StatCard
        label="Success Rate"
        value={formatPercent(stats.successRate)}
        sublabel="of completed batches"
        icon={TrendingUp}
        accentColor="var(--color-andon-pending)"
      />
    </div>
  );
}
