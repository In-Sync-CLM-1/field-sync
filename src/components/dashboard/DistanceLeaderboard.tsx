import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route, Trophy, TrendingUp } from 'lucide-react';
import { AgentDistance } from '@/hooks/useTeamMapData';

interface DistanceLeaderboardProps {
  distances: AgentDistance[];
  totalDistance: number;
}

const medals = ['🥇', '🥈', '🥉'];

export default function DistanceLeaderboard({ distances, totalDistance }: DistanceLeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Route className="h-4 w-4 text-primary" />
          Distance Covered Today
          <Badge variant="outline" className="text-[10px] ml-auto font-bold">
            {totalDistance} km total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        {distances.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tracking data yet today</p>
        ) : (
          <div className="space-y-1.5">
            {distances.slice(0, 8).map((agent, i) => {
              const maxDist = distances[0]?.distanceKm || 1;
              const pct = Math.max(5, (agent.distanceKm / maxDist) * 100);

              return (
                <div key={agent.userId} className="group">
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-6 text-center flex-shrink-0">
                      {i < 3 ? (
                        <span className="text-sm">{medals[i]}</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium">#{i + 1}</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate">{agent.name}</span>
                        <span className={`text-xs font-bold tabular-nums ${i === 0 ? 'text-primary' : 'text-foreground'}`}>
                          {agent.distanceKm} km
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            i === 0
                              ? 'bg-gradient-to-r from-primary to-primary/70'
                              : i === 1
                              ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                              : i === 2
                              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                              : 'bg-muted-foreground/30'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
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
