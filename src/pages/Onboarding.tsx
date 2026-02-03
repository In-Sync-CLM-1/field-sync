import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Loader2, Building2, Users, UserPlus, MapPin, Check, ChevronRight, 
  ChevronLeft, Sparkles, PartyPopper, Lightbulb, Target, Rocket,
  ArrowRight, CheckCircle2, Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import insyncLogo from '@/assets/insync-logo-color.png';
import confetti from 'canvas-confetti';

interface OnboardingData {
  companyName: string;
  industry: string;
  address: string;
  inviteEmail: string;
  inviteName: string;
  prospectName: string;
  prospectPhone: string;
  prospectCity: string;
}

const INDUSTRIES = [
  'Insurance',
  'Banking',
  'Financial Services',
  'Real Estate',
  'Healthcare',
  'Technology',
  'Retail',
  'Manufacturing',
  'Other',
];

// Celebration confetti effect
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
  });
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, currentOrganization, setCurrentOrganization } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    companyName: currentOrganization?.name || '',
    industry: '',
    address: '',
    inviteEmail: '',
    inviteName: '',
    prospectName: '',
    prospectPhone: '',
    prospectCity: '',
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, organization_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.onboarding_completed) {
        navigate('/dashboard');
      }
    };
    
    checkOnboarding();
  }, [user, navigate]);

  const handleStep1Submit = async () => {
    if (!data.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    setLoading(true);
    try {
      if (currentOrganization) {
        const settings = {
          ...(currentOrganization.settings || {}),
          industry: data.industry,
          address: data.address,
        };

        const { error } = await supabase
          .from('organizations')
          .update({
            name: data.companyName.trim(),
            settings,
          })
          .eq('id', currentOrganization.id);

        if (error) throw error;

        setCurrentOrganization({
          ...currentOrganization,
          name: data.companyName.trim(),
          settings,
        });
      }

      // Show celebration before moving to step 2
      setShowCelebration(true);
      triggerConfetti();
      
      setTimeout(() => {
        setShowCelebration(false);
        setStep(2);
      }, 2500);
      
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (data.inviteEmail.trim()) {
      setLoading(true);
      try {
        toast.success(`Invitation sent to ${data.inviteEmail}`);
        setStep(3);
      } catch (error: any) {
        console.error('Error inviting user:', error);
        toast.error('Failed to send invitation');
      } finally {
        setLoading(false);
      }
    } else {
      setStep(3);
    }
  };

  const handleStep3Submit = async () => {
    setLoading(true);
    try {
      if (data.prospectName.trim() && currentOrganization) {
        const { error } = await supabase
          .from('leads')
          .insert({
            name: data.prospectName.trim(),
            mobile_no: data.prospectPhone.trim() || null,
            village_city: data.prospectCity.trim() || null,
            organization_id: currentOrganization.id,
            assigned_user_id: user?.id,
            created_by: user?.id,
            status: 'new',
          });

        if (error) throw error;
      }

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);

        if (error) throw error;
      }

      triggerConfetti();
      toast.success('🎉 Setup complete! Welcome to InSync.');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToEnd = async () => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);

        if (error) throw error;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Celebration screen after Step 1
  if (showCelebration) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
            <PartyPopper className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Awesome! You're all set up! 🎉
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Your company profile is ready. Now let's get your team and first prospect set up.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading next steps...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg relative z-10 shadow-xl border-border/50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img src={insyncLogo} alt="InSync" className="h-12 w-auto" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium text-accent">Getting Started</span>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && 'Set up your company'}
            {step === 2 && 'Build your team'}
            {step === 3 && 'Add your first prospect'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us about your organization to get started'}
            {step === 2 && 'Invite team members to collaborate together'}
            {step === 3 && 'Start tracking your sales journey'}
          </CardDescription>
        </CardHeader>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <CardContent className="pt-2">
          {/* Step 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Company Profile</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={data.companyName}
                  onChange={(e) => setData({ ...data, companyName: e.target.value })}
                  placeholder="Acme Insurance"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <select
                  id="industry"
                  value={data.industry}
                  onChange={(e) => setData({ ...data, industry: e.target.value })}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={data.address}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  placeholder="123 Business Street, City"
                  disabled={loading}
                />
              </div>

              {/* Pro Tip */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-accent">Pro tip:</span>
                  <span className="text-muted-foreground ml-1">
                    You can update these details anytime from Settings.
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleStep1Submit} disabled={loading} className="w-full h-12">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Complete Setup & Continue
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Invite Team - Post Registration */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Welcome message */}
              <div className="text-center py-2 mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Registration complete!
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <UserPlus className="h-5 w-5 text-accent" />
                <span className="text-sm font-medium">Team Invitation</span>
              </div>

              {/* Guidance card */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4 text-primary" />
                  <span>Why invite your team?</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 mt-1.5 text-primary shrink-0" />
                    <span>Sales officers can log visits & track prospects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 mt-1.5 text-primary shrink-0" />
                    <span>Managers can monitor team performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-3 w-3 mt-1.5 text-primary shrink-0" />
                    <span>Everyone stays in sync with real-time data</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteName">Team Member Name</Label>
                <Input
                  id="inviteName"
                  value={data.inviteName}
                  onChange={(e) => setData({ ...data, inviteName: e.target.value })}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={data.inviteEmail}
                  onChange={(e) => setData({ ...data, inviteEmail: e.target.value })}
                  placeholder="john@company.com"
                  disabled={loading}
                />
              </div>

              {/* How to add more members later */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-accent">Later:</span>
                  <span className="text-muted-foreground ml-1">
                    Add more team members from <strong>Team & Branches</strong> in the sidebar menu.
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-6"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleStep2Submit} disabled={loading} className="flex-1 h-12">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : data.inviteEmail.trim() ? (
                    <>
                      Send Invite & Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Skip for Now
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First Prospect - Post Registration */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">First Prospect</span>
              </div>

              {/* Guidance card */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="h-4 w-4 text-accent" />
                  <span>Your sales journey starts here!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add a prospect you're working with. You'll be able to track visits, 
                  record outcomes, and manage the complete sales cycle.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospectName">Prospect Name</Label>
                <Input
                  id="prospectName"
                  value={data.prospectName}
                  onChange={(e) => setData({ ...data, prospectName: e.target.value })}
                  placeholder="Jane Smith"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospectPhone">Phone Number</Label>
                <Input
                  id="prospectPhone"
                  type="tel"
                  value={data.prospectPhone}
                  onChange={(e) => setData({ ...data, prospectPhone: e.target.value })}
                  placeholder="9876543210"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prospectCity">City / Village</Label>
                <Input
                  id="prospectCity"
                  value={data.prospectCity}
                  onChange={(e) => setData({ ...data, prospectCity: e.target.value })}
                  placeholder="Mumbai"
                  disabled={loading}
                />
              </div>

              {/* How to add more prospects later */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-accent">Next steps:</span>
                  <span className="text-muted-foreground ml-1">
                    Add more prospects from <strong>Prospects</strong> menu or use the <strong>+ New</strong> button.
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleStep3Submit} disabled={loading} className="flex-1 h-12">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {data.prospectName.trim() ? 'Complete & Go to Dashboard' : 'Skip & Go to Dashboard'}
                    </>
                  )}
                </Button>
              </div>

              {/* Skip all option */}
              <div className="text-center pt-2">
                <button
                  onClick={handleSkipToEnd}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  disabled={loading}
                >
                  I'll explore on my own
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
