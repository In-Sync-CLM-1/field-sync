import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { syncPendingDailyPlans } from '@/hooks/useDailyPlansOffline';

// Process all pending sync items
export async function processSyncQueue() {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    console.log('[SyncProcessor] Offline, skipping sync');
    return;
  }

  console.log('[SyncProcessor] Starting sync queue processing');

  try {
    // Sync daily plans
    await syncPendingDailyPlans();

    // Sync other entity types as needed
    await syncPendingLeads();
    await syncPendingVisits();
    await syncPendingCommunications();

    console.log('[SyncProcessor] Sync complete');
  } catch (error) {
    console.error('[SyncProcessor] Sync failed:', error);
  }
}

// Sync pending leads
async function syncPendingLeads() {
  const pendingItems = await db.syncQueue
    .where('type')
    .anyOf(['customer', 'lead'])
    .toArray();

  if (pendingItems.length === 0) return;

  // Get current user for created_by field
  const { data: { user } } = await supabase.auth.getUser();

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for lead:', item.entityId);
      continue;
    }

    try {
      const lead = await db.leads.get(item.entityId);
      if (!lead) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      if (item.action === 'create' || item.action === 'update') {
        const { error } = await supabase
          .from('leads')
          .upsert({
            id: lead.id,
            name: lead.name,
            branch: lead.branch || null,
            proposal_number: lead.proposalNumber || null,
            customer_id: lead.customerId || null,
            status: lead.status || 'new',
            policy_type_category: lead.policyTypeCategory || null,
            premium_amount: lead.premiumAmount || null,
            policy_type: lead.policyType || null,
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
            created_by: lead.createdBy || user?.id || null,
            assigned_user_id: lead.assignedUserId || user?.id || null,
          });

        if (!error) {
          await db.leads.update(lead.id, {
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          });
          await db.syncQueue.delete(item.id);
          console.log('[SyncProcessor] Lead synced successfully:', lead.id);
        } else {
          console.error('[SyncProcessor] Lead sync error:', error.message);
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastAttemptAt: new Date(),
            error: error.message,
          });
        }
      }
    } catch (err: any) {
      console.error('[SyncProcessor] Lead sync failed:', err);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        lastAttemptAt: new Date(),
        error: err.message,
      });
    }
  }
}

// Sync pending visits
async function syncPendingVisits() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('visit')
    .toArray();

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for visit:', item.entityId);
      continue;
    }

    try {
      const visit = await db.visits.get(item.entityId);
      if (!visit) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      // Note: Visit creation should happen online via NewVisit page (requires location verification)
      // Here we only handle updates for checkout
      if (item.action === 'update') {
        const { error } = await supabase
          .from('visits')
          .update({
            check_out_time: visit.checkOutTime?.toISOString(),
            check_out_latitude: visit.checkOutLatitude,
            check_out_longitude: visit.checkOutLongitude,
            notes: visit.notes,
          })
          .eq('id', visit.id);

        if (!error) {
          await db.visits.update(visit.id, {
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          });
          await db.syncQueue.delete(item.id);
        } else {
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastAttemptAt: new Date(),
            error: error.message,
          });
        }
      }
    } catch (err: any) {
      console.error('[SyncProcessor] Visit sync failed:', err);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        lastAttemptAt: new Date(),
        error: err.message,
      });
    }
  }
}

// Sync pending communications
async function syncPendingCommunications() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('communication')
    .toArray();

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for communication:', item.entityId);
      continue;
    }

    try {
      const comm = await db.communications.get(item.entityId);
      if (!comm) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      // Communications don't have a Supabase table yet - just mark as synced
      await db.communications.update(comm.id, {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      });
      await db.syncQueue.delete(item.id);
    } catch (err: any) {
      console.error('[SyncProcessor] Communication sync failed:', err);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        lastAttemptAt: new Date(),
        error: err.message,
      });
    }
  }
}

// Get sync queue status
export async function getSyncQueueStatus() {
  const items = await db.syncQueue.toArray();
  return {
    total: items.length,
    pending: items.filter(i => i.retryCount < i.maxRetries).length,
    failed: items.filter(i => i.retryCount >= i.maxRetries).length,
    byType: {
      daily_plan: items.filter(i => i.type === 'daily_plan').length,
      customer: items.filter(i => i.type === 'customer').length,
      visit: items.filter(i => i.type === 'visit').length,
      communication: items.filter(i => i.type === 'communication').length,
    },
  };
}

// Setup online listener to auto-sync
export function setupAutoSync() {
  window.addEventListener('online', () => {
    console.log('[SyncProcessor] Back online, starting sync...');
    processSyncQueue();
  });

  // Also sync periodically when online
  setInterval(() => {
    if (navigator.onLine) {
      processSyncQueue();
    }
  }, 60000); // Every minute
}
