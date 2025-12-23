// Service Worker Registration and Management

export interface SyncStatus {
  registered: boolean;
  supported: boolean;
  lastSync?: Date;
  pendingCount?: number;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private currentSyncAbortController: AbortController | null = null;

  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        console.log('Service Worker update found');

        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker installed, will activate on next load');
            this.notifyUpdate();
          }
        });
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      // Register for background sync if supported
      if ('sync' in this.registration) {
        console.log('Background Sync supported');
      }

      // Register for periodic sync if supported (experimental)
      if ('periodicSync' in this.registration) {
        try {
          // @ts-ignore - periodicSync is experimental
          await this.registration.periodicSync.register('crm-sync', {
            minInterval: 30 * 60 * 1000 // 30 minutes
          });
          console.log('Periodic Background Sync registered');
        } catch (error) {
          console.warn('Periodic Background Sync not supported:', error);
        }
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker unregistered');
    }
  }

  cancelSync(): void {
    if (this.currentSyncAbortController) {
      console.log('[SW Manager] Cancelling current sync');
      this.currentSyncAbortController.abort();
      this.currentSyncAbortController = null;
    }
  }

  async requestSync(): Promise<void> {
    // Cancel any pending sync
    this.cancelSync();

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    this.currentSyncAbortController = new AbortController();

    if ('sync' in this.registration) {
      try {
        // @ts-ignore - sync is experimental
        await this.registration.sync.register('crm-sync');
        console.log('Background sync requested');
      } catch (error) {
        console.error('Background sync registration failed:', error);
        // Fallback to manual sync
        await this.triggerManualSync();
      }
    } else {
      // Fallback to manual sync
      await this.triggerManualSync();
    }
  }

  async triggerManualSync(): Promise<void> {
    // Cancel any pending sync
    this.cancelSync();

    if (!this.registration?.active) {
      throw new Error('No active Service Worker');
    }

    this.currentSyncAbortController = new AbortController();

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        this.currentSyncAbortController = null;
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error(event.data.error));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'SYNC_NOW' },
        [messageChannel.port2]
      );

      // Timeout after 30 seconds
      setTimeout(() => {
        this.currentSyncAbortController = null;
        reject(new Error('Sync timeout'));
      }, 30000);
    });
  }

  private handleMessage(event: MessageEvent): void {
    console.log('Message from Service Worker:', event.data);

    switch (event.data.type) {
      case 'PROCESS_SYNC_QUEUE':
        this.processSyncQueue(event.data.items).then((result) => {
          event.ports[0].postMessage({ success: true, result });
        }).catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
        break;

      case 'SYNC_COMPLETE':
        console.log(`Background sync completed: ${event.data.count} items`);
        this.notifySyncComplete(event.data.count);
        break;

      case 'SYNC_FAILED':
        console.error('Background sync failed:', event.data.error);
        this.notifySyncFailed(event.data.error);
        break;
    }
  }

  private async processSyncQueue(items: any[]): Promise<void> {
    // Import the sync service dynamically to avoid circular dependencies
    const { crmSync } = await import('@/services/crmSync');
    
    console.log(`Processing ${items.length} sync queue items...`);
    await crmSync.pushPendingChanges();
  }

  private notifyUpdate(): void {
    // Notify user about available update
    if (window.confirm('New version available! Reload to update?')) {
      window.location.reload();
    }
  }

  private notifySyncComplete(count: number): void {
    this.syncListeners.forEach(listener => {
      listener({
        registered: true,
        supported: true,
        lastSync: new Date(),
        pendingCount: 0
      });
    });
  }

  private notifySyncFailed(error: string): void {
    console.error('Sync failed:', error);
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  async getStatus(): Promise<SyncStatus> {
    const supported = 'serviceWorker' in navigator && 'sync' in (this.registration || {});
    
    return {
      registered: !!this.registration,
      supported,
      lastSync: undefined,
      pendingCount: undefined
    };
  }

  async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }
}

export const swManager = new ServiceWorkerManager();
