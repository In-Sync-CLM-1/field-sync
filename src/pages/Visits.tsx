import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisits } from '@/hooks/useVisits';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MapPin, Clock } from 'lucide-react';
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

export default function Visits() {
  const navigate = useNavigate();
  const { visits, isLoading } = useVisits();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter visits
  const filteredVisits = visits.filter((visit) => {
    const matchesSearch =
      !searchQuery ||
      visit.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const status = visit.check_out_time ? 'completed' : 'in_progress';
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (visit: any) => {
    const isCompleted = !!visit.check_out_time;
    return (
      <Badge variant={isCompleted ? 'default' : 'secondary'}>
        {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
      </Badge>
    );
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Visits</h1>
          <p className="text-muted-foreground">Manage field visits and track locations</p>
        </div>
        <Button onClick={() => navigate('/visits/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Visit
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by customer or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of {totalItems} visits
          </p>
        )}

        <div className="grid gap-4">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No visits found</p>
                <Button onClick={() => navigate('/visits/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Visit
                </Button>
              </CardContent>
            </Card>
          ) : (
            paginatedItems.map((visit) => (
              <Card
                key={visit.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/visits/${visit.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {visit.customer?.name || 'Unknown Customer'}
                      </CardTitle>
                      {visit.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{visit.notes}</p>
                      )}
                    </div>
                    {getStatusBadge(visit)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(visit.check_in_time), 'PPp')}</span>
                    <span className="mx-2">•</span>
                    <span>{formatDuration(visit.check_in_time, visit.check_out_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="font-mono text-xs">
                      {visit.check_in_latitude.toFixed(6)}, {visit.check_in_longitude.toFixed(6)}
                    </span>
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
    </div>
  );
}
