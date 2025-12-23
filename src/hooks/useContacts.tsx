import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Customer } from '@/lib/db';
import { toast } from 'sonner';
import { crmSync } from '@/services/crmSync';
import { useAuthStore } from '@/store/authStore';

export const useContacts = () => {
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { currentOrganization } = useAuthStore();

  // Get all contacts from IndexedDB
  const allContacts = useLiveQuery(() => db.customers.toArray()) || [];

  // Filter contacts by organization, search, and status
  const contacts = allContacts.filter(contact => {
    // Filter by current organization
    const matchesOrg = !currentOrganization || contact.organizationId === currentOrganization.id;

    const matchesSearch = 
      searchQuery === '' ||
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery) ||
      contact.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      contact.status === filterStatus;

    return matchesOrg && matchesSearch && matchesStatus;
  });

  // Automatic sync on mount and organization change
  useEffect(() => {
    if (currentOrganization?.id) {
      syncFromCRM();
    }
  }, [currentOrganization?.id]);

  const syncFromCRM = async () => {
    if (!currentOrganization?.id) {
      toast.error('Please select an organization first');
      return;
    }

    setSyncing(true);
    try {
      await crmSync.syncContacts(currentOrganization.id);
    } catch (error) {
      console.error('Error syncing contacts:', error);
      // Error toast already shown in crmSync
    } finally {
      setSyncing(false);
    }
  };

  const addContact = async (contact: Omit<Customer, 'id' | 'syncStatus' | 'updatedAt'>) => {
    try {
      const newContact: Customer = {
        ...contact,
        id: crypto.randomUUID(),
        syncStatus: 'pending',
        updatedAt: new Date(),
      };

      await db.customers.add(newContact);
      
      // Add to sync queue
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: 'visit',
        entityId: newContact.id,
        action: 'create',
        data: newContact,
        priority: 2,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });

      toast.success('Contact added');
      return newContact;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
      throw error;
    }
  };

  const updateContact = async (id: string, updates: Partial<Customer>) => {
    try {
      await db.customers.update(id, {
        ...updates,
        syncStatus: 'pending',
        updatedAt: new Date(),
      });

      // Add to sync queue
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: 'visit',
        entityId: id,
        action: 'update',
        data: updates,
        priority: 2,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });

      toast.success('Contact updated');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
      throw error;
    }
  };

  const getContact = async (id: string) => {
    return await db.customers.get(id);
  };

  return {
    contacts,
    syncing,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    syncFromCRM,
    addContact,
    updateContact,
    getContact,
  };
};
