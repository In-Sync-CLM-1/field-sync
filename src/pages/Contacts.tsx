import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts } from '@/hooks/useContacts';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/authStore';
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  User,
  Plus,
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
    syncFromCRM 
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <div className="flex items-center gap-2 mt-1">
            {currentOrganization && (
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />
                {currentOrganization.name}
              </Badge>
            )}
            <p className="text-muted-foreground">
              {contacts.length} contacts
            </p>
          </div>
        </div>
        <Button 
          onClick={syncFromCRM} 
          disabled={syncing || !currentOrganization}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync from CRM'}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({statusCounts.inactive})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact List */}
      <div className="space-y-4">
        {totalItems > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of {totalItems} contacts
          </p>
        )}

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No contacts found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try a different search term' 
                  : !currentOrganization 
                    ? 'Please select an organization first'
                    : 'Sync from CRM or add your first contact'}
              </p>
              {currentOrganization && (
                <div className="flex gap-2">
                  <Button onClick={syncFromCRM} disabled={syncing} variant="outline">
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync from CRM'}
                  </Button>
                  <Button onClick={() => navigate('/contacts/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedItems.map((contact) => (
            <Card
              key={contact.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/contacts/${contact.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {contact.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {contact.city}
                        </span>
                      )}
                      {contact.territory && (
                        <Badge variant="outline" className="text-xs">
                          {contact.territory}
                        </Badge>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {contact.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </span>
                  )}
                </div>
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
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

      {/* Floating Add Button */}
      <Button
        size="icon"
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => navigate('/contacts/new')}
      >
        <Plus className="h-6 w-6" />
      </Button>

    </div>
  );
}
