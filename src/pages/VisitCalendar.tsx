import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisits, Visit } from '@/hooks/useVisits';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
  cancelled: 'bg-destructive',
  rescheduled: 'bg-purple-500',
};

export default function VisitCalendar() {
  const navigate = useNavigate();
  const { visits } = useVisits();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const visitsByDate = useMemo(() => {
    const map: Record<string, Visit[]> = {};
    visits.forEach((v) => {
      const dateKey = v.scheduled_date || format(new Date(v.check_in_time), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(v);
    });
    return map;
  }, [visits]);

  const selectedDayVisits = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return visitsByDate[key] || [];
  }, [selectedDate, visitsByDate]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rescheduled: 'Rescheduled',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayVisits = visitsByDate[key] || [];
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={key}
              onClick={() => setSelectedDate(day)}
              className={`bg-background p-1.5 min-h-[60px] sm:min-h-[80px] cursor-pointer transition-colors hover:bg-accent/50 ${
                !isCurrentMonth ? 'opacity-40' : ''
              } ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayVisits.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    className={`${statusColors[v.status] || 'bg-muted'} rounded px-1 py-0.5 text-[10px] text-white truncate`}
                  >
                    {v.lead?.name || 'Visit'}
                  </div>
                ))}
                {dayVisits.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayVisits.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Panel */}
      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => navigate(`/dashboard/visits/new?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
              >
                <Plus className="h-3 w-3" />
                Schedule
              </Button>
            </div>
            {selectedDayVisits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No visits for this day</p>
            ) : (
              <div className="space-y-2">
                {selectedDayVisits.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => navigate(`/dashboard/visits/${v.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.lead?.name || 'Unknown'}</p>
                      {v.purpose && <p className="text-xs text-muted-foreground">{v.purpose}</p>}
                      {v.scheduled_time && <p className="text-xs text-muted-foreground">{v.scheduled_time}</p>}
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] shrink-0 ${statusColors[v.status]} text-white border-0`}
                    >
                      {getStatusLabel(v.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
