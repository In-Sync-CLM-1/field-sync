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
    await syncPendingCustomers();
    await syncPendingVisits();
    await syncPendingCommunications();

    console.log('[SyncProcessor] Sync complete');
  } catch (error) {
    console.error('[SyncProcessor] Sync failed:', error);
  }
}

// Sync pending customers
async function syncPendingCustomers() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('customer')
    .toArray();

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for customer:', item.entityId);
      continue;
    }

    try {
      const customer = await db.customers.get(item.entityId);
      if (!customer) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      if (item.action === 'create' || item.action === 'update') {
        const { error } = await supabase
          .from('customers')
          .upsert({
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            latitude: customer.latitude,
            longitude: customer.longitude,
            status: customer.status,
            territory: customer.territory,
            tags: customer.tags,
            organization_id: customer.organizationId,
          });

        if (!error) {
          await db.customers.update(customer.id, {
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
      console.error('[SyncProcessor] Customer sync failed:', err);
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
