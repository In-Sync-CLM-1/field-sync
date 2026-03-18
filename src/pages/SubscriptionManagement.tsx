import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CreditCard, Download, FileText, Check, Crown, ArrowLeft, Receipt, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number | null;
  total_amount: number;
  status: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  due_date: string | null;
  paid_at: string | null;
  invoice_url: string | null;
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_per_user: number;
  billing_cycle: string;
  features: any;
}

export default function SubscriptionManagement() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [_upgradeDialogOpen, _setUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      fetchSubscriptionData();
    }
  }, [currentOrganization]);

  const fetchSubscriptionData = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Fetch current plan if organization has one
      if (currentOrganization.current_plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', currentOrganization.current_plan_id)
          .single();

        if (planError && planError.code !== 'PGRST116') throw planError;
        setCurrentPlan(planData);
      } else {
        // Fetch default plan
        const { data: defaultPlan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .single();
        
        setCurrentPlan(defaultPlan);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (invoice.invoice_url) {
      window.open(invoice.invoice_url, '_blank');
    } else {
      toast.info('Invoice PDF will be available shortly');
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Past Due</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const getRemainingTrialDays = () => {
    if (!currentOrganization?.trial_ends_at) return null;
    const trialEnd = new Date(currentOrganization.trial_ends_at);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const planFeatures = [
    'Unlimited leads & prospects',
    'Daily planning & tracking',
    'Team management',
    'Real-time analytics',
    'Territory mapping',
    'Performance dashboards',
    'Branch-level reporting',
    'Priority support',
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Subscription & Billing</h1>
          <p className="text-muted-foreground">Manage your plan, view invoices, and billing history</p>
        </div>
      </div>

      {/* Current Plan & Organization Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              {getSubscriptionStatusBadge(currentOrganization?.subscription_status)}
            </div>
            <CardDescription>
              {currentOrganization?.subscription_status === 'trial' && getRemainingTrialDays() !== null && (
                <span className="text-yellow-600">
                  {getRemainingTrialDays()} days remaining in trial
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold">{currentPlan?.name || 'Pro Plan'}</h3>
              <p className="text-3xl font-bold text-primary">
                ₹{currentPlan?.price_per_user || 99}
                <span className="text-sm font-normal text-muted-foreground">/user/month</span>
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Plan includes:</p>
              <ul className="grid grid-cols-1 gap-1.5">
                {planFeatures.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {currentOrganization?.subscription_status === 'trial' && (
              <Button className="w-full" onClick={() => toast.info('Contact support to upgrade')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Organization Billing Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              Billing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Organization</span>
                <span className="font-medium">{currentOrganization?.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Users
                </span>
                <span className="font-medium">{currentOrganization?.user_count || 1}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Billing Cycle
                </span>
                <span className="font-medium capitalize">{currentPlan?.billing_cycle || 'Monthly'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Monthly Total</span>
                <span className="font-semibold text-lg">
                  ₹{((currentPlan?.price_per_user || 99) * (currentOrganization?.user_count || 1)).toLocaleString()}
                </span>
              </div>
              {currentOrganization?.billing_email && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Billing Email</span>
                  <span className="font-medium text-sm">{currentOrganization.billing_email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Billing History
          </CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No invoices yet</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Your billing history will appear here once you subscribe to a plan
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Billing Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.billing_period_start && invoice.billing_period_end ? (
                          <span className="text-sm">
                            {format(new Date(invoice.billing_period_start), 'MMM d')} -{' '}
                            {format(new Date(invoice.billing_period_end), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          ₹{invoice.total_amount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Need help with billing?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our support team for any billing-related questions
              </p>
            </div>
            <Button variant="outline" onClick={() => window.open('mailto:support@in-sync.co.in', '_blank')}>
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
