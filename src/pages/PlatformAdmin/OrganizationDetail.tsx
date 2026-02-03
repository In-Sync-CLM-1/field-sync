import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Building2, 
  Users, 
  CreditCard,
  Save,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  IndianRupee,
  Calendar,
  Mail,
  Phone,
  Shield,
  FileText,
  Download
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO, addDays } from 'date-fns';

interface Organization {
  id: string;
  name: string;
  code: string | null;
  slug: string | null;
  description: string | null;
  is_active: boolean;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | null;
  trial_ends_at: string | null;
  user_count: number | null;
  created_at: string;
  updated_at: string;
  billing_email: string | null;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  logo_url: string | null;
  primary_color: string | null;
  settings: any;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  branch_id: string | null;
  branch?: { name: string } | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  status: string | null;
  created_at: string;
  paid_at: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  invoice_url: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

const statusConfig = {
  trial: { label: 'Trial', variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' },
  active: { label: 'Active', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
  past_due: { label: 'Past Due', variant: 'destructive' as const, icon: AlertCircle, color: 'text-orange-600' },
  cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: XCircle, color: 'text-gray-600' },
  expired: { label: 'Expired', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
};

export default function OrganizationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Organization>>({});

  // Fetch organization details
  const { data: organization, isLoading: orgLoading, refetch } = useQuery({
    queryKey: ['platform-admin-organization', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setFormData(data);
      return data as Organization;
    },
    enabled: !!id,
  });

  // Fetch users in this organization
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['platform-admin-org-users', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, branch:branches(name)')
        .eq('organization_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
    enabled: !!id,
  });

  // Fetch user roles for this organization's users
  const { data: userRoles } = useQuery({
    queryKey: ['platform-admin-org-user-roles', id],
    queryFn: async () => {
      if (!users || users.length === 0) return [];
      
      const userIds = users.map(u => u.id);
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!users && users.length > 0,
  });

  // Fetch invoices for this organization
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['platform-admin-org-invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!id,
  });

  // Mutation to update organization
  const updateOrgMutation = useMutation({
    mutationFn: async (updates: Partial<Organization>) => {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Organization updated successfully');
      queryClient.invalidateQueries({ queryKey: ['platform-admin-organization', id] });
      queryClient.invalidateQueries({ queryKey: ['platform-admin-organizations'] });
      setEditMode(false);
    },
    onError: (error) => {
      toast.error('Failed to update organization: ' + error.message);
    },
  });

  // Toggle organization active status
  const toggleActiveStatus = async () => {
    const newStatus = !organization?.is_active;
    await updateOrgMutation.mutateAsync({ is_active: newStatus });
  };

  // Handle form submission
  const handleSave = () => {
    const updates: Partial<Organization> = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      billing_email: formData.billing_email,
      subscription_status: formData.subscription_status,
      trial_ends_at: formData.trial_ends_at,
      is_active: formData.is_active,
    };
    updateOrgMutation.mutate(updates);
  };

  // Quick action to extend trial
  const extendTrial = async (days: number) => {
    const currentEnd = organization?.trial_ends_at 
      ? parseISO(organization.trial_ends_at) 
      : new Date();
    const newEnd = addDays(currentEnd, days);
    await updateOrgMutation.mutateAsync({ 
      trial_ends_at: newEnd.toISOString(),
      subscription_status: 'trial'
    });
  };

  // Get user role
  const getUserRole = (userId: string) => {
    const role = userRoles?.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6">
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
            <p className="text-muted-foreground mb-4">The organization you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/platform-admin/organizations')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = organization.subscription_status || 'trial';
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/platform-admin/organizations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Organization Header Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{organization.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {organization.code && <span className="font-mono">{organization.code}</span>}
                    <Badge variant={config.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                    {!organization.is_active && (
                      <Badge variant="destructive">Deactivated</Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="active-toggle" className="text-sm text-muted-foreground">
                    {organization.is_active ? 'Active' : 'Inactive'}
                  </Label>
                  <Switch
                    id="active-toggle"
                    checked={organization.is_active}
                    onCheckedChange={toggleActiveStatus}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Users</p>
                  <p className="text-xl font-semibold">{organization.user_count || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-xl font-semibold">
                    ₹{((organization.user_count || 0) * 99).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm font-medium">
                    {format(new Date(organization.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className={`text-sm font-medium ${
                    organization.trial_ends_at && new Date(organization.trial_ends_at) < new Date()
                      ? 'text-destructive'
                      : ''
                  }`}>
                    {organization.trial_ends_at 
                      ? formatDistanceToNow(new Date(organization.trial_ends_at), { addSuffix: true })
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({users?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Organization Details */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Organization Details</CardTitle>
                    {editMode ? (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setFormData(organization);
                          setEditMode(false);
                        }}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={updateOrgMutation.isPending}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    {editMode ? (
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{organization.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    {editMode ? (
                      <Input
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-mono">{organization.code || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    {editMode ? (
                      <Input
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{organization.description || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Email</Label>
                    {editMode ? (
                      <Input
                        type="email"
                        value={formData.billing_email || ''}
                        onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {organization.billing_email || '—'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subscription Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subscription Status</Label>
                    {editMode ? (
                      <Select
                        value={formData.subscription_status || 'trial'}
                        onValueChange={(value) => setFormData({ 
                          ...formData, 
                          subscription_status: value as Organization['subscription_status']
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="past_due">Past Due</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Trial End Date</Label>
                    {editMode ? (
                      <Input
                        type="datetime-local"
                        value={formData.trial_ends_at 
                          ? format(new Date(formData.trial_ends_at), "yyyy-MM-dd'T'HH:mm")
                          : ''
                        }
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          trial_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null
                        })}
                      />
                    ) : (
                      <p className="text-sm">
                        {organization.trial_ends_at 
                          ? format(new Date(organization.trial_ends_at), 'PPpp')
                          : '—'}
                      </p>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="pt-4 border-t space-y-2">
                    <Label className="text-muted-foreground">Quick Actions</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => extendTrial(7)}
                        disabled={updateOrgMutation.isPending}
                      >
                        +7 Days Trial
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => extendTrial(14)}
                        disabled={updateOrgMutation.isPending}
                      >
                        +14 Days Trial
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => extendTrial(30)}
                        disabled={updateOrgMutation.isPending}
                      >
                        +30 Days Trial
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateOrgMutation.mutate({ subscription_status: 'active' })}
                        disabled={updateOrgMutation.isPending || status === 'active'}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate Subscription
                      </Button>
                    </div>
                  </div>

                  {/* Razorpay Info */}
                  {(organization.razorpay_customer_id || organization.razorpay_subscription_id) && (
                    <div className="pt-4 border-t space-y-2">
                      <Label className="text-muted-foreground">Payment Gateway</Label>
                      {organization.razorpay_customer_id && (
                        <p className="text-xs text-muted-foreground">
                          Customer ID: <span className="font-mono">{organization.razorpay_customer_id}</span>
                        </p>
                      )}
                      {organization.razorpay_subscription_id && (
                        <p className="text-xs text-muted-foreground">
                          Subscription ID: <span className="font-mono">{organization.razorpay_subscription_id}</span>
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organization Users</CardTitle>
                <CardDescription>
                  All users belonging to this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden md:table-cell">Branch</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden lg:table-cell">Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          users?.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.full_name || 'Unnamed User'}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  <Shield className="h-3 w-3" />
                                  {getUserRole(user.id)}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {user.branch?.name || '—'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                {format(new Date(user.created_at), 'MMM d, yyyy')}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
                <CardDescription>
                  Invoices and payment records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : invoices?.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No invoices found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Period</TableHead>
                          <TableHead className="hidden lg:table-cell">Created</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices?.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-mono text-sm">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell className="font-medium">
                              ₹{invoice.total_amount.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                                {invoice.status || 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {invoice.billing_period_start && invoice.billing_period_end
                                ? `${format(new Date(invoice.billing_period_start), 'MMM d')} - ${format(new Date(invoice.billing_period_end), 'MMM d, yyyy')}`
                                : '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                              {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              {invoice.invoice_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
