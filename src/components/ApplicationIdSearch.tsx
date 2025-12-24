import { useState, useEffect, useCallback } from 'react';
import { Check, X, Search } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db, Contact } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface ApplicationIdSearchProps {
  selectedContacts: Contact[];
  onSelect: (contacts: Contact[]) => void;
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
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { currentOrganization } = useAuthStore();

  // Search contacts by application ID or name
  const searchContacts = useCallback(async (query: string) => {
    if (!currentOrganization?.id || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await db.customers
        .where('organizationId')
        .equals(currentOrganization.id)
        .filter(contact => {
          // Exclude already selected or excluded contacts
          if (selectedContacts.some(s => s.id === contact.id) || excludeIds.includes(contact.id)) {
            return false;
          }
          
          // Must have application ID
          if (!contact.applicationId) return false;
          
          const lowerQuery = query.toLowerCase();
          return (
            contact.applicationId.toLowerCase().includes(lowerQuery) ||
            contact.name.toLowerCase().includes(lowerQuery)
          );
        })
        .limit(10)
        .toArray();
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching contacts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentOrganization?.id, selectedContacts, excludeIds]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchContacts(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchContacts]);

  const handleSelect = (contact: Contact) => {
    if (selectedContacts.length < maxSelections) {
      onSelect([...selectedContacts, contact]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemove = (contactId: string) => {
    onSelect(selectedContacts.filter(c => c.id !== contactId));
  };

  const canSelectMore = selectedContacts.length < maxSelections;

  return (
    <div className="space-y-3">
      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContacts.map(contact => (
            <Badge 
              key={contact.id} 
              variant="secondary" 
              className="flex items-center gap-1.5 px-2 py-1"
            >
              <span className="font-mono text-xs">{contact.applicationId}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-xs truncate max-w-[100px]">{contact.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                onClick={() => handleRemove(contact.id)}
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
            placeholder="Search by Application ID or Name..."
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
              <CommandEmpty>No contacts found with application ID</CommandEmpty>
            )}
            {!isSearching && searchResults.length > 0 && (
              <CommandGroup heading="Contacts">
                {searchResults.map(contact => (
                  <CommandItem
                    key={contact.id}
                    value={contact.applicationId || contact.id}
                    onSelect={() => handleSelect(contact)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-primary">
                        {contact.applicationId}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-sm">{contact.name}</span>
                    </div>
                    {contact.city && (
                      <span className="text-xs text-muted-foreground">{contact.city}</span>
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
