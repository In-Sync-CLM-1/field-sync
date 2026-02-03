import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Building2, 
  Users, 
  Search, 
  RefreshCw, 
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  IndianRupee
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Organization {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | null;
  trial_ends_at: string | null;
  user_count: number | null;
  created_at: string;
  billing_email: string | null;
  razorpay_subscription_id: string | null;
}

const statusConfig = {
  trial: { label: 'Trial', variant: 'secondary' as const, icon: Clock },
  active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
  past_due: { label: 'Past Due', variant: 'destructive' as const, icon: AlertCircle },
  cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: XCircle },
  expired: { label: 'Expired', variant: 'destructive' as const, icon: XCircle },
};

export default function OrganizationsDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: organizations, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['platform-admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Organization[];
    },
  });

  const filteredOrganizations = organizations?.filter((org) => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.billing_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const metrics = {
    total: organizations?.length || 0,
    active: organizations?.filter(o => o.subscription_status === 'active').length || 0,
    trial: organizations?.filter(o => o.subscription_status === 'trial').length || 0,
    expired: organizations?.filter(o => o.subscription_status === 'expired' || o.subscription_status === 'cancelled').length || 0,
    totalUsers: organizations?.reduce((sum, o) => sum + (o.user_count || 0), 0) || 0,
    mrr: (organizations?.filter(o => o.subscription_status === 'active').reduce((sum, o) => sum + (o.user_count || 0), 0) || 0) * 99,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Platform Admin</h1>
              <p className="text-muted-foreground">Manage organizations and subscriptions</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Total Orgs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                Trial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.trial}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-500" />
                Expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.expired}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Total Users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3 text-green-500" />
                MRR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{metrics.mrr.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Organizations Table */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead className="hidden md:table-cell">Trial Ends</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="hidden lg:table-cell">Billing Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrganizations?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No organizations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrganizations?.map((org) => {
                        const status = org.subscription_status || 'trial';
                        const config = statusConfig[status];
                        const StatusIcon = config.icon;
                        
                        return (
                          <TableRow 
                            key={org.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/platform-admin/organizations/${org.id}`)}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-primary hover:underline">{org.name}</span>
                                {org.code && (
                                  <span className="text-xs text-muted-foreground">{org.code}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                                <StatusIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                {org.user_count || 0}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {org.trial_ends_at ? (
                                <span className={`text-sm ${
                                  new Date(org.trial_ends_at) < new Date() 
                                    ? 'text-red-500' 
                                    : 'text-muted-foreground'
                                }`}>
                                  {formatDistanceToNow(new Date(org.trial_ends_at), { addSuffix: true })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                              {format(new Date(org.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                              {org.billing_email || '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
