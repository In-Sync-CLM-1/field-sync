import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { swManager } from '@/lib/serviceWorker';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingCount = useLiveQuery(
    async () => {
      const count = await db.syncQueue.count();
      return count;
    },
    [],
    0
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await swManager.requestSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show if online and no pending items
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-warning/10 border-warning">
      <WifiOff className="h-4 w-4 text-warning" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          {!isOnline ? (
            <>
              You're offline. Changes will sync when connection is restored.
              {pendingCount > 0 && ` (${pendingCount} pending)`}
            </>
          ) : (
            <>
              {pendingCount} {pendingCount === 1 ? 'item' : 'items'} waiting to sync.
            </>
          )}
        </span>
        
        {isOnline && pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="ml-4"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
