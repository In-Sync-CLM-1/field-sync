import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReportData, ReportPeriod } from '@/hooks/useReportData';
import { PeriodTabs } from '@/components/reports/PeriodTabs';
import RepReportView from '@/components/reports/RepReportView';
import { exportTeamReportCsv } from '@/lib/reportExport';
import { StatusKPICard } from '@/components/dashboard/StatusKPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Route, Users, MapPin, ShoppingBag, IndianRupee, Download, FileText, ChevronRight, Activity,
} from 'lucide-react';

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

const statusDot: Record<string, string> = {
  'on-visit': 'bg-green-500',
  'available': 'bg-blue-500',
  'idle': 'bg-gray-400',
};

export default function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>('today');
  const { data, loading } = useReportData(period);
  const [openRep, setOpenRep] = useState<string | null>(null);
  const navigate = useNavigate();

  const t = data.totals;
  const openDetail = openRep ? data.detail[openRep] : null;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Team Report
          </h1>
          <p className="text-sm text-muted-foreground">Distance, visits, orders & collections — drill into any rep.</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodTabs value={period} onChange={setPeriod} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportTeamReportCsv(data.rows, t, period)}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          {/* Team summary */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatusKPICard title="Distance" value={`${t.distanceKm} km`} subtitle={`${t.reps} reps`} icon={Route} accent="warning" />
            <StatusKPICard title="Clients Visited" value={t.clientsVisited} subtitle={`${t.visits} visits`} icon={Users} accent="primary" />
            <StatusKPICard title="Visits" value={t.visits} subtitle="check-ins" icon={MapPin} accent="info" />
            <StatusKPICard title="Orders" value={t.ordersCount} subtitle={t.ordersValue > 0 ? inr(t.ordersValue) : undefined} icon={ShoppingBag} accent="info" />
            <StatusKPICard title="Collected" value={inr(t.collectionsValue)} subtitle={`${t.collectionsCount} payments`} icon={IndianRupee} accent="success" />
          </div>

          {/* Per-rep table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                By Rep
                <Badge variant="outline" className="text-[10px] ml-1">tap a row for detail</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Rep</TableHead>
                      <TableHead className="text-xs text-right">Distance</TableHead>
                      <TableHead className="text-xs text-center">Clients</TableHead>
                      <TableHead className="text-xs text-center">Visits</TableHead>
                      <TableHead className="text-xs text-center">Adherence</TableHead>
                      <TableHead className="text-xs text-right">Orders</TableHead>
                      <TableHead className="text-xs text-right">Collected</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No activity in this period.</TableCell></TableRow>
                    ) : data.rows.map(r => (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpenRep(r.id)}>
                        <TableCell className="text-sm font-medium">
                          <span className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${statusDot[r.status]}`} />
                            {r.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right">{r.distanceKm} km</TableCell>
                        <TableCell className="text-sm text-center">{r.clientsVisited}</TableCell>
                        <TableCell className="text-sm text-center font-medium">{r.visits}</TableCell>
                        <TableCell className="text-sm text-center">
                          {r.visitsPlanned > 0
                            ? <span className={r.adherencePct >= 80 ? 'text-green-600' : r.adherencePct >= 50 ? 'text-amber-600' : 'text-red-600'}>{r.adherencePct}%</span>
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-right">{r.ordersValue > 0 ? inr(r.ordersValue) : '—'}</TableCell>
                        <TableCell className="text-sm text-right">{r.collectionsValue > 0 ? inr(r.collectionsValue) : '—'}</TableCell>
                        <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Drill-in: the SAME RepReportView the agent sees */}
      <Sheet open={!!openRep} onOpenChange={(o) => !o && setOpenRep(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {openDetail && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center justify-between pr-6">
                  <span>{openDetail.summary.name}</span>
                </SheetTitle>
              </SheetHeader>
              <RepReportView
                detail={openDetail}
                showRouteMap={period === 'today'}
                onOpenVisit={(id) => navigate(`/dashboard/visits/${id}`)}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
