import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { LeadsUpload } from '@/components/LeadsUpload';
import { 
  Search, 
  MapPin, 
  Phone, 
  User,
  RefreshCw,
  Building2,
  IndianRupee,
  Calendar,
} from 'lucide-react';
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

export default function Leads() {
  const navigate = useNavigate();
  const { currentOrganization } = useAuthStore();
  const { 
    leads, 
    syncing, 
    searchQuery, 
    setSearchQuery, 
    filterStatus, 
    setFilterStatus,
    syncFromDatabase 
  } = useLeads();

  const statusCounts = {
    all: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    approved: leads.filter(l => l.status === 'approved').length,
    rejected: leads.filter(l => l.status === 'rejected').length,
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
  } = usePagination({ items: leads, itemsPerPage: 10 });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Leads</h1>
          <div className="flex items-center gap-2">
            {currentOrganization && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Building2 className="h-3 w-3" />
                {currentOrganization.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {leads.length} leads
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <LeadsUpload />
          <Button 
            onClick={syncFromDatabase} 
            disabled={syncing || !currentOrganization}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing' : 'Sync'}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, lead ID, customer ID, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-5 text-xs"
            />
          </div>

          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value)}>
            <TabsList className="grid w-full grid-cols-4 h-5">
              <TabsTrigger value="all" className="text-[10px] h-5">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="new" className="text-[10px] h-5">
                New ({statusCounts.new})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-[10px] h-5">
                Approved ({statusCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-[10px] h-5">
                Rejected ({statusCounts.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lead List */}
      <div className="space-y-2">
        {totalItems > 0 && (
          <p className="text-xs text-muted-foreground">
            {startIndex}-{endIndex} of {totalItems}
          </p>
        )}

        {leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">No leads found</p>
              <p className="text-xs text-muted-foreground mb-3">
                {searchQuery 
                  ? 'Try a different search' 
                  : !currentOrganization 
                    ? 'Select an organization'
                    : 'Sync or add leads'}
              </p>
              {currentOrganization && (
                <div className="flex gap-2">
                  <Button onClick={syncFromDatabase} disabled={syncing} variant="outline" size="sm">
                    <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  <LeadsUpload />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paginatedItems.map((lead) => (
            <Card
              key={lead.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/leads/${lead.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
                    {lead.entityName && (
                      <p className="text-xs text-muted-foreground">{lead.entityName}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {lead.status && (
                      <Badge className={`text-[10px] h-5 ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                  {lead.leadId && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Lead:</span> {lead.leadId}
                    </span>
                  )}
                  {lead.customerId && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Cust:</span> {lead.customerId}
                    </span>
                  )}
                  {lead.loanAmount && (
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {lead.loanAmount.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                  {(lead.villageCity || lead.district) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[lead.villageCity, lead.district].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {lead.mobileNo && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.mobileNo}
                    </span>
                  )}
                  {lead.followUpDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(lead.followUpDate), 'dd MMM')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Pagination */}
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
