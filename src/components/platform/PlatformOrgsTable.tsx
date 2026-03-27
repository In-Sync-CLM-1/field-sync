import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ArrowUpDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { OrgRow } from '@/hooks/usePlatformDashboard';

interface Props {
  organizations: OrgRow[];
}

type SortKey = 'name' | 'users' | 'customers' | 'visits' | 'orders' | 'lastActivity';

export function PlatformOrgsTable({ organizations }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = organizations.filter(o => o.name.toLowerCase().includes(q));

    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'lastActivity') cmp = (a.lastActivity ?? '').localeCompare(b.lastActivity ?? '');
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortAsc ? cmp : -cmp;
    });

    return rows;
  }, [organizations, search, sortKey, sortAsc]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </span>
    </TableHead>
  );

  const statusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
      case 'trial': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Trial</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'cancelled': return <Badge variant="secondary">Cancelled</Badge>;
      default: return <Badge variant="outline">{status || '—'}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Organizations</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Name" field="name" />
                <TableHead>Status</TableHead>
                <SortHeader label="Users" field="users" />
                <SortHeader label="Customers" field="customers" />
                <SortHeader label="Visits" field="visits" />
                <TableHead>Today</TableHead>
                <SortHeader label="Orders" field="orders" />
                <SortHeader label="Last Activity" field="lastActivity" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{statusBadge(org.subscriptionStatus)}</TableCell>
                    <TableCell>{org.users}</TableCell>
                    <TableCell>{org.customers}</TableCell>
                    <TableCell>{org.visits}</TableCell>
                    <TableCell>
                      <span className={org.visitsToday > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                        {org.visitsToday}
                      </span>
                    </TableCell>
                    <TableCell>{org.orders}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {org.lastActivity
                        ? formatDistanceToNow(new Date(org.lastActivity), { addSuffix: true })
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
