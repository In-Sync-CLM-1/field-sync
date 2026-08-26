import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useReportData, ReportPeriod } from '@/hooks/useReportData';
import { PeriodTabs } from '@/components/reports/PeriodTabs';
import RepReportView from '@/components/reports/RepReportView';
import { exportRepReportCsv } from '@/lib/reportExport';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download } from 'lucide-react';

export default function MyReport() {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const { user } = useAuthStore();
  const { data, loading } = useReportData(period, { repId: user?.id });
  const navigate = useNavigate();

  const detail = user?.id ? data.detail[user.id] : null;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 py-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-primary uppercase tracking-wider">Reports</span>
          <h1 className="text-2xl font-display font-semibold tracking-tight flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            My Report
          </h1>
          <p className="text-sm text-muted-foreground">Your distance, visits, orders & collections.</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodTabs value={period} onChange={setPeriod} />
          {detail && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportRepReportCsv(detail, period)}>
              <Download className="h-3.5 w-3.5" /> Share
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-20" />)}</div>
          <Skeleton className="h-64" />
        </div>
      ) : detail ? (
        <RepReportView
          detail={detail}
          showRouteMap={period === 'today'}
          onOpenVisit={(id) => navigate(`/dashboard/visits/${id}`)}
        />
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">No activity to report yet for this period.</p>
      )}
    </div>
  );
}
