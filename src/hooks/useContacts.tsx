import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Customer } from '@/lib/db';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';

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

  // Sync contacts from Supabase to IndexedDB
  const syncFromDatabase = async () => {
    if (!currentOrganization?.id) {
      toast.error('Please select an organization first');
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      // Clear existing customers for this org and add fresh data
      await db.customers.where('organizationId').equals(currentOrganization.id).delete();
      
      if (data && data.length > 0) {
        const customers: Customer[] = data.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          city: c.city,
          state: c.state,
          postalCode: c.postal_code,
          country: c.country,
          latitude: c.latitude ? Number(c.latitude) : undefined,
          longitude: c.longitude ? Number(c.longitude) : undefined,
          status: c.status,
          territory: c.territory,
          organizationId: c.organization_id,
          applicationId: c.application_id, // Include application ID
          syncStatus: 'synced',
          updatedAt: new Date(c.updated_at),
        }));
        
        await db.customers.bulkAdd(customers);
      }

      toast.success(`Synced ${data?.length || 0} contacts`);
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast.error('Failed to sync contacts');
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
        type: 'customer',
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
        type: 'customer',
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

  const bulkAddContacts = async (contacts: Omit<Customer, 'id' | 'syncStatus' | 'updatedAt'>[]) => {
    try {
      const newContacts: Customer[] = contacts.map(contact => ({
        ...contact,
        id: crypto.randomUUID(),
        syncStatus: 'pending' as const,
        updatedAt: new Date(),
      }));

      await db.customers.bulkAdd(newContacts);

      // Add to sync queue
      const syncItems = newContacts.map(contact => ({
        id: crypto.randomUUID(),
        type: 'customer' as const,
        entityId: contact.id,
        action: 'create' as const,
        data: contact,
        priority: 2,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      }));

      await db.syncQueue.bulkAdd(syncItems);

      return newContacts;
    } catch (error) {
      console.error('Error bulk adding contacts:', error);
      throw error;
    }
  };

  return {
    contacts,
    syncing,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    syncFromDatabase,
    addContact,
    updateContact,
    getContact,
    bulkAddContacts,
  };
};
