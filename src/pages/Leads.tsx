import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/hooks/useLeads';
import { usePagination } from '@/hooks/usePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { LeadsUpload } from '@/components/LeadsUpload';
import insyncLogo from '@/assets/in-sync-logo.png';
import { toast } from 'sonner';
import { useImageParser } from '@/hooks/useImageParser';
import { useNearbyDiscovery } from '@/hooks/useNearbyDiscovery';
import { useCreatePlanOffline } from '@/hooks/useDailyPlansOffline';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';

const CUSTOMER_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-500' },
  { value: 'converted', label: 'Converted', color: 'bg-blue-500' },
  { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

function getStatusLabel(status: string): string {
  const found = CUSTOMER_STATUSES.find(s => s.value === status);
  return found ? found.label : status;
}

function getStatusColor(status: string): string {
  const found = CUSTOMER_STATUSES.find(s => s.value === status);
  return found ? found.color : 'bg-gray-500';
}
import {
  Search,
  MapPin,
  Phone,
  User,
  RefreshCw,
  ArrowLeft,
  Plus,
  Camera,
  Compass,
  ClipboardList,
  Calendar as CalendarIcon,
  CheckCircle2,
  Send,
  X,
  Users,
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

interface OrgMember {
  id: string;
  full_name: string;
}

export default function Leads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const {
    leads,
    syncing,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    syncFromDatabase,
    addLead,
  } = useLeads();

  // Scan Card state
  const { parseImage, isLoading: isParsing } = useImageParser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedData, setScannedData] = useState<any>(null);
  const [showScanDialog, setShowScanDialog] = useState(false);

  // Explore Nearby state
  const { businesses, discoverNearby, isLoading: isDiscovering } = useNearbyDiscovery();
  const [showNearby, setShowNearby] = useState(false);

  // ── Planning Mode State ──
  const [planningMode, setPlanningMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const createPlan = useCreatePlanOffline();

  // Admin: agent selection
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<OrgMember | null>(null);

  useEffect(() => {
    async function checkRole() {
      if (!user) return;
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.some(r => ['admin', 'platform_admin'].includes(r)));
    }
    checkRole();
  }, [user]);

  useEffect(() => {
    async function fetchMembers() {
      if (!isAdmin || !currentOrganization) return;
      const { data: orgMemberIds } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', currentOrganization.id);
      if (!orgMemberIds || orgMemberIds.length === 0) {
        // Fallback: query profiles directly
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('organization_id', currentOrganization.id)
          .eq('is_active', true)
          .order('full_name');
        setOrgMembers(
          (profiles || [])
            .filter(p => p.id !== user?.id)
            .map(p => ({ id: p.id, full_name: p.full_name || 'Unknown' }))
        );
        return;
      }
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', orgMemberIds.map(m => m.user_id))
        .eq('is_active', true)
        .order('full_name');
      setOrgMembers(
        (profiles || [])
          .filter(p => p.id !== user?.id)
          .map(p => ({ id: p.id, full_name: p.full_name || 'Unknown' }))
      );
    }
    fetchMembers();
  }, [isAdmin, currentOrganization, user]);

  const togglePlanningMode = () => {
    if (planningMode) {
      // Exit planning
      setPlanningMode(false);
      setSelectedDate(undefined);
      setSelectedLeadIds(new Set());
      setSelectedAgent(null);
    } else {
      setPlanningMode(true);
    }
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmitPlan = async () => {
    if (!selectedDate || selectedLeadIds.size === 0) return;
    const planDate = format(selectedDate, 'yyyy-MM-dd');
    try {
      await createPlan.mutateAsync({
        plan_date: planDate,
        prospects_target: selectedLeadIds.size,
        quotes_target: 0,
        policies_target: 0,
        planned_lead_ids: Array.from(selectedLeadIds),
        ...(selectedAgent && {
          target_user_id: selectedAgent.id,
          agent_full_name: selectedAgent.full_name,
        }),
      });
      setPlanningMode(false);
      setSelectedDate(undefined);
      setSelectedLeadIds(new Set());
      setSelectedAgent(null);
    } catch {
      // handled by mutation
    }
  };

  const handleScanCard = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseImage(file, 'business_card');
    if (result) {
      setScannedData(result);
      setShowScanDialog(true);
    } else {
      toast.error('Could not read the card. Try again with better lighting.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveScanned = async () => {
    if (!scannedData) return;
    await addLead({
      name: scannedData.name || '',
      mobileNo: scannedData.phone || '',
      villageCity: scannedData.city || '',
      state: scannedData.state || '',
      notes: [scannedData.company, scannedData.designation, scannedData.email, scannedData.website].filter(Boolean).join(' | '),
      status: 'active',
      organizationId: currentOrganization?.id,
    });
    setShowScanDialog(false);
    setScannedData(null);
    toast.success('Customer saved!');
  };

  const handleExploreNearby = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await discoverNearby(pos.coords.latitude, pos.coords.longitude, 500);
      setShowNearby(true);
    }, () => {
      toast.error('Location access required');
    });
  };

  const handleAddNearbyAsCustomer = async (biz: any) => {
    await addLead({
      name: biz.name,
      villageCity: biz.address || '',
      latitude: biz.lat,
      longitude: biz.lon,
      notes: `Type: ${biz.type}${biz.phone ? ` | Phone: ${biz.phone}` : ''}`,
      status: 'active',
      organizationId: currentOrganization?.id,
    });
    toast.success(`${biz.name} added as customer!`);
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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3 page-gradient min-h-screen pb-24">
      {/* Hero Header */}
      <div className="hero-gradient" data-tour="prospects-header">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1 hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-primary">Customers</h1>
              <span className="text-xs text-muted-foreground truncate">
                {leads.length} customers
              </span>
            </div>
            {currentOrganization && (
              <img src={insyncLogo} alt={currentOrganization.name} className="h-12 w-12 shrink-0" />
            )}
          </div>
          {/* Plan Visits toggle */}
          <Button
            className={`w-full h-11 text-sm font-semibold shadow-md gap-2 ${
              planningMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            onClick={togglePlanningMode}
          >
            {planningMode ? (
              <><X className="h-4 w-4" /> Cancel Planning</>
            ) : (
              <><ClipboardList className="h-4 w-4" /> Plan Visits</>
            )}
          </Button>
          {!planningMode && (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => navigate('/dashboard/leads/new')} variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={handleScanCard} disabled={isParsing}>
                <Camera className="h-3 w-3" />
                {isParsing ? 'Scanning...' : 'Scan Card'}
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={handleExploreNearby} disabled={isDiscovering}>
                <Compass className="h-3 w-3" />
                {isDiscovering ? 'Searching...' : 'Explore Nearby'}
              </Button>
              <LeadsUpload />
              <Button onClick={syncFromDatabase} disabled={syncing || !currentOrganization} className="btn-outline-info" size="sm">
                <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing' : 'Sync'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Planning Controls — inline when planning mode is on */}
      {planningMode && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 space-y-3">
            {/* Admin: Agent selector */}
            {isAdmin && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Plan for</Label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedAgent === null
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    Myself
                  </button>
                  {orgMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedAgent(member)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedAgent?.id === member.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {member.full_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date picker */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                <CalendarIcon className="h-3 w-3 inline mr-1" />
                {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Select date'}
              </Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={{ before: new Date() }}
                className="pointer-events-auto mx-auto rounded-md border"
              />
            </div>

            {selectedDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                <span>Now tap customers below to select them for {format(selectedDate, 'MMM d')}</span>
                {selectedLeadIds.size > 0 && (
                  <Badge className="ml-auto bg-primary text-primary-foreground">{selectedLeadIds.size} selected</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <Card data-tour="prospects-search">
        <CardContent className="p-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, city..."
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
            {CUSTOMER_STATUSES.map((status) => (
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

      {/* Customer List */}
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
              <p className="text-sm font-medium mb-1">No customers found</p>
              <p className="text-xs text-muted-foreground mb-3">
                {searchQuery
                  ? 'Try a different search'
                  : !currentOrganization
                    ? 'Select an organization'
                    : 'Sync or add customers'}
              </p>
              {currentOrganization && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/dashboard/leads/new')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Customer
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
            {paginatedItems.map((lead) => {
              const isSelected = planningMode && selectedLeadIds.has(lead.id);
              return (
                <Card
                  key={lead.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    if (planningMode && selectedDate) {
                      toggleLeadSelection(lead.id);
                    } else if (!planningMode) {
                      navigate(`/dashboard/leads/${lead.id}`);
                    }
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox in planning mode */}
                      {planningMode && selectedDate && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                          className="mt-0.5 pointer-events-none"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <CardTitle className="text-sm font-medium">{lead.name}</CardTitle>
                          <div className="flex gap-1 items-center">
                            {lead.status && (
                              <Badge className={`text-[10px] h-5 ${getStatusBadgeColor(lead.status)}`}>
                                {getStatusLabel(lead.status)}
                              </Badge>
                            )}
                          </div>
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
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

      {/* Sticky Save Plan footer */}
      {planningMode && selectedDate && selectedLeadIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg p-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {selectedLeadIds.size} {selectedLeadIds.size === 1 ? 'customer' : 'customers'} selected
              </p>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, 'EEE, MMM d')}
                {selectedAgent ? ` · for ${selectedAgent.full_name}` : ''}
              </p>
            </div>
            <Button
              className="h-10 gap-2 px-6"
              disabled={createPlan.isPending}
              onClick={handleSubmitPlan}
            >
              <Send className="h-4 w-4" />
              {createPlan.isPending ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file input for card scanning */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />

      {/* Scanned Business Card Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanned Business Card</DialogTitle>
          </DialogHeader>
          {scannedData && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={scannedData.name || ''} onChange={e => setScannedData({...scannedData, name: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={scannedData.phone || ''} onChange={e => setScannedData({...scannedData, phone: e.target.value})} /></div>
              <div><Label>Company</Label><Input value={scannedData.company || ''} onChange={e => setScannedData({...scannedData, company: e.target.value})} /></div>
              <div><Label>Email</Label><Input value={scannedData.email || ''} onChange={e => setScannedData({...scannedData, email: e.target.value})} /></div>
              <div><Label>City</Label><Input value={scannedData.city || ''} onChange={e => setScannedData({...scannedData, city: e.target.value})} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveScanned}>Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nearby Businesses Sheet */}
      <Sheet open={showNearby} onOpenChange={setShowNearby}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nearby Businesses</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {isDiscovering ? (
              <p className="text-muted-foreground text-center py-8">Searching nearby...</p>
            ) : businesses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No businesses found within 500m</p>
            ) : (
              businesses.map(biz => (
                <div key={biz.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{biz.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{biz.type}{biz.address ? ` \u00b7 ${biz.address}` : ''}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleAddNearbyAsCustomer(biz)}>Add</Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
