import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Loader2, Building2, Users, UserPlus, MapPin, Check, ChevronRight, 
  ChevronLeft, Sparkles, Lightbulb, Target, Rocket,
  ArrowRight, CheckCircle2, Star, Zap, Trophy, Send, Plus,
  BarChart, Calendar, Flame, Crown, Shield, Swords, PartyPopper,
  X, Phone, Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import insyncLogo from '@/assets/insync-logo-color.png';
import confetti from 'canvas-confetti';

interface OnboardingData {
  companyName: string;
  industry: string;
  address: string;
}

interface TeamMember {
  name: string;
  email: string;
}

interface Prospect {
  name: string;
  phone: string;
  city: string;
}

const INDUSTRIES = [
  'Insurance', 'Banking', 'Financial Services', 'Real Estate',
  'Healthcare', 'Technology', 'Retail', 'Manufacturing', 'Other',
];

const triggerConfetti = () => {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#01B8AA', '#4AC5BB', '#F2C80F', '#374649'] });
};

const triggerBigCelebration = () => {
  const end = Date.now() + 3000;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#01B8AA', '#4AC5BB', '#F2C80F'] });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#01B8AA', '#4AC5BB', '#F2C80F'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

const triggerMiniCelebration = () => {
  confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: ['#01B8AA', '#F2C80F'] });
};

