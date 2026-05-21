import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { usePlatformDashboard } from '@/hooks/usePlatformDashboard';
import { PlatformSummaryStats } from '@/components/platform/PlatformSummaryStats';
import { PlatformOrgsTable } from '@/components/platform/PlatformOrgsTable';
import { PlatformActivityFeed } from '@/components/platform/PlatformActivityFeed';
import { PlatformVisitsChart } from '@/components/platform/PlatformVisitsChart';

function SectionSkeleton({ height = 'h-48' }: { height?: string }) {
  return <Skeleton className={`w-full rounded-lg ${height}`} />;
}

export default function PlatformDashboard() {
  const { data, loading, refresh } = usePlatformDashboard();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">Cross-organization statistics and activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {loading ? <SectionSkeleton height="h-28" /> : <PlatformSummaryStats summary={data.summary} />}

      {/* Visits Chart + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? <SectionSkeleton height="h-[320px]" /> : <PlatformVisitsChart data={data.visitsTimeSeries} />}
        </div>
        <div>
          {loading ? <SectionSkeleton height="h-[320px]" /> : <PlatformActivityFeed feed={data.activityFeed} />}
        </div>
      </div>

      {/* Orgs Table */}
      {loading ? <SectionSkeleton height="h-64" /> : <PlatformOrgsTable organizations={data.organizations} />}
    </div>
  );
}
