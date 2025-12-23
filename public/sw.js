// Service Worker for Background Sync
const CACHE_NAME = 'field-visit-v1';
const SYNC_TAG = 'crm-sync';

// Precache assets - Workbox will inject the manifest here
const precacheManifest = self.__WB_MANIFEST || [];
console.log('[SW] Precache manifest loaded:', precacheManifest.length, 'assets');

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Background Sync event - process pending sync queue
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingData());
  }
});

// Periodic Background Sync (experimental)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingData());
  }
});

// Message handler for manual sync triggers
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'CANCEL_SYNC') {
    console.log('[SW] Sync cancellation requested');
    // Sync cancellation will be handled by the abort signal in the main app
    return;
  }
  
  if (event.data.type === 'SYNC_NOW') {
    syncPendingData()
      .then(() => {
        event.ports[0].postMessage({ success: true });
      })
      .catch((error) => {
        // Don't report abort errors as failures
        if (error.name === 'AbortError' || error.message.includes('cancelled')) {
          event.ports[0].postMessage({ success: true, cancelled: true });
        } else {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      });
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync pending data to CRM
async function syncPendingData() {
  console.log('[SW] Starting sync process...');
  
  try {
    // Open IndexedDB to get pending items
    const db = await openDatabase();
    const pendingItems = await getPendingItems(db);
    
    if (pendingItems.length === 0) {
      console.log('[SW] No pending items to sync');
      return;
    }
    
    console.log(`[SW] Found ${pendingItems.length} pending items`);
    
    // Get Supabase credentials from clients
    const clients = await self.clients.matchAll();
    if (clients.length === 0) {
      console.warn('[SW] No active clients, will retry later');
      throw new Error('No active clients');
    }
    
    // Request sync from the main app context
    const messageChannel = new MessageChannel();
    
    const syncPromise = new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve(event.data);
        } else {
          reject(new Error(event.data.error || 'Sync failed'));
        }
      };
      
      setTimeout(() => reject(new Error('Sync timeout')), 30000);
    });
    
    clients[0].postMessage(
      { type: 'PROCESS_SYNC_QUEUE', items: pendingItems },
      [messageChannel.port2]
    );
    
    await syncPromise;
    console.log('[SW] Sync completed successfully');
    
    // Notify all clients about successful sync
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', count: pendingItems.length });
    });
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    
    // Notify clients about failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_FAILED', error: error.message });
    });
    
    throw error;
  }
}

// Open IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    // Open without specifying version - will use existing version
    const request = indexedDB.open('FieldVisitDB');
    
    request.onsuccess = () => {
      const db = request.result;
      console.log('[SW] Opened DB at version:', db.version);
      resolve(db);
    };
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      console.log('[SW] DB upgrade needed from', event.oldVersion, 'to', event.newVersion);
      // Let Dexie handle schema creation in the main app
    };
  });
}

// Get pending sync items from IndexedDB
function getPendingItems(db) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items = request.result || [];
        // Filter items that haven't exceeded max retries
        const pendingItems = items.filter(item => 
          item.retryCount < (item.maxRetries || 3)
        );
        resolve(pendingItems);
      };
      
      request.onerror = () => reject(request.error);
    } catch (error) {
      reject(error);
    }
  });
}

// Fetch event - handle offline scenarios
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Network-first strategy for API calls
  if (event.request.url.includes('/functions/v1/')) {
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.log('[SW] Network request failed, app is offline:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Offline - changes will sync when connection returns',
              offline: true 
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
  }
});

console.log('[SW] Service worker loaded');