// XP and level system
const getLevel = (xp: number) => {
  if (xp >= 300) return { level: 5, title: '🏆 Sales Champion', color: 'from-yellow-500 to-amber-600' };
  if (xp >= 200) return { level: 4, title: '⚡ Power User', color: 'from-purple-500 to-pink-500' };
  if (xp >= 100) return { level: 3, title: '🔥 Rising Star', color: 'from-orange-500 to-red-500' };
  if (xp >= 50) return { level: 2, title: '🚀 Explorer', color: 'from-blue-500 to-cyan-500' };
  return { level: 1, title: '🌱 Rookie', color: 'from-green-500 to-emerald-500' };
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, currentOrganization, setCurrentOrganization } = useAuthStore();
  const [phase, setPhase] = useState<'company' | 'portal-unlocked' | 'missions' | 'team-mission' | 'prospect-mission' | 'finale'>('company');
  const [loading, setLoading] = useState(false);
  const [xp, setXp] = useState(0);
  const [showXpGain, setShowXpGain] = useState<number | null>(null);
  const [data, setData] = useState<OnboardingData>({
    companyName: currentOrganization?.name || '',
    industry: '',
    address: '',
  });

  // Team members list
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentMember, setCurrentMember] = useState<TeamMember>({ name: '', email: '' });
  
  // Prospects list
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [currentProspect, setCurrentProspect] = useState<Prospect>({ name: '', phone: '', city: '' });

  const TEAM_GOAL = 3;
  const PROSPECT_GOAL = 3;

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from('profiles').select('onboarding_completed, organization_id').eq('id', user.id).single();
      if (profile?.onboarding_completed) navigate('/dashboard');
    };
    checkOnboarding();
  }, [user, navigate]);

  const gainXp = (amount: number) => {
    setXp(prev => prev + amount);
    setShowXpGain(amount);
    setTimeout(() => setShowXpGain(null), 1500);
  };

  const handleStep1Submit = async () => {
    if (!data.companyName.trim()) { toast.error('Company name is required'); return; }
    setLoading(true);
    try {
      if (currentOrganization) {
        const settings = { ...(currentOrganization.settings || {}), industry: data.industry, address: data.address };
        const { error } = await supabase.from('organizations').update({ name: data.companyName.trim(), settings }).eq('id', currentOrganization.id);
        if (error) throw error;
        setCurrentOrganization({ ...currentOrganization, name: data.companyName.trim(), settings });
      }
      gainXp(50);
      setPhase('portal-unlocked');
      triggerBigCelebration();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update company profile');
    } finally { setLoading(false); }
  };

  const handleAddTeamMember = () => {
    if (!currentMember.name.trim()) { toast.error('Name is required'); return; }
    if (!currentMember.email.trim()) { toast.error('Email is required'); return; }
    
    const newMembers = [...teamMembers, { ...currentMember }];
    setTeamMembers(newMembers);
    setCurrentMember({ name: '', email: '' });
    gainXp(25);
    triggerMiniCelebration();
    
    if (newMembers.length >= TEAM_GOAL) {
      toast.success('🎉 Team Challenge Complete! +50 XP Bonus!');
      setTimeout(() => gainXp(50), 500);
    } else {
      toast.success(`🔥 ${TEAM_GOAL - newMembers.length} more to go!`);
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index));
    setXp(prev => Math.max(0, prev - 25));
  };

  const handleAddProspect = async () => {
    if (!currentProspect.name.trim()) { toast.error('Name is required'); return; }
    
    // Actually save to database
    if (currentOrganization) {
      try {
        const { error } = await supabase.from('leads').insert({
          name: currentProspect.name.trim(),
          mobile_no: currentProspect.phone.trim() || null,
          village_city: currentProspect.city.trim() || null,
          organization_id: currentOrganization.id,
          assigned_user_id: user?.id,
          created_by: user?.id,
          status: 'new',
        });
        if (error) throw error;
      } catch (error: any) {
        console.error('Error adding prospect:', error);
        toast.error('Failed to add prospect');
        return;
      }
    }
    
    const newProspects = [...prospects, { ...currentProspect }];
    setProspects(newProspects);
    setCurrentProspect({ name: '', phone: '', city: '' });
    gainXp(25);
    triggerMiniCelebration();
    
    if (newProspects.length >= PROSPECT_GOAL) {
      toast.success('🏆 Prospect Challenge Complete! +50 XP Bonus!');
      setTimeout(() => gainXp(50), 500);
    } else {
      toast.success(`🎯 ${PROSPECT_GOAL - newProspects.length} more to go!`);
    }
  };

  const handleRemoveProspect = (index: number) => {
    setProspects(prev => prev.filter((_, i) => i !== index));
    setXp(prev => Math.max(0, prev - 25));
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      // Actually create team members via edge function
      for (const member of teamMembers) {
        try {
          const tempPassword = `Welcome@${Math.random().toString(36).slice(-6)}`;
          const { data, error } = await supabase.functions.invoke('create-user', {
            body: {
              email: member.email,
              password: tempPassword,
              fullName: member.name,
              role: 'sales_officer',
              organizationId: currentOrganization?.id,
            },
          });
          if (error) {
            console.error(`Failed to create user ${member.email}:`, error);
            toast.error(`Could not add ${member.name}: ${error.message}`);
          } else {
            toast.success(`✅ ${member.name} added to your team!`);
          }
        } catch (err: any) {
          console.error(`Error creating ${member.email}:`, err);
          toast.error(`Could not add ${member.name}`);
        }
      }

      if (user) {
        const { error } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
        if (error) throw error;
      }
      
      localStorage.removeItem('insync_app_tour_completed');
      localStorage.removeItem('insync_app_tour_progress');
      
      gainXp(100);
      triggerBigCelebration();
      setPhase('finale');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup');
    } finally { setLoading(false); }
  };

  const handleSkipToEnd = async () => {
    setLoading(true);
    try {
      if (user) {
        const { error } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
        if (error) throw error;
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      navigate('/dashboard');
    } finally { setLoading(false); }
  };

  const handleStartTour = () => {
    localStorage.setItem('insync_start_tour_after_onboarding', 'true');
    navigate('/dashboard');
  };

  const levelInfo = getLevel(xp);

  // ─── XP Bar Component ──────────────────────────────
  const XpBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-2">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${levelInfo.color} text-white whitespace-nowrap`}>
          {levelInfo.title}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold">{xp} XP</span>
            {showXpGain && (
              <span className="text-primary font-bold animate-in slide-in-from-bottom-2 fade-in duration-300">
                +{showXpGain} XP!
              </span>
            )}
          </div>
          <Progress value={Math.min((xp / 350) * 100, 100)} className="h-2" />
        </div>
      </div>
    </div>
  );

  // ─── FINALE SCREEN ──────────────────────────────
  if (phase === 'finale') {
    const features = [
      { icon: BarChart, label: 'Dashboard', desc: 'Track daily performance at a glance' },
      { icon: Calendar, label: 'Daily Planning', desc: 'Set targets for prospects, quotes, and sales' },
      { icon: Users, label: 'Prospects', desc: 'Manage leads through the full sales cycle' },
      { icon: Building2, label: 'Team Management', desc: 'Build teams and monitor performance' },
      { icon: MapPin, label: 'Territory Map', desc: 'Visualize your coverage area' },
    ];

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <XpBar />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        </div>

        <Card className="w-full max-w-lg relative z-10 shadow-2xl border-primary/20 overflow-hidden mt-14">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-500/30 mb-2 animate-in zoom-in duration-500">
              <Crown className="h-12 w-12 text-yellow-500 animate-bounce" />
            </div>
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${levelInfo.color} text-white text-sm font-bold animate-in slide-in-from-bottom duration-300`}>
                <Trophy className="h-4 w-4" />
                {levelInfo.title} — {xp} XP Earned!
              </div>
              <h1 className="text-3xl font-bold text-foreground animate-in slide-in-from-bottom duration-500">
                🎉 You're a Legend!
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                You've set up <strong className="text-primary">{teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}</strong> and <strong className="text-primary">{prospects.length} prospect{prospects.length !== 1 ? 's' : ''}</strong>. Here's your arsenal:
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
              <Button onClick={handleStartTour} size="lg" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Guided Tour
              </Button>
              <button onClick={() => navigate('/dashboard')} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Skip to Dashboard →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── PORTAL UNLOCKED ──────────────────────────────
  if (phase === 'portal-unlocked') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <XpBar />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        </div>
        <Card className="w-full max-w-lg relative z-10 shadow-2xl border-primary/20 overflow-hidden mt-14">
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
                +50 XP — Registration Complete!
              </div>
              <h1 className="text-3xl font-bold text-foreground animate-in slide-in-from-bottom duration-500 delay-100">
                🎉 Portal Access Unlocked!
              </h1>
              <p className="text-lg text-muted-foreground max-w-sm mx-auto animate-in slide-in-from-bottom duration-500 delay-200">
                Now it's time for the <strong className="text-primary">fun part</strong> — complete challenges to power up your workspace!
              </p>
            </div>
            <div className="pt-4 space-y-3 animate-in slide-in-from-bottom duration-500 delay-300">
              <Button onClick={() => setPhase('missions')} size="lg" className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg">
                <Swords className="mr-2 h-5 w-5" />
                Start Challenges!
                <Flame className="ml-2 h-5 w-5" />
              </Button>
              <button onClick={handleSkipToEnd} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                I'll explore on my own →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── MISSION BOARD ──────────────────────────────
  if (phase === 'missions') {
    const teamComplete = teamMembers.length >= TEAM_GOAL;
    const prospectComplete = prospects.length >= PROSPECT_GOAL;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <XpBar />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-lg relative z-10 space-y-4 mt-14">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Swords className="h-6 w-6 text-primary" />
              Mission Board
            </h1>
            <p className="text-sm text-muted-foreground">Complete challenges to earn XP and level up!</p>
          </div>

          {/* Mission 1: Build Team */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
              teamComplete ? 'border-green-500/50 bg-green-500/5' : 'border-primary/30 hover:border-primary/60'
            }`}
            onClick={() => !teamComplete ? setPhase('team-mission') : null}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${teamComplete ? 'bg-green-500/20' : 'bg-gradient-to-br from-primary/20 to-accent/20'} shrink-0`}>
                  {teamComplete ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <Users className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">🛡️ Build Your Dream Team</h3>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      +75 XP
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add {TEAM_GOAL} team members to unlock the full power of collaboration!
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${teamComplete ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-accent'}`}
                        style={{ width: `${Math.min((teamMembers.length / TEAM_GOAL) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground">{teamMembers.length}/{TEAM_GOAL}</span>
                  </div>
                  {!teamComplete && (
                    <div className="flex items-center gap-1 text-xs text-primary font-medium pt-1">
                      <ArrowRight className="h-3 w-3" />
                      Tap to start this challenge
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission 2: Add Prospects */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
              prospectComplete ? 'border-green-500/50 bg-green-500/5' : 'border-accent/30 hover:border-accent/60'
            }`}
            onClick={() => !prospectComplete ? setPhase('prospect-mission') : null}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${prospectComplete ? 'bg-green-500/20' : 'bg-gradient-to-br from-accent/20 to-primary/20'} shrink-0`}>
                  {prospectComplete ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <Target className="h-8 w-8 text-accent" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">🎯 First Prospects</h3>
                    <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
                      +75 XP
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add {PROSPECT_GOAL} prospects — every sale starts with a name!
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${prospectComplete ? 'bg-green-500' : 'bg-gradient-to-r from-accent to-primary'}`}
                        style={{ width: `${Math.min((prospects.length / PROSPECT_GOAL) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground">{prospects.length}/{PROSPECT_GOAL}</span>
                  </div>
                  {!prospectComplete && (
                    <div className="flex items-center gap-1 text-xs text-accent font-medium pt-1">
                      <ArrowRight className="h-3 w-3" />
                      Tap to start this challenge
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Complete button */}
          <div className="pt-2 space-y-3">
            <Button 
              onClick={handleFinishOnboarding} 
              disabled={loading}
              size="lg" 
              className={`w-full h-14 text-lg font-semibold shadow-lg transition-all ${
                teamComplete && prospectComplete
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white'
                  : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary'
              }`}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : teamComplete && prospectComplete ? (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Claim Your Rewards & Launch!
                  <PartyPopper className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  <Rocket className="mr-2 h-5 w-5" />
                  {teamMembers.length + prospects.length > 0 ? 'Continue to Dashboard' : 'Skip Challenges'}
                </>
              )}
            </Button>
            <div className="text-center">
              <button onClick={handleSkipToEnd} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                I'll explore on my own →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TEAM MISSION ──────────────────────────────
  if (phase === 'team-mission') {
    const teamComplete = teamMembers.length >= TEAM_GOAL;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <XpBar />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-lg relative z-10 shadow-xl border-primary/30 mt-14">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
          <CardContent className="pt-8 pb-6 space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                <Shield className="h-3.5 w-3.5" />
                CHALLENGE 1 OF 2
              </div>
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                🛡️ Build Your Dream Team
              </h2>
              <p className="text-sm text-muted-foreground">
                Great leaders build great teams — add <strong>{TEAM_GOAL} members</strong> to earn bonus XP!
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex gap-1.5">
                {Array.from({ length: TEAM_GOAL }).map((_, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    i < teamMembers.length
                      ? 'bg-primary border-primary text-white scale-110'
                      : 'bg-muted/50 border-dashed border-muted-foreground/30 text-muted-foreground/30'
                  }`}>
                    {i < teamMembers.length ? <Check className="h-5 w-5" /> : <UserPlus className="h-4 w-4" />}
                  </div>
                ))}
              </div>
              <div className="flex-1 text-right">
                <span className="text-2xl font-black text-primary">{teamMembers.length}</span>
                <span className="text-sm text-muted-foreground">/{TEAM_GOAL}</span>
              </div>
            </div>

            {/* Added members */}
            {teamMembers.length > 0 && (
              <div className="space-y-2">
                {teamMembers.map((member, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10 animate-in slide-in-from-left duration-300">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <button onClick={() => handleRemoveTeamMember(i)} className="p-1 rounded hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            {!teamComplete && (
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Zap className="h-4 w-4" />
                  <span>Add member #{teamMembers.length + 1}</span>
                </div>
                <div className="space-y-2">
                  <Input
                    value={currentMember.name}
                    onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })}
                    placeholder="Full Name"
                    className="h-11"
                  />
                  <Input
                    type="email"
                    value={currentMember.email}
                    onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
                    placeholder="Email Address"
                    className="h-11"
                  />
                </div>
                <Button onClick={handleAddTeamMember} className="w-full h-11 gap-2">
                  <Plus className="h-4 w-4" />
                  Add to Team (+25 XP)
                </Button>
              </div>
            )}

            {teamComplete && (
              <div className="text-center py-4 space-y-2 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-lg font-bold text-green-600">Challenge Complete! 🎉</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPhase('missions')} className="px-4">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setPhase('missions')} className="flex-1 h-12">
                {teamComplete ? (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Back to Missions
                  </>
                ) : teamMembers.length > 0 ? (
                  <>
                    Save & Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Skip Challenge
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── PROSPECT MISSION ──────────────────────────────
  if (phase === 'prospect-mission') {
    const prospectComplete = prospects.length >= PROSPECT_GOAL;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
        <XpBar />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-lg relative z-10 shadow-xl border-accent/30 mt-14">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />
          <CardContent className="pt-8 pb-6 space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold">
                <Target className="h-3.5 w-3.5" />
                CHALLENGE 2 OF 2
              </div>
              <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                🎯 Add Your First Prospects
              </h2>
              <p className="text-sm text-muted-foreground">
                Every sale starts with a name — add <strong>{PROSPECT_GOAL} prospects</strong> to conquer!
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex gap-1.5">
                {Array.from({ length: PROSPECT_GOAL }).map((_, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    i < prospects.length
                      ? 'bg-accent border-accent text-white scale-110'
                      : 'bg-muted/50 border-dashed border-muted-foreground/30 text-muted-foreground/30'
                  }`}>
                    {i < prospects.length ? <Check className="h-5 w-5" /> : <Star className="h-4 w-4" />}
                  </div>
                ))}
              </div>
              <div className="flex-1 text-right">
                <span className="text-2xl font-black text-accent">{prospects.length}</span>
                <span className="text-sm text-muted-foreground">/{PROSPECT_GOAL}</span>
              </div>
            </div>

            {/* Added prospects */}
            {prospects.length > 0 && (
              <div className="space-y-2">
                {prospects.map((prospect, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/5 border border-accent/10 animate-in slide-in-from-left duration-300">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
                      {prospect.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{prospect.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[prospect.phone, prospect.city].filter(Boolean).join(' • ') || 'No details'}
                      </p>
                    </div>
                    <button onClick={() => handleRemoveProspect(i)} className="p-1 rounded hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            {!prospectComplete && (
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                  <Flame className="h-4 w-4" />
                  <span>Prospect #{prospects.length + 1}</span>
                </div>
                <div className="space-y-2">
                  <Input
                    value={currentProspect.name}
                    onChange={(e) => setCurrentProspect({ ...currentProspect, name: e.target.value })}
                    placeholder="Prospect Name"
                    className="h-11"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={currentProspect.phone}
                      onChange={(e) => setCurrentProspect({ ...currentProspect, phone: e.target.value })}
                      placeholder="Mobile Number"
                      className="h-11"
                    />
                    <Input
                      value={currentProspect.city}
                      onChange={(e) => setCurrentProspect({ ...currentProspect, city: e.target.value })}
                      placeholder="City/Village"
                      className="h-11"
                    />
                  </div>
                </div>
                <Button onClick={handleAddProspect} className="w-full h-11 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="h-4 w-4" />
                  Add Prospect (+25 XP)
                </Button>
              </div>
            )}

            {prospectComplete && (
              <div className="text-center py-4 space-y-2 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-lg font-bold text-green-600">Challenge Complete! 🎉</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPhase('missions')} className="px-4">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setPhase('missions')} className="flex-1 h-12">
                {prospectComplete ? (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Back to Missions
                  </>
                ) : prospects.length > 0 ? (
                  <>
                    Save & Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Skip Challenge
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── COMPANY SETUP (STEP 1) ──────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <XpBar />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg relative z-10 shadow-xl border-border/50 mt-14">
        <div className="text-center pt-6 pb-2 px-6">
          <div className="flex justify-center mb-4">
            <img src={insyncLogo} alt="InSync" className="h-12 w-auto" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
            <Rocket className="h-3.5 w-3.5" />
            GETTING STARTED — EARN 50 XP
          </div>
          <h2 className="text-2xl font-bold">Set up your company</h2>
          <p className="text-sm text-muted-foreground mt-1">Tell us about your organization to unlock your portal</p>
        </div>

        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Company Profile</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} placeholder="Acme Corp" disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <select id="industry" value={data.industry} onChange={(e) => setData({ ...data, industry: e.target.value })} disabled={loading} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => (<option key={ind} value={ind}>{ind}</option>))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Input id="address" value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} placeholder="123 Business Street, City" disabled={loading} />
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
              <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium text-accent">Pro tip:</span>
                <span className="text-muted-foreground ml-1">You can update these details anytime from Settings.</span>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleStep1Submit} disabled={loading} className="w-full h-12">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Unlock Your Portal! (+50 XP)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
