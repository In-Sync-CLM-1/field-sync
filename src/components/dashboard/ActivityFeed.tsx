import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export interface ActivityItem {
  id: string;
  name: string;
  action: string;
  timestamp: string;
  status?: 'completed' | 'active' | 'alert';
  meta?: string;
}

interface ActivityFeedProps {
  title?: string;
  items: ActivityItem[];
  onViewAll?: () => void;
  maxHeight?: string;
}

const statusIcon = {
  completed: <CheckCircle className="h-3 w-3 text-success" />,
  active: <Clock className="h-3 w-3 text-warning" />,
  alert: <AlertTriangle className="h-3 w-3 text-destructive" />,
};

export function ActivityFeed({ title = 'Recent Activity', items, onViewAll, maxHeight = '300px' }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-primary" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="px-4 pb-3 space-y-0">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 py-2 border-b border-border last:border-0"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                      {item.status && statusIcon[item.status]}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{item.action}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {item.meta && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 mb-0.5">
                        {item.meta}
                      </Badge>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(item.timestamp), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
