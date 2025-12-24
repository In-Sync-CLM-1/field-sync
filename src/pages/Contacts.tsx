import { useNavigate } from 'react-router-dom';
import { useContacts } from '@/hooks/useContacts';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { ContactsUpload } from '@/components/ContactsUpload';
import { 
  Search, 
  MapPin, 
  Phone, 
  User,
  RefreshCw,
  Building2,
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


export default function Contacts() {
  const navigate = useNavigate();
  const { currentOrganization } = useAuthStore();
  const { 
    contacts, 
    syncing, 
    searchQuery, 
    setSearchQuery, 
    filterStatus, 
    setFilterStatus,
    syncFromDatabase 
  } = useContacts();

  const statusCounts = {
    all: contacts.length,
    active: contacts.filter(c => c.status === 'active').length,
    inactive: contacts.filter(c => c.status === 'inactive').length,
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
  } = usePagination({ items: contacts, itemsPerPage: 10 });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contacts</h1>
          <div className="flex items-center gap-2">
            {currentOrganization && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Building2 className="h-3 w-3" />
                {currentOrganization.name}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {contacts.length} contacts
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <ContactsUpload />
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
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-5 text-xs"
            />
          </div>

          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}>
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="all" className="text-xs">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="text-xs">
                Inactive ({statusCounts.inactive})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact List */}
      <div className="space-y-2">
        {totalItems > 0 && (
          <p className="text-xs text-muted-foreground">
            {startIndex}-{endIndex} of {totalItems}
          </p>
        )}

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <User className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">No contacts found</p>
              <p className="text-xs text-muted-foreground mb-3">
                {searchQuery 
                  ? 'Try a different search' 
                  : !currentOrganization 
                    ? 'Select an organization'
                    : 'Sync or add contacts'}
              </p>
              {currentOrganization && (
                <div className="flex gap-2">
                  <Button onClick={syncFromDatabase} disabled={syncing} variant="outline" size="sm">
                    <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  <ContactsUpload />
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paginatedItems.map((contact) => (
            <Card
              key={contact.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/contacts/${contact.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <CardTitle className="text-sm font-medium">{contact.name}</CardTitle>
                  {contact.territory && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      {contact.territory}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {contact.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {contact.city}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </span>
                  )}
                </div>
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] h-4 px-1.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
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
