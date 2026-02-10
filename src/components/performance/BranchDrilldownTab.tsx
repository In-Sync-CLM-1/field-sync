import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useBranchEmployees, type BranchPerformance } from '@/hooks/usePerformanceReview';
import { EmployeeDetailSheet } from './EmployeeDetailSheet';
import { Target, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface BranchDrilldownTabProps {
  branches: BranchPerformance[];
  selectedBranchId: string | null;
  onBranchChange: (branchId: string) => void;
}

export function BranchDrilldownTab({ branches, selectedBranchId, onBranchChange }: BranchDrilldownTabProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const branchId = selectedBranchId || (branches.length > 0 ? branches[0].branchId : null);
  const { data: employees, isLoading } = useBranchEmployees(branchId);

  const currentBranch = branches.find(b => b.branchId === branchId);

  // Employee bar chart data
  const barData = (employees || []).map(e => ({
    name: (e.fullName || '').split(' ')[0],
    'Sales T': e.salesTarget,
    'Sales A': e.salesActual,
    'Prospects T': e.prospectsTarget,
    'Prospects A': e.prospectsActual,
  }));

  // Visit status pie
  const completedCount = (employees || []).reduce((s, e) => s + e.completedVisits, 0);
  const cancelledCount = (employees || []).reduce((s, e) => s + e.cancelledVisits, 0);
  const inProgressCount = (employees || []).reduce((s, e) => s + (e.visitsMonth - e.completedVisits - e.cancelledVisits), 0);
  const pieData = [
    { name: 'Completed', value: completedCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Cancelled', value: cancelledCount },
  ].filter(d => d.value > 0);
  const pieColors = ['hsl(174, 99%, 36%)', 'hsl(48, 93%, 50%)', 'hsl(0, 43%, 51%)'];

  return (
    <div className="space-y-4">
      {/* Branch Selector */}
      <div className="flex items-center gap-3">
        <Select value={branchId || ''} onValueChange={onBranchChange}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="Select Branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map(b => (
              <SelectItem key={b.branchId} value={b.branchId}>{b.branchName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Branch KPIs */}
      {currentBranch && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sales Achievement', value: `${currentBranch.achievementPct}%`, icon: Target, color: currentBranch.achievementPct >= 80 ? 'text-emerald-500' : 'text-amber-500' },
            { label: 'Visit Count', value: currentBranch.visitsMonth, icon: MapPin, color: 'text-blue-500' },
            { label: 'Attendance Rate', value: `${currentBranch.attendanceRate}%`, icon: Calendar, color: currentBranch.attendanceRate >= 85 ? 'text-emerald-500' : 'text-amber-500' },
            { label: 'Active Agents', value: currentBranch.activeAgents, icon: Clock, color: 'text-primary' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                </div>
                <kpi.icon className={`h-4 w-4 ${kpi.color} opacity-60`} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Employee Target vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={10}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Sales T" fill="hsl(174, 99%, 36%)" opacity={0.3} />
                    <Bar dataKey="Sales A" fill="hsl(174, 99%, 36%)" />
                    <Bar dataKey="Prospects T" fill="hsl(48, 93%, 50%)" opacity={0.3} />
                    <Bar dataKey="Prospects A" fill="hsl(48, 93%, 50%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Visit Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Employee Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Employee Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs text-center">Visits (Today/Mo)</TableHead>
                      <TableHead className="text-xs text-center">Sales (T/A)</TableHead>
                      <TableHead className="text-xs text-center">Achievement</TableHead>
                      <TableHead className="text-xs text-center">Attendance</TableHead>
                      <TableHead className="text-xs text-center">Avg Duration</TableHead>
                      <TableHead className="text-xs">Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(employees || []).map(emp => (
                      <TableRow
                        key={emp.userId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedEmployee(emp.userId)}
                      >
                        <TableCell className="text-sm font-medium">{emp.fullName}</TableCell>
                        <TableCell className="text-sm text-center">{emp.visitsToday}/{emp.visitsMonth}</TableCell>
                        <TableCell className="text-sm text-center">{emp.salesTarget}/{emp.salesActual}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={emp.achievementPct >= 80 ? 'default' : emp.achievementPct >= 60 ? 'secondary' : 'destructive'} className="text-xs">
                            {emp.achievementPct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-center">{emp.attendanceDays}d</TableCell>
                        <TableCell className="text-sm text-center">{emp.avgVisitDuration}m</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {emp.lastActive ? format(new Date(emp.lastActive), 'dd MMM') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <EmployeeDetailSheet
        userId={selectedEmployee}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
}
