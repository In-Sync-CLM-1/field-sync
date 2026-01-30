import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';
import { 
  AlertTriangle, 
  CreditCard, 
  Check, 
  Users, 
  Zap, 
  Shield, 
  BarChart3, 
  LogOut,
  Loader2,
  HelpCircle
} from 'lucide-react';
import insyncLogo from '@/assets/insync-logo-color.png';

const FEATURES = [
  { icon: Users, text: 'Unlimited team members' },
  { icon: Zap, text: 'Advanced automation' },
  { icon: Shield, text: 'Priority support' },
  { icon: BarChart3, text: 'Advanced analytics' },
];

export default function SubscriptionExpired() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentOrganization, user } = useAuthStore();
  const { initiateCheckout, loading } = useRazorpayCheckout();
  const [signingOut, setSigningOut] = useState(false);

  const userCount = currentOrganization?.user_count || 1;
  const pricePerUser = 99;
  const monthlyTotal = userCount * pricePerUser;

  const handleUpgrade = async () => {
    await initiateCheckout({
      onSuccess: () => {
        // Redirect to dashboard after successful payment
        window.location.href = '/dashboard';
      },
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-destructive/5 to-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={insyncLogo} alt="InSync" className="h-12 w-auto" />
        </div>

        {/* Expired Alert */}
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-destructive mb-1">
                  Your trial has expired
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your 14-day free trial for <span className="font-medium text-foreground">{currentOrganization?.name}</span> has ended. 
                  Upgrade now to continue using InSync and keep all your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Card */}
        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Upgrade to Pro</CardTitle>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Recommended
              </Badge>
            </div>
            <CardDescription>
              Get full access to all InSync features
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Pricing */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold">₹{pricePerUser}</span>
                <span className="text-muted-foreground">/ user / month</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Billed monthly. Cancel anytime.
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.text} className="flex items-center gap-3">
                    <div className="shrink-0 p-1.5 rounded-full bg-primary/10">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </li>
                );
              })}
            </ul>

            {/* Cost breakdown */}
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {userCount} active user{userCount !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold">₹{monthlyTotal}/month</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleUpgrade} 
                disabled={loading} 
                className="w-full h-11"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Processing...' : 'Upgrade Now'}
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex-1"
                >
                  {signingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Sign Out
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.open('mailto:support@in-sync.co.in', '_blank')}
                  className="flex-1"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Razorpay
            </p>
          </CardContent>
        </Card>

        {/* User info */}
        <p className="text-xs text-center text-muted-foreground mt-4">
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}
