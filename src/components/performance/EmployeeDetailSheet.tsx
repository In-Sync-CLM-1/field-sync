import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useEmployeeDetail } from '@/hooks/usePerformanceReview';
import { User, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EmployeeDetailSheetProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export function EmployeeDetailSheet({ userId, open, onClose }: EmployeeDetailSheetProps) {
  const { data, isLoading } = useEmployeeDetail(userId);

  if (!open) return null;

  const profile = data?.profile;
  const visits = data?.visits || [];
  const attendance = data?.attendance || [];
  const plans = data?.dailyPlans || [];

  // Aggregate plan metrics
  const salesTarget = plans.reduce((s, p) => s + (p.policies_target || 0), 0);
  const salesActual = plans.reduce((s, p) => s + (p.policies_actual || 0), 0);
  const prospectsTarget = plans.reduce((s, p) => s + (p.prospects_target || 0), 0);
  const prospectsActual = plans.reduce((s, p) => s + (p.prospects_actual || 0), 0);
  const quotesTarget = plans.reduce((s, p) => s + (p.quotes_target || 0), 0);
  const quotesActual = plans.reduce((s, p) => s + (p.quotes_actual || 0), 0);

  const completedVisits = visits.filter(v => v.status === 'completed').length;

  // Daily visits chart data
  const dailyVisitMap = new Map<string, number>();
  visits.forEach(v => {
    const d = v.check_in_time.split('T')[0];
    dailyVisitMap.set(d, (dailyVisitMap.get(d) || 0) + 1);
  });
  const chartData = Array.from(dailyVisitMap.entries())
    .map(([date, count]) => ({ date, visits: count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const gauges = [
    { label: 'Prospects', actual: prospectsActual, target: prospectsTarget },
    { label: 'Quotes', actual: quotesActual, target: quotesTarget },
    { label: 'Sales', actual: salesActual, target: salesTarget },
  ];

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Employee Detail
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-32" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-3">
                <h3 className="font-semibold text-foreground">{profile?.full_name || 'Unknown'}</h3>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                {profile?.branchName && (
                  <Badge variant="secondary" className="mt-1 text-xs">{profile.branchName}</Badge>
                )}
              </CardContent>
            </Card>

            {/* Monthly Summary */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-2 text-center">
                  <MapPin className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold text-foreground">{visits.length}</p>
                  <p className="text-[10px] text-muted-foreground">Visits</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <Calendar className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold text-foreground">{attendance.length}</p>
                  <p className="text-[10px] text-muted-foreground">Att. Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-2 text-center">
                  <Clock className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold text-foreground">{completedVisits}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Plan Achievement Gauges */}
            <Card>
              <CardContent className="p-3 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Plan Achievement</h4>
                {gauges.map(g => {
                  const pct = g.target > 0 ? Math.min(Math.round((g.actual / g.target) * 100), 100) : 0;
                  return (
                    <div key={g.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{g.label}</span>
                        <span className="text-muted-foreground">{g.actual}/{g.target} ({g.target > 0 ? Math.round((g.actual / g.target) * 100) : 0}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Daily Visits Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Daily Visits</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" tick={{ fontSize: 8 }} tickFormatter={d => d.slice(5)} />
                        <YAxis tick={{ fontSize: 8 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="visits" stroke="hsl(174, 99%, 36%)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Recent Activity</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {visits.slice(0, 10).map(v => (
                    <div key={v.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground">{v.purpose || 'Visit'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={v.status === 'completed' ? 'default' : v.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px] px-1">
                          {v.status}
                        </Badge>
                        <span className="text-muted-foreground">{format(new Date(v.check_in_time), 'dd MMM')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
