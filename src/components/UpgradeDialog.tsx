import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, CreditCard, Users, Zap, Shield, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEATURES = [
  { icon: Users, text: 'Unlimited team members' },
  { icon: Zap, text: 'Advanced automation' },
  { icon: Shield, text: 'Priority support' },
  { icon: BarChart3, text: 'Advanced analytics' },
];

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const { currentOrganization } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!currentOrganization) {
      toast.error('No organization found');
      return;
    }

    setLoading(true);
    try {
      // TODO: Integrate with Razorpay checkout
      // For now, show a message about the upgrade process
      toast.info('Upgrade flow coming soon! Contact support to upgrade your plan.');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error('Failed to start upgrade process');
    } finally {
      setLoading(false);
    }
  };

  const userCount = currentOrganization?.user_count || 1;
  const pricePerUser = 99;
  const monthlyTotal = userCount * pricePerUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Continue using InSync with all premium features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pro Plan</CardTitle>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Popular
                </Badge>
              </div>
              <CardDescription>Everything you need to grow your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">₹{pricePerUser}</span>
                <span className="text-muted-foreground">/ user / month</span>
              </div>

              <ul className="space-y-2">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.text} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span>{feature.text}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{userCount} active user{userCount !== 1 ? 's' : ''}</span>
                  <span className="font-semibold">₹{monthlyTotal}/month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleUpgrade} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Processing...' : 'Upgrade Now'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Razorpay. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
