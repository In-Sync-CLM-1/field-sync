import { useEffect, useState } from 'react';
import { syncAnalytics, SyncStats, SyncAttempt } from '@/services/syncAnalytics';
import { usePagination } from '@/hooks/usePagination';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, XCircle, Clock, RefreshCw, Trash2, Ban, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { swManager } from '@/lib/serviceWorker';
import { toast } from 'sonner';
import { CrmConnectionTest } from '@/components/CrmConnectionTest';
import { crmSync } from '@/services/crmSync';
import { checkDatabaseVersion, DB_VERSION, db } from '@/lib/db';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export default function SyncMonitoring() {
  const [stats, setStats] = useState<SyncStats>(syncAnalytics.getStats());
  const [recentAttempts, setRecentAttempts] = useState<SyncAttempt[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<SyncAttempt[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [dbVersion, setDbVersion] = useState<{ current: number; expected: number; status: string } | null>(null);

  useEffect(() => {
    const updateData = () => {
      setStats(syncAnalytics.getStats());
      setRecentAttempts(syncAnalytics.getRecentAttempts(20));
      setFailedAttempts(syncAnalytics.getFailedAttempts());
    };

    const loadDbVersion = async () => {
      try {
        const versionInfo = await checkDatabaseVersion();
        setDbVersion(versionInfo);
      } catch (error) {
        console.error('Failed to check DB version:', error);
      }
    };

    updateData();
    loadDbVersion();
    const unsubscribe = syncAnalytics.subscribe(updateData);

    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    // Cancel any pending syncs first
    crmSync.cancelCurrentSync();
    syncAnalytics.cancelPendingAttempts();
    
    if (syncing) {
      toast.info('Previous sync cancelled');
    }

    setSyncing(true);
    try {
      await swManager.requestSync();
      toast.success('Sync completed successfully');
    } catch (error) {
      toast.error('Sync failed: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearOld = () => {
    syncAnalytics.clearOldAttempts();
    toast.success('Old sync attempts cleared');
  };

  const handleResetDatabase = async () => {
    if (!confirm('This will delete all local data and recreate the database. Continue?')) {
      return;
    }
    
    try {
      await db.close();
      await indexedDB.deleteDatabase('FieldVisitDB');
      toast.success('Database reset. Please refresh the page.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      toast.error('Failed to reset database: ' + (error as Error).message);
    }
  };

  const getNetworkQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'poor': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled': return <Ban className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const recentPagination = usePagination({ items: recentAttempts, itemsPerPage: 10 });
  const failedPagination = usePagination({ items: failedAttempts, itemsPerPage: 10 });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Monitoring</h1>
          <p className="text-muted-foreground">Track and manage data synchronization</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleManualSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Force Sync
          </Button>
          <Button variant="outline" onClick={handleClearOld}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Old
          </Button>
        </div>
      </div>

      {/* Database Version Info */}
      {dbVersion && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle className="text-lg">Database Version</CardTitle>
            </div>
            <Button variant="destructive" size="sm" onClick={handleResetDatabase}>
              Reset Database
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Version:</span>
                <Badge variant="outline">{dbVersion.current}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expected Version:</span>
                <Badge variant="outline">{dbVersion.expected}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={dbVersion.status === 'ok' ? 'default' : 'secondary'}>
                  {dbVersion.status}
                </Badge>
              </div>
              {dbVersion.status === 'newer_than_expected' && (
                <Alert>
                  <AlertDescription className="text-xs">
                    Browser has a newer version than code expects. This may indicate cached code. Try a hard refresh.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRM Connection Test */}
      <CrmConnectionTest />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{stats.successCount} successful</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Items</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedCount}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} pending retry</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Quality</CardTitle>
            <div className={`h-3 w-3 rounded-full ${getNetworkQualityColor(stats.networkQuality)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.networkQuality}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.averageDuration.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Failed Attempts Alert */}
      {failedAttempts.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {failedAttempts.length} failed sync attempts require attention. Review below.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Attempts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Attempts</CardTitle>
          <CardDescription>
            Latest synchronization operations
            {recentPagination.totalItems > 0 && (
              <span className="ml-2">
                (Showing {recentPagination.startIndex}-{recentPagination.endIndex} of {recentPagination.totalItems})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {recentAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No sync attempts recorded yet
              </p>
            ) : (
              recentPagination.paginatedItems.map((attempt) => (
                <div key={attempt.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="mt-0.5">{getStatusIcon(attempt.status)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{attempt.type}</Badge>
                        <span className="text-sm font-medium capitalize">{attempt.status}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(attempt.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    {attempt.error && (
                      <p className="text-xs text-red-500">{attempt.error}</p>
                    )}
                    {attempt.duration && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {attempt.duration}ms • Retries: {attempt.retryCount}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {recentPagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={recentPagination.previousPage}
                    className={!recentPagination.canGoPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: recentPagination.totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage = 
                    page === 1 || 
                    page === recentPagination.totalPages || 
                    (page >= recentPagination.currentPage - 1 && page <= recentPagination.currentPage + 1);
                  
                  if (!showPage && page !== recentPagination.currentPage - 2 && page !== recentPagination.currentPage + 2) {
                    return null;
                  }

                  if ((page === recentPagination.currentPage - 2 && recentPagination.currentPage > 3) ||
                      (page === recentPagination.currentPage + 2 && recentPagination.currentPage < recentPagination.totalPages - 2)) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  if (!showPage) return null;

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => recentPagination.goToPage(page)}
                        isActive={recentPagination.currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={recentPagination.nextPage}
                    className={!recentPagination.canGoNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Failed Items Section */}
      {failedAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Items</CardTitle>
            <CardDescription>
              Items that failed to sync and need attention
              {failedPagination.totalItems > 0 && (
                <span className="ml-2">
                  (Showing {failedPagination.startIndex}-{failedPagination.endIndex} of {failedPagination.totalItems})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {failedPagination.paginatedItems.map((attempt) => (
                <div key={attempt.id} className="flex items-start gap-3 p-3 rounded-lg border border-red-200">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{attempt.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(attempt.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium">Retry Count: {attempt.retryCount}</p>
                    {attempt.error && (
                      <p className="text-xs text-red-500">{attempt.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {failedPagination.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={failedPagination.previousPage}
                      className={!failedPagination.canGoPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: failedPagination.totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage = 
                      page === 1 || 
                      page === failedPagination.totalPages || 
                      (page >= failedPagination.currentPage - 1 && page <= failedPagination.currentPage + 1);
                    
                    if (!showPage && page !== failedPagination.currentPage - 2 && page !== failedPagination.currentPage + 2) {
                      return null;
                    }

                    if ((page === failedPagination.currentPage - 2 && failedPagination.currentPage > 3) ||
                        (page === failedPagination.currentPage + 2 && failedPagination.currentPage < failedPagination.totalPages - 2)) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    if (!showPage) return null;

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => failedPagination.goToPage(page)}
                          isActive={failedPagination.currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext 
                      onClick={failedPagination.nextPage}
                      className={!failedPagination.canGoNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
