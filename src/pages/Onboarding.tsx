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
  ArrowRight, CheckCircle2, Star, Zap, Trophy, Send, Plus,
  BarChart, Calendar
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
    colors: ['#01B8AA', '#4AC5BB', '#F2C80F', '#374649']
  });
};

// Big celebration for portal access
const triggerBigCelebration = () => {
  const duration = 3000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#01B8AA', '#4AC5BB', '#F2C80F']
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#01B8AA', '#4AC5BB', '#F2C80F']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, currentOrganization, setCurrentOrganization } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPortalAccess, setShowPortalAccess] = useState(false);
  const [showSystemIntro, setShowSystemIntro] = useState(false);
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

      // Show portal access celebration
      setShowPortalAccess(true);
      triggerBigCelebration();
      
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update company profile');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromPortalAccess = () => {
    setShowPortalAccess(false);
    setStep(2);
  };

  const handleStep2Submit = async () => {
    if (data.inviteEmail.trim()) {
      setLoading(true);
      try {
        toast.success(`🎉 Invitation sent to ${data.inviteEmail}!`);
        triggerConfetti();
        setTimeout(() => setStep(3), 500);
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

      // Reset tour state so guided tour can trigger
      localStorage.removeItem('insync_app_tour_completed');
      localStorage.removeItem('insync_app_tour_progress');

      triggerConfetti();
      setShowSystemIntro(true);
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

  const handleStartTour = () => {
    localStorage.setItem('insync_start_tour_after_onboarding', 'true');
    navigate('/dashboard');
  };

  const handleSkipIntro = () => {
    navigate('/dashboard');
  };

  // System Introduction Screen
  if (showSystemIntro) {
    const features = [
      { icon: BarChart, label: 'Dashboard', desc: 'Track daily performance at a glance' },
      { icon: Calendar, label: 'Daily Planning', desc: 'Set targets for prospects, quotes, and sales' },
      { icon: Users, label: 'Prospects', desc: 'Manage leads through the full sales cycle' },
      { icon: Building2, label: 'Team Management', desc: 'Build teams and monitor performance' },
      { icon: MapPin, label: 'Territory Map', desc: 'Visualize your coverage area' },
    ];

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <Card className="w-full max-w-lg relative z-10 shadow-2xl border-primary/20 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary" />
          
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-2 animate-in zoom-in duration-500">
              <Rocket className="h-10 w-10 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground animate-in slide-in-from-bottom duration-500">
                🎉 You're All Set!
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Here's what you can do with <strong className="text-primary">InSync</strong>
              </p>
            </div>

            <div className="space-y-2 text-left animate-in slide-in-from-bottom duration-500 delay-200">
              {features.map((f) => (
                <div key={f.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="p-2 rounded-full bg-primary/10 shrink-0">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 space-y-3 animate-in slide-in-from-bottom duration-500 delay-300">
              <Button 
                onClick={handleStartTour} 
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Guided Tour
              </Button>
              
              <button
                onClick={handleSkipIntro}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip to Dashboard →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Portal Access Celebration Screen
  if (showPortalAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <Card className="w-full max-w-lg relative z-10 shadow-2xl border-primary/20 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary" />
          
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary animate-bounce" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold animate-in slide-in-from-bottom duration-300">
                <Zap className="h-4 w-4" />
                Registration Complete!
              </div>
              
              <h1 className="text-3xl font-bold text-foreground animate-in slide-in-from-bottom duration-500 delay-100">
                🎉 Portal Access Unlocked!
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-sm mx-auto animate-in slide-in-from-bottom duration-500 delay-200">
                Welcome to <strong className="text-primary">InSync</strong>! Your workspace is ready.
                Let's set up your team to maximize your success!
              </p>
            </div>

            <div className="pt-4 space-y-3 animate-in slide-in-from-bottom duration-500 delay-300">
              <Button 
                onClick={handleContinueFromPortalAccess} 
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg"
              >
                <Users className="mr-2 h-5 w-5" />
                Let's Build Your Team!
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              
              <button
                onClick={handleSkipToEnd}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                I'll explore on my own →
              </button>
            </div>
          </CardContent>
        </Card>
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
            {step === 2 && '🚀 Invite Your Dream Team!'}
            {step === 3 && '🎯 Add Your First Prospect!'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'Tell us about your organization to get started'}
            {step === 2 && 'Great leaders build great teams — start yours now!'}
            {step === 3 && 'Every sale starts with a prospect — let\'s begin!'}
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
                      Unlock Your Portal!
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Invite Team - Energetic Style */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Success badge */}
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-sm font-semibold border border-primary/20">
                  <CheckCircle2 className="h-4 w-4" />
                  Portal Access Granted!
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
                <div className="p-2 rounded-full bg-accent/20">
                  <UserPlus className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <span className="text-sm font-semibold">Team Invitation</span>
                  <p className="text-xs text-muted-foreground">Collaboration = Success!</p>
                </div>
              </div>

              {/* Energetic guidance card */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Zap className="h-4 w-4" />
                  <span>Why build your team now?</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Sales Officers</strong> can log visits & track prospects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Managers</strong> get real-time performance insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span><strong>Everyone</strong> stays in sync — no more guesswork!</span>
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

              {/* Where to add more */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
                <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-accent">📍 Find it later:</span>
                  <span className="text-muted-foreground ml-1">
                    Go to <strong>Team & Branches</strong> in the sidebar to add more members!
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-4"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleStep2Submit} disabled={loading} className="flex-1 h-12">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : data.inviteEmail.trim() ? (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Invite & Continue
                    </>
                  ) : (
                    <>
                      Skip to Prospects
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First Prospect - Energetic Style */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Motivation banner */}
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/10 to-primary/10 text-accent text-sm font-semibold border border-accent/20">
                  <Star className="h-4 w-4" />
                  Almost There!
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="p-2 rounded-full bg-primary/20">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-semibold">Your First Prospect</span>
                  <p className="text-xs text-muted-foreground">The first step to closing deals!</p>
                </div>
              </div>

              {/* Energetic guidance */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Rocket className="h-4 w-4" />
                  <span>Ready to start selling?</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add a prospect you're already working with. You'll be able to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>✓ Log visits and interactions</li>
                  <li>✓ Track follow-ups with reminders</li>
                  <li>✓ Monitor the complete sales cycle</li>
                </ul>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="prospectPhone">Mobile Number</Label>
                  <Input
                    id="prospectPhone"
                    value={data.prospectPhone}
                    onChange={(e) => setData({ ...data, prospectPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prospectCity">City/Village</Label>
                  <Input
                    id="prospectCity"
                    value={data.prospectCity}
                    onChange={(e) => setData({ ...data, prospectCity: e.target.value })}
                    placeholder="Mumbai"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Where to add more */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <Plus className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-primary">📍 Add more prospects:</span>
                  <span className="text-muted-foreground ml-1">
                    Use the <strong>Prospects</strong> menu or the <strong>+ New</strong> button!
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-4"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <Button 
                  onClick={handleStep3Submit} 
                  disabled={loading} 
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : data.prospectName.trim() ? (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Save & Launch Dashboard!
                    </>
                  ) : (
                    <>
                      <PartyPopper className="mr-2 h-5 w-5" />
                      Finish & Explore!
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>

        {/* Skip link */}
        {step > 1 && (
          <div className="px-6 pb-6 text-center">
            <button
              onClick={handleSkipToEnd}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              I'll explore on my own →
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
