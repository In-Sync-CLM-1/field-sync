import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Lead } from '@/lib/db';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useLeads = () => {
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { currentOrganization } = useAuthStore();

  // Get all leads from IndexedDB
  const allLeads = useLiveQuery(() => db.leads.toArray()) || [];

  // Filter leads by organization, search, and status
  const leads = allLeads.filter(lead => {
    // Filter by current organization
    const matchesOrg = !currentOrganization || lead.organizationId === currentOrganization.id;

    const matchesSearch = 
      searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.entityName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.mobileNo?.includes(searchQuery) ||
      lead.villageCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.leadId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.customerId?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' || 
      lead.status === filterStatus;

    return matchesOrg && matchesSearch && matchesStatus;
  });

  // Sync leads from Supabase to IndexedDB
  const syncFromDatabase = async () => {
    if (!currentOrganization?.id) {
      toast.error('Please select an organization first');
      return;
    }

    setSyncing(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', currentOrganization.id);

      if (error) throw error;

      // Clear existing leads for this org and add fresh data
      await db.leads.where('organizationId').equals(currentOrganization.id).delete();
      
      if (data && data.length > 0) {
        const leads: Lead[] = data.map(l => ({
          id: l.id,
          organizationId: l.organization_id,
          branch: l.branch,
          leadId: l.lead_id,
          customerId: l.customer_id,
          status: l.status,
          assignedUserId: l.assigned_user_id,
          entityName: l.entity_name,
          name: l.name,
          loanAmount: l.loan_amount ? Number(l.loan_amount) : undefined,
          loanPurpose: l.loan_purpose,
          villageCity: l.village_city,
          district: l.district,
          state: l.state,
          latitude: l.latitude ? Number(l.latitude) : undefined,
          longitude: l.longitude ? Number(l.longitude) : undefined,
          customerResponse: l.customer_response,
          mobileNo: l.mobile_no,
          followUpDate: l.follow_up_date,
          leadSource: l.lead_source,
          createdBy: l.created_by,
          createdAt: l.created_at ? new Date(l.created_at) : undefined,
          approvedBy: l.approved_by,
          approvedAt: l.approved_at ? new Date(l.approved_at) : undefined,
          syncStatus: 'synced',
          updatedAt: new Date(l.updated_at),
        }));
        
        await db.leads.bulkAdd(leads);
      }

      toast.success(`Synced ${data?.length || 0} leads`);
    } catch (error) {
      console.error('Error syncing leads:', error);
      toast.error('Failed to sync leads');
    } finally {
      setSyncing(false);
    }
  };

  const addLead = async (lead: Omit<Lead, 'id' | 'syncStatus' | 'updatedAt'>) => {
    try {
      const newLead: Lead = {
        ...lead,
        id: crypto.randomUUID(),
        syncStatus: 'pending',
        updatedAt: new Date(),
      };

      await db.leads.add(newLead);
      
      // Add to sync queue
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: 'lead',
        entityId: newLead.id,
        action: 'create',
        data: newLead,
        priority: 2,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });

      toast.success('Lead added');
      return newLead;
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Failed to add lead');
      throw error;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      await db.leads.update(id, {
        ...updates,
        syncStatus: 'pending',
        updatedAt: new Date(),
      });

      // Add to sync queue
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: 'lead',
        entityId: id,
        action: 'update',
        data: updates,
        priority: 2,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date(),
      });

      toast.success('Lead updated');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
      throw error;
    }
  };

  const getLead = async (id: string) => {
    return await db.leads.get(id);
  };

  const bulkAddLeads = async (leads: Omit<Lead, 'id' | 'syncStatus' | 'updatedAt'>[], createdBy?: string) => {
    try {
      // Get current user ID for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      const userId = createdBy || user?.id;

      const newLeads: Lead[] = leads.map(lead => ({
        ...lead,
        id: crypto.randomUUID(),
        syncStatus: 'pending' as const,
        updatedAt: new Date(),
        createdBy: userId,
      }));

      // First, try to upload directly to Supabase
      if (navigator.onLine) {
        const supabaseLeads = newLeads.map(lead => ({
          id: lead.id,
          name: lead.name,
          branch: lead.branch || null,
          lead_id: lead.leadId || null,
          customer_id: lead.customerId || null,
          status: lead.status || 'new',
          entity_name: lead.entityName || null,
          loan_amount: lead.loanAmount || null,
          loan_purpose: lead.loanPurpose || null,
          village_city: lead.villageCity || null,
          district: lead.district || null,
          state: lead.state || null,
          latitude: lead.latitude || null,
          longitude: lead.longitude || null,
          customer_response: lead.customerResponse || null,
          mobile_no: lead.mobileNo || null,
          follow_up_date: lead.followUpDate || null,
          lead_source: lead.leadSource || null,
          organization_id: lead.organizationId,
          created_by: userId || null,
          assigned_user_id: lead.assignedUserId || userId || null,
        }));

        const { error: supabaseError } = await supabase
          .from('leads')
          .insert(supabaseLeads);

        if (supabaseError) {
          console.error('Supabase insert error:', supabaseError);
          toast.error(`Database error: ${supabaseError.message}`);
          throw supabaseError;
        }

        // Mark as synced in IndexedDB
        const syncedLeads = newLeads.map(lead => ({
          ...lead,
          syncStatus: 'synced' as const,
        }));
        await db.leads.bulkAdd(syncedLeads);
        
        return syncedLeads;
      } else {
        // Offline: save to IndexedDB and sync queue
        await db.leads.bulkAdd(newLeads);

        const syncItems = newLeads.map(lead => ({
          id: crypto.randomUUID(),
          type: 'lead' as const,
          entityId: lead.id,
          action: 'create' as const,
          data: lead,
          priority: 2,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
        }));

        await db.syncQueue.bulkAdd(syncItems);
        toast.info('Leads saved offline. Will sync when online.');
        
        return newLeads;
      }
    } catch (error) {
      console.error('Error bulk adding leads:', error);
      throw error;
    }
  };

  return {
    leads,
    syncing,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    syncFromDatabase,
    addLead,
    updateLead,
    getLead,
    bulkAddLeads,
  };
};

// Hook to get a single lead from Supabase
export const useLead = (id?: string) => {
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return { lead, isLoading, error };
};
