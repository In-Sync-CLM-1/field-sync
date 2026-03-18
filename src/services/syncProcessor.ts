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
    await syncPendingPhotos();
    await syncPendingOrders();
    await syncPendingFieldInvoices();
    await syncPendingCollections();

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
            customer_id: lead.customerId || null,
            status: lead.status || 'new',
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

// Sync pending photos
async function syncPendingPhotos() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('photo')
    .toArray();

  if (pendingItems.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return;

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for photo:', item.entityId);
      continue;
    }

    try {
      const photo = await db.photos.get(item.entityId);
      if (!photo) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      // Upload blob to storage
      const ext = photo.blob.type === 'image/png' ? 'png' : 'jpg';
      const storagePath = `${profile.organization_id}/${photo.visitId}/${photo.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('visit-photos')
        .upload(storagePath, photo.blob, {
          contentType: photo.blob.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create DB record
      const { error: dbError } = await supabase
        .from('visit_photos')
        .upsert({
          id: photo.id,
          visit_id: photo.visitId,
          organization_id: profile.organization_id,
          user_id: user.id,
          category: photo.category || 'other',
          storage_path: storagePath,
          latitude: photo.latitude || null,
          longitude: photo.longitude || null,
          accuracy: photo.accuracy || null,
          captured_at: photo.timestamp.toISOString(),
        });

      if (dbError) {
        throw new Error(`DB insert failed: ${dbError.message}`);
      }

      // Mark as synced
      await db.photos.update(photo.id, {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      });
      await db.syncQueue.delete(item.id);
      console.log('[SyncProcessor] Photo synced successfully:', photo.id);
    } catch (err: any) {
      console.error('[SyncProcessor] Photo sync failed:', err);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        lastAttemptAt: new Date(),
        error: err.message,
      });
    }
  }
}

// Sync pending orders
async function syncPendingOrders() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('order')
    .toArray();

  if (pendingItems.length === 0) return;

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for order:', item.entityId);
      continue;
    }

    try {
      const order = await db.orders.get(item.entityId);
      if (!order) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      const { error } = await supabase
        .from('orders')
        .upsert({
          id: order.id,
          customer_id: order.customer_id || null,
          user_id: order.user_id || null,
          items_text: order.items_text || null,
          total_amount: order.total_amount || null,
          notes: order.notes || null,
          photo_url: order.photo_url || null,
          organization_id: order.organization_id || null,
          created_at: order.created_at || new Date().toISOString(),
        });

      if (!error) {
        await db.orders.update(order.id!, { synced: true });
        await db.syncQueue.delete(item.id);
        console.log('[SyncProcessor] Order synced:', order.id);
      } else {
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1,
          lastAttemptAt: new Date(),
          error: error.message,
        });
      }
    } catch (err: any) {
      console.error('[SyncProcessor] Order sync failed:', err);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        lastAttemptAt: new Date(),
        error: err.message,
      });
    }
  }
}

// Sync pending field invoices
async function syncPendingFieldInvoices() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('field_invoice')
    .toArray();

  if (pendingItems.length === 0) return;

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for field invoice:', item.entityId);
      continue;
    }

    try {
      const invoice = await db.fieldInvoices.get(item.entityId);
      if (!invoice) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      const { error } = await supabase
        .from('field_invoices')
        .upsert({
          id: invoice.id,
          customer_id: invoice.customer_id || null,
          user_id: invoice.user_id || null,
          extracted_data: invoice.extracted_data || null,
          photo_url: invoice.photo_url || null,
          amount: invoice.amount || null,
          organization_id: invoice.organization_id || null,
          created_at: invoice.created_at || new Date().toISOString(),
        });

      if (!error) {
        await db.fieldInvoices.update(invoice.id!, { synced: true });
        await db.syncQueue.delete(item.id);
        console.log('[SyncProcessor] Field invoice synced:', invoice.id);
      } else {
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1,
          lastAttemptAt: new Date(),
          error: error.message,
        });
      }
    } catch (err: any) {
      console.error('[SyncProcessor] Field invoice sync failed:', err);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        lastAttemptAt: new Date(),
        error: err.message,
      });
    }
  }
}

// Sync pending collections
async function syncPendingCollections() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('collection')
    .toArray();

  if (pendingItems.length === 0) return;

  for (const item of pendingItems) {
    if (item.retryCount >= item.maxRetries) {
      console.log('[SyncProcessor] Max retries reached for collection:', item.entityId);
      continue;
    }

    try {
      const collection = await db.collections.get(item.entityId);
      if (!collection) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      const { error } = await supabase
        .from('collections')
        .upsert({
          id: collection.id,
          customer_id: collection.customer_id || null,
          user_id: collection.user_id || null,
          amount: collection.amount || null,
          description: collection.description || null,
          receipt_photo_url: collection.receipt_photo_url || null,
          organization_id: collection.organization_id || null,
          created_at: collection.created_at || new Date().toISOString(),
        });

      if (!error) {
        await db.collections.update(collection.id!, { synced: true });
        await db.syncQueue.delete(item.id);
        console.log('[SyncProcessor] Collection synced:', collection.id);
      } else {
        await db.syncQueue.update(item.id, {
          retryCount: item.retryCount + 1,
          lastAttemptAt: new Date(),
          error: error.message,
        });
      }
    } catch (err: any) {
      console.error('[SyncProcessor] Collection sync failed:', err);
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
      order: items.filter(i => i.type === 'order').length,
      field_invoice: items.filter(i => i.type === 'field_invoice').length,
      collection: items.filter(i => i.type === 'collection').length,
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
