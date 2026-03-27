import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, MapPin, CalendarCheck, UserCheck, ShoppingBag } from 'lucide-react';
import type { PlatformSummary } from '@/hooks/usePlatformDashboard';

interface Props {
  summary: PlatformSummary;
}

export function PlatformSummaryStats({ summary }: Props) {
  const cards = [
    {
      title: 'Organizations',
      value: summary.totalOrgs,
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Active Users',
      value: summary.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Visits',
      value: summary.totalVisits.toLocaleString('en-IN'),
      icon: MapPin,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Visits Today',
      value: summary.visitsToday,
      icon: CalendarCheck,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      title: 'Total Customers',
      value: summary.totalCustomers.toLocaleString('en-IN'),
      icon: ShoppingBag,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Punched In Today',
      value: summary.attendanceToday,
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <div className={`p-1.5 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
