import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, AlertTriangle, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface Insight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'action';
  recommendation: string;
}

export function AIInsightsTab() {
  const { currentOrganization } = useAuthStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  async function generateInsights() {
    if (!currentOrganization) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-performance-insights', {
        body: { organization_id: currentOrganization.id },
      });

      if (error) {
        // Check for rate limit / payment errors
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402') || error.message?.includes('credits')) {
          toast.error('AI credits exhausted. Please add credits in Settings.');
        } else {
          toast.error('Failed to generate insights');
        }
        console.error('Insights error:', error);
        setLoading(false);
        return;
      }

      setInsights(data?.insights || []);
      setHasLoaded(true);
    } catch (e) {
      console.error('Insights error:', e);
      toast.error('Failed to generate insights');
    }

    setLoading(false);
  }

  const typeConfig = {
    positive: { icon: TrendingUp, color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', iconColor: 'text-emerald-600', badge: 'default' as const },
    warning: { icon: AlertTriangle, color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800', iconColor: 'text-amber-600', badge: 'secondary' as const },
    action: { icon: Lightbulb, color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800', iconColor: 'text-blue-600', badge: 'outline' as const },
  };

  if (!hasLoaded && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">AI Performance Insights</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Get AI-powered analysis of your team's performance data with actionable recommendations.
          </p>
        </div>
        <Button onClick={generateInsights} className="mt-2">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Insights
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-Generated Insights
        </h3>
        <Button variant="outline" size="sm" onClick={generateInsights} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const config = typeConfig[insight.type] || typeConfig.action;
            const Icon = config.icon;
            return (
              <Card key={i} className={`border ${config.color}`}>
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
                        <Badge variant={config.badge} className="text-[10px]">{insight.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                      <p className="text-xs text-foreground/80 italic">💡 {insight.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
