import { useState, useEffect, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';

interface ApplicationIdSearchProps {
  selectedContacts: Lead[];
  onSelect: (contacts: Lead[]) => void;
  maxSelections: number;
  excludeIds?: string[];
}

export function ApplicationIdSearch({ 
  selectedContacts, 
  onSelect, 
  maxSelections,
  excludeIds = []
}: ApplicationIdSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { currentOrganization } = useAuthStore();

  // Predictive search from Supabase
  const searchLeads = useCallback(async (query: string) => {
    if (!currentOrganization?.id || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Get IDs to exclude
      const excludeList = [...excludeIds, ...selectedContacts.map(s => s.id)];
      
      // Search in Supabase with ilike for predictive matching
      let queryBuilder = supabase
        .from('leads')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .or(`name.ilike.%${query}%,lead_id.ilike.%${query}%,customer_id.ilike.%${query}%`)
        .limit(10);
      
      if (excludeList.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${excludeList.join(',')})`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Map to local Lead format
      const results: Lead[] = (data || []).map(l => ({
        id: l.id,
        organizationId: l.organization_id,
        branch: l.branch || undefined,
        leadId: l.lead_id || undefined,
        customerId: l.customer_id || undefined,
        status: l.status || undefined,
        assignedUserId: l.assigned_user_id || undefined,
        entityName: l.entity_name || undefined,
        name: l.name,
        loanAmount: l.loan_amount ? Number(l.loan_amount) : undefined,
        loanPurpose: l.loan_purpose || undefined,
        villageCity: l.village_city || undefined,
        district: l.district || undefined,
        state: l.state || undefined,
        latitude: l.latitude ? Number(l.latitude) : undefined,
        longitude: l.longitude ? Number(l.longitude) : undefined,
        customerResponse: l.customer_response || undefined,
        mobileNo: l.mobile_no || undefined,
        followUpDate: l.follow_up_date || undefined,
        leadSource: l.lead_source || undefined,
        syncStatus: 'synced' as const,
        updatedAt: new Date(l.updated_at),
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching leads:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentOrganization?.id, selectedContacts, excludeIds]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchLeads(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchLeads]);

  const handleSelect = (lead: Lead) => {
    if (selectedContacts.length < maxSelections) {
      onSelect([...selectedContacts, lead]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemove = (leadId: string) => {
    onSelect(selectedContacts.filter(c => c.id !== leadId));
  };

  const canSelectMore = selectedContacts.length < maxSelections;

  return (
    <div className="space-y-3">
      {/* Selected Leads */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContacts.map(lead => (
            <Badge 
              key={lead.id} 
              variant="secondary" 
              className="flex items-center gap-1.5 px-2 py-1"
            >
              <span className="font-mono text-xs">{lead.leadId || lead.customerId}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-xs truncate max-w-[100px]">{lead.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => handleRemove(lead.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selection Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {selectedContacts.length} of {maxSelections} selected
        </span>
        {selectedContacts.length === maxSelections && (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Badge>
        )}
      </div>

      {/* Search Input */}
      {canSelectMore && (
        <Command className="border rounded-lg">
          <CommandInput
            placeholder="Search by Lead ID, Customer ID or Name..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isSearching && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <CommandEmpty>No leads found with ID</CommandEmpty>
            )}
            {!isSearching && searchResults.length > 0 && (
              <CommandGroup heading="Leads">
                {searchResults.map(lead => (
                  <CommandItem
                    key={lead.id}
                    value={lead.leadId || lead.customerId || lead.id}
                    onSelect={() => handleSelect(lead)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary">
                        {lead.leadId || lead.customerId}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-sm">{lead.name}</span>
                    </div>
                    {lead.villageCity && (
                      <span className="text-xs text-muted-foreground">{lead.villageCity}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}
    </div>
  );
}
