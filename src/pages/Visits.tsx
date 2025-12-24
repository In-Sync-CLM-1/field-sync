import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisits } from '@/hooks/useVisits';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Clock } from 'lucide-react';
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Visits</h1>
          <p className="text-sm text-muted-foreground">Manage field visits</p>
        </div>
        <Button size="icon" onClick={() => navigate('/visits/new')}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

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
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {totalItems > 0 && (
          <p className="text-xs text-muted-foreground">
            {startIndex}-{endIndex} of {totalItems}
          </p>
        )}

        <div className="grid gap-2">
          {visits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-3 text-sm">No visits found</p>
                <Button size="sm" onClick={() => navigate('/visits/new')}>
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
                onClick={() => navigate(`/visits/${visit.id}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <CardTitle className="text-sm font-medium">
                      {visit.customer?.name || 'Unknown Customer'}
                    </CardTitle>
                    {getStatusBadge(visit)}
                  </div>
                  {visit.notes && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{visit.notes}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(visit.check_in_time), 'PP')}
                    </span>
                    <span>{formatDuration(visit.check_in_time, visit.check_out_time)}</span>
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
