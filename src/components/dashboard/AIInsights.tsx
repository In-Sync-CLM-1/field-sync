import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';
import { AIInsight, useAIInsights } from '@/hooks/useAIInsights';

const typeConfig: Record<AIInsight['type'], { icon: typeof TrendingUp; color: string; bg: string; border: string; label: string }> = {
  positive: {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-500/10',
    border: 'border-l-green-500',
    label: 'Positive',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-l-amber-500',
    label: 'Attention',
  },
  action: {
    icon: Lightbulb,
    color: 'text-blue-600',
    bg: 'bg-blue-500/10',
    border: 'border-l-blue-500',
    label: 'Action',
  },
};

export default function AIInsights() {
  const { insights, loading, error, generate } = useAIInsights();

  // Auto-generate on mount
  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <Card className="relative overflow-hidden">
      {/* Subtle AI gradient accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/5 via-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1 rounded-md bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          </div>
          AI Performance Insights
          <Badge variant="outline" className="text-[9px] h-3.5 px-1 font-normal text-muted-foreground">
            powered by AI
          </Badge>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px] gap-1"
          onClick={generate}
          disabled={loading}
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh'}
        </Button>
      </CardHeader>

      <CardContent className="pb-3">
        {loading && insights.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
            <p className="text-[10px] text-center text-muted-foreground animate-pulse">
              Analyzing your team's performance data...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6 space-y-2">
            <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={generate} className="text-xs">
              Try Again
            </Button>
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No insights available yet</p>
            <Button variant="outline" size="sm" onClick={generate} className="text-xs">
              Generate Insights
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {insights.map((insight, i) => {
              const config = typeConfig[insight.type];
              const Icon = config.icon;

              return (
                <div
                  key={i}
                  className={`rounded-lg border-l-[3px] ${config.border} p-3 hover:shadow-sm transition-shadow`}
                >
                  <div className="flex gap-2.5">
                    <div className={`flex-shrink-0 p-1.5 rounded-md ${config.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-semibold text-foreground">{insight.title}</h4>
                        <Badge
                          variant="outline"
                          className={`text-[9px] h-3.5 px-1 ${config.color} border-current/20`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {insight.description}
                      </p>
                      <div className="flex items-start gap-1.5 mt-1.5 bg-muted/50 rounded-md px-2 py-1.5">
                        <CheckCircle className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-foreground/80 leading-relaxed">
                          {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
