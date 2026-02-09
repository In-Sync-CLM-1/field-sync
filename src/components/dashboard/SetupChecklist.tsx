import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, Target, CheckCircle2, ChevronRight, Sparkles, 
  X, Rocket, Trophy
} from 'lucide-react';

const STORAGE_KEY = 'insync_setup_checklist_dismissed';

interface ChecklistItem {
  id: string;
  icon: typeof Users;
  title: string;
  description: string;
  target: number;
  current: number;
  route: string;
  actionLabel: string;
  complete: boolean;
}

export function SetupChecklist() {
  const navigate = useNavigate();
  const { currentOrganization, user } = useAuthStore();
  const [dismissed, setDismissed] = useState(false);
  const [teamCount, setTeamCount] = useState(0);
  const [prospectCount, setProspectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setDismissed(true);
      return;
    }
    fetchProgress();
  }, [currentOrganization?.id]);

  const fetchProgress = async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    try {
      const [profilesRes, leadsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id),
      ]);
      setTeamCount(profilesRes.count || 0);
      setProspectCount(leadsRes.count || 0);
    } catch (err) {
      console.error('Error fetching setup progress:', err);
    } finally {
      setLoading(false);
    }
  };

  if (dismissed || loading) return null;

  const TEAM_GOAL = 3;
  const PROSPECT_GOAL = 3;

  const items: ChecklistItem[] = [
    {
      id: 'team',
      icon: Users,
      title: '🛡️ Build Your Team',
      description: `Add ${TEAM_GOAL} team members to unlock collaboration`,
      target: TEAM_GOAL,
      current: Math.min(teamCount, TEAM_GOAL),
      route: '/dashboard/users',
      actionLabel: 'Add Members',
      complete: teamCount >= TEAM_GOAL,
    },
    {
      id: 'prospects',
      icon: Target,
      title: '🎯 Add Prospects',
      description: `Add ${PROSPECT_GOAL} prospects to start selling`,
      target: PROSPECT_GOAL,
      current: Math.min(prospectCount, PROSPECT_GOAL),
      route: '/dashboard/leads',
      actionLabel: 'Add Prospects',
      complete: prospectCount >= PROSPECT_GOAL,
    },
  ];

  const completedCount = items.filter(i => i.complete).length;
  const totalProgress = Math.round((completedCount / items.length) * 100);

  // All complete — show congratulations then auto-dismiss
  if (completedCount === items.length) {
    return (
      <Card className="border-2 border-green-500/30 bg-green-500/5 animate-in slide-in-from-top duration-500" data-tour="setup-checklist">
        <CardContent className="py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-700 dark:text-green-400">🎉 Setup Complete!</p>
              <p className="text-xs text-muted-foreground">You're all set to start selling. Great job!</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, 'true');
                setDismissed(true);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-accent/5 animate-in slide-in-from-top duration-500" data-tour="setup-checklist">
      <CardContent className="py-4 px-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Getting Started</h3>
              <p className="text-xs text-muted-foreground">{completedCount}/{items.length} tasks complete</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, 'true');
              setDismissed(true);
            }}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={totalProgress} className="h-2" />

        {/* Checklist items */}
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
                  item.complete
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-background border-border hover:border-primary/40 hover:shadow-sm cursor-pointer'
                }`}
                onClick={() => !item.complete && navigate(item.route)}
              >
                {/* Status icon */}
                <div className={`p-2 rounded-full shrink-0 ${
                  item.complete ? 'bg-green-500/20' : 'bg-primary/10'
                }`}>
                  {item.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Icon className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${item.complete ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground'}`}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden max-w-[120px]">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          item.complete ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${(item.current / item.target) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.current}/{item.target}
                    </span>
                  </div>
                </div>

                {/* Action */}
                {!item.complete && (
                  <Button size="sm" variant="outline" className="shrink-0 h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10">
                    {item.actionLabel}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}