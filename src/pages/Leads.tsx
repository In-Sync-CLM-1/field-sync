import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useAuthStore } from '@/store/authStore';
import { LeadsUpload } from '@/components/LeadsUpload';
import insyncLogo from '@/assets/in-sync-logo.png';
import { LEAD_STATUSES, getStatusLabel, getStatusColor } from '@/components/LeadStatusPipeline';
import { 
  Search, 
  MapPin, 
  Phone, 
  User,
  RefreshCw,
  Building2,
  IndianRupee,
  Calendar,
  ArrowLeft,
  Plus,
  AlertCircle,
  MessageSquare,
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
import { format, isToday, isBefore, startOfDay } from 'date-fns';

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

  // Count leads per status for filter chips (use all leads before status filter)
  const { leads: allLeadsForCount } = { leads: leads }; // leads already filtered by org+search
  // We need the unfiltered-by-status leads to get counts. Re-derive from useLeads.
  // Actually, useLeads already applies filterStatus. For counts, we need all statuses.
  // We'll compute counts from the full list by temporarily considering all.

  const getFollowUpIndicator = (followUpDate?: string) => {
    if (!followUpDate) return null;
    const date = new Date(followUpDate);
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return 'overdue';
    if (isToday(date)) return 'today';
    return 'upcoming';
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

  const getStatusBadgeColor = (status?: string) => {
    const color = getStatusColor(status || '');
    return `${color} text-white`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3 page-gradient min-h-screen">
      {/* Hero Header */}
      <div className="hero-gradient" data-tour="prospects-header">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1 hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-primary">Prospects</h1>
              <span className="text-xs text-muted-foreground truncate">
                {leads.length} prospects
              </span>
            </div>
            {currentOrganization && (
              <img src={insyncLogo} alt={currentOrganization.name} className="h-12 w-12 shrink-0" />
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={() => navigate('/dashboard/leads/new')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Lead
            </Button>
            <LeadsUpload />
            <Button 
              onClick={syncFromDatabase} 
              disabled={syncing || !currentOrganization}
              className="btn-outline-info"
              size="sm"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing' : 'Sync'}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card data-tour="prospects-search">
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, proposal no., customer ID, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-5 text-xs"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              All ({leads.length})
            </button>
            {LEAD_STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => setFilterStatus(status.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status.value 
                    ? `${status.color} text-white` 
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

        </CardContent>
      </Card>

      {/* Lead List */}
      <div className="space-y-2" data-tour="prospects-list">
        {totalItems > 0 && (
          <p className="text-xs text-muted-foreground">
            {startIndex}-{endIndex} of {totalItems}
          </p>
        )}

        {leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">No prospects found</p>
              <p className="text-xs text-muted-foreground mb-3">
                {searchQuery 
                  ? 'Try a different search' 
                  : !currentOrganization 
                    ? 'Select an organization'
                    : 'Sync or add prospects'}
              </p>
              {currentOrganization && (
                <div className="flex gap-2">
                    <Button 
                    onClick={() => navigate('/dashboard/leads/new')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Lead
                  </Button>
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
              onClick={() => navigate(`/dashboard/leads/${lead.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
                    {lead.policyTypeCategory && (
                      <p className="text-xs text-muted-foreground">{lead.policyTypeCategory}</p>
                    )}
                  </div>
                  <div className="flex gap-1 items-center">
                    {lead.followUpDate && (() => {
                      const indicator = getFollowUpIndicator(lead.followUpDate);
                      if (indicator === 'overdue') return <AlertCircle className="h-3 w-3 text-red-500" />;
                      if (indicator === 'today') return <AlertCircle className="h-3 w-3 text-amber-500" />;
                      return null;
                    })()}
                    {lead.status && (
                      <Badge className={`text-[10px] h-5 ${getStatusBadgeColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                  {lead.proposalNumber && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Prop:</span> {lead.proposalNumber}
                    </span>
                  )}
                  {lead.customerId && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Cust:</span> {lead.customerId}
                    </span>
                  )}
                  {lead.premiumAmount && (
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {lead.premiumAmount.toLocaleString()}
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

                {/* Call & WhatsApp action buttons */}
                <div className="flex gap-2 mt-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={!lead.mobileNo}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (lead.mobileNo) window.location.href = `tel:${lead.mobileNo}`;
                    }}
                  >
                    <Phone className="h-3 w-3" /> Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={!lead.mobileNo}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (lead.mobileNo) {
                        const num = lead.mobileNo.replace(/\D/g, '');
                        const waNum = num.startsWith('91') ? num : `91${num}`;
                        window.open(`https://wa.me/${waNum}`, '_blank');
                      }
                    }}
                  >
                    <MessageSquare className="h-3 w-3" /> WhatsApp
                  </Button>
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
