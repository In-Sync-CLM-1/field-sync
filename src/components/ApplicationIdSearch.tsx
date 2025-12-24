import { useState, useEffect, useCallback } from 'react';
import { Check, X, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db, Lead } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

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

  // Search leads by lead ID, customer ID, or name
  const searchLeads = useCallback(async (query: string) => {
    if (!currentOrganization?.id || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await db.leads
        .where('organizationId')
        .equals(currentOrganization.id)
        .filter(lead => {
          // Exclude already selected or excluded leads
          if (selectedContacts.some(s => s.id === lead.id) || excludeIds.includes(lead.id)) {
            return false;
          }
          
          // Must have lead ID or customer ID
          if (!lead.leadId && !lead.customerId) return false;
          
          const lowerQuery = query.toLowerCase();
          return (
            lead.leadId?.toLowerCase().includes(lowerQuery) ||
            lead.customerId?.toLowerCase().includes(lowerQuery) ||
            lead.name.toLowerCase().includes(lowerQuery)
          );
        })
        .limit(10)
        .toArray();
      
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
