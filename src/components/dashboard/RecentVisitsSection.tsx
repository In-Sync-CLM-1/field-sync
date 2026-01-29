import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Check, Clock, Eye, UserPlus } from 'lucide-react';
import { useRecentVisits, type VisitFilter } from '@/hooks/useDashboardData';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';

const filterOptions: { value: VisitFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

export function RecentVisitsSection() {
  const navigate = useNavigate();
  const {
    scheduledVisits,
    recentVisits,
    filter,
    setFilter,
    isLoading,
    hasNoVisitsToday,
    hasSchedule,
  } = useRecentVisits();

  // Determine which view to show
  const showSchedule = hasNoVisitsToday && hasSchedule && filter === 'today';
  const title = showSchedule ? "Today's Schedule" : 'Recent Visits';

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeAgo = (dateString: string) => {
    const minutes = differenceInMinutes(new Date(), new Date(dateString));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="animate-fade-in card-glass" style={{ animationDelay: '500ms' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs whitespace-nowrap transition-all',
                filter === option.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        )}

        {/* Schedule View */}
        {!isLoading && showSchedule && (
          <div className="space-y-2">
            {scheduledVisits.map((visit) => (
              <div
                key={visit.customerId}
                className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/30">
                        {visit.scheduledTime || 'TBD'}
                      </Badge>
                      <span className="text-sm font-medium truncate">{visit.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {visit.purpose && <span>{visit.purpose}</span>}
                      {visit.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {visit.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {scheduledVisits.length > 0 && (
              <Button
                className="w-full mt-3 bg-gradient-to-r from-primary to-info text-primary-foreground"
                onClick={() => navigate('/dashboard/visits/new')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Start First Visit
              </Button>
            )}
          </div>
        )}

        {/* Recent Visits View */}
        {!isLoading && !showSchedule && recentVisits.length > 0 && (
          <div className="space-y-2">
            {recentVisits.map((visit) => (
              <div
                key={visit.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  visit.isCompleted
                    ? 'bg-success/5 border-success/20'
                    : 'bg-warning/5 border-warning/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {/* Status Icon */}
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      visit.isCompleted ? 'bg-success/20' : 'bg-warning/20'
                    )}>
                      {visit.isCompleted ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-warning" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{visit.customerName}</span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {visit.isCompleted 
                            ? `Completed ${format(new Date(visit.checkOutTime!), 'h:mm a')}`
                            : `In Progress`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {visit.purpose && <span className="truncate">{visit.purpose}</span>}
                        {visit.isCompleted && visit.duration !== undefined && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {formatDuration(visit.duration)}
                            </Badge>
                          </>
                        )}
                        {!visit.isCompleted && (
                          <>
                            <span>•</span>
                            <span className="text-warning">Started {formatTimeAgo(visit.checkInTime)}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => navigate(`/dashboard/visits/${visit.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        {visit.isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => navigate(`/dashboard/leads/${visit.customerId}`)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Add Follow-up
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - Single consolidated view */}
        {!isLoading && !showSchedule && recentVisits.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <div className={cn(
              "icon-circle mx-auto mb-3 h-12 w-12",
              filter === 'today' && hasNoVisitsToday ? "icon-circle-info" : "icon-circle-primary"
            )}>
              {filter === 'today' && hasNoVisitsToday ? (
                <Calendar className="h-6 w-6" />
              ) : (
                <MapPin className="h-6 w-6" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {filter === 'today' && 'No visits scheduled for today'}
              {filter === 'this_week' && 'No visits this week'}
              {filter === 'pending' && 'No pending visits'}
              {filter === 'completed' && 'No completed visits'}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {filter === 'today' 
                ? 'Plan your day or start an unplanned visit'
                : 'Start tracking your field activity'
              }
            </p>
            {filter === 'today' ? (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  variant="outline"
                  size="sm" 
                  onClick={() => navigate('/dashboard/planning')}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Plan Today
                </Button>
                <Button 
                  className="btn-gradient-primary text-primary-foreground" 
                  size="sm" 
                  onClick={() => navigate('/dashboard/visits/new')}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Start Visit
                </Button>
              </div>
            ) : (
              <Button 
                className="btn-gradient-primary text-primary-foreground" 
                size="sm" 
                onClick={() => navigate('/dashboard/visits/new')}
              >
                Start a Visit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
