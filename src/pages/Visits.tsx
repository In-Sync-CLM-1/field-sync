import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisits } from '@/hooks/useVisits';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock, ArrowLeft, Navigation } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'SCHEDULED', className: 'bg-blue-500 text-white border-0' },
  in_progress: { label: 'IN PROGRESS', className: 'status-badge-warning' },
  completed: { label: 'COMPLETED', className: 'status-badge-success' },
  cancelled: { label: 'CANCELLED', className: 'bg-destructive text-destructive-foreground border-0' },
};

export default function Visits() {
  const navigate = useNavigate();
  const { visits, isLoading } = useVisits();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      !searchQuery ||
      visit.lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (visit: any) => {
    const config = statusConfig[visit.status] || statusConfig.in_progress;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'In progress';
    const duration = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
    return `${duration} min`;
  };

  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ items: filteredVisits, itemsPerPage: 10 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading visits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 page-gradient min-h-screen">
      {/* Hero Header */}
      <div className="hero-gradient mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1 hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight gradient-text-primary">Visits</h1>
              <p className="text-xs text-muted-foreground">Manage field visits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" onClick={() => navigate('/dashboard/visits/new')} className="btn-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs h-5 text-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-5 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {(
        <div className="space-y-2">
          {totalItems > 0 && (
            <p className="text-xs text-muted-foreground">
              {startIndex}-{endIndex} of {totalItems}
            </p>
          )}

          <div className="grid gap-2">
            {filteredVisits.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-3 text-sm">No visits found</p>
                  <Button size="sm" onClick={() => navigate('/dashboard/visits/new')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Visit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              paginatedItems.map((visit) => (
                <Card
                  key={visit.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/dashboard/visits/${visit.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-medium">
                          {visit.lead?.name || 'Unknown Lead'}
                        </CardTitle>
                        {visit.purpose && (
                          <p className="text-xs text-muted-foreground capitalize">{visit.purpose}</p>
                        )}
                      </div>
                      {getStatusBadge(visit)}
                    </div>
                    {visit.notes && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{visit.notes}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {visit.scheduled_date
                            ? format(new Date(visit.scheduled_date), 'PP')
                            : format(new Date(visit.check_in_time), 'PP')}
                        </span>
                        {visit.scheduled_time && <span>{visit.scheduled_time}</span>}
                        {!visit.scheduled_date && (
                          <span>{formatDuration(visit.check_in_time, visit.check_out_time)}</span>
                        )}
                      </div>
                      {visit.lead?.latitude && visit.lead?.longitude && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          title="Get Directions"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${visit.lead!.latitude},${visit.lead!.longitude}`, '_blank');
                          }}
                        >
                          <Navigation className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={previousPage}
                    className={!canGoPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage = 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1);
                  
                  const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                  const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                  if (showEllipsisBefore || showEllipsisAfter) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => goToPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={nextPage}
                    className={!canGoNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
