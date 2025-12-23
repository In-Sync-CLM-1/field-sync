// Sync Analytics Service - Track and analyze sync operations

export interface SyncAttempt {
  id: string;
  timestamp: Date;
  type: 'visit' | 'customer' | 'form';
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  error?: string;
  duration?: number;
  retryCount: number;
}

export interface SyncStats {
  totalAttempts: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  averageDuration: number;
  successRate: number;
  lastSyncTime?: Date;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

class SyncAnalyticsService {
  private static instance: SyncAnalyticsService;
  private attempts: SyncAttempt[] = [];
  private readonly MAX_ATTEMPTS = 100;
  private listeners: Set<(stats: SyncStats) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): SyncAnalyticsService {
    if (!SyncAnalyticsService.instance) {
      SyncAnalyticsService.instance = new SyncAnalyticsService();
    }
    return SyncAnalyticsService.instance;
  }

  recordAttempt(attempt: Omit<SyncAttempt, 'id' | 'timestamp'>): void {
    const newAttempt: SyncAttempt = {
      ...attempt,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.attempts.unshift(newAttempt);
    
    // Keep only recent attempts
    if (this.attempts.length > this.MAX_ATTEMPTS) {
      this.attempts = this.attempts.slice(0, this.MAX_ATTEMPTS);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  updateAttemptStatus(id: string, status: 'success' | 'failed', error?: string, duration?: number): void {
    const attempt = this.attempts.find(a => a.id === id);
    if (attempt) {
      attempt.status = status;
      if (error) attempt.error = error;
      if (duration) attempt.duration = duration;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  getStats(): SyncStats {
    const now = Date.now();
    const recentAttempts = this.attempts.filter(
      a => now - a.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    const totalAttempts = recentAttempts.length;
    const successCount = recentAttempts.filter(a => a.status === 'success').length;
    const failedCount = recentAttempts.filter(a => a.status === 'failed').length;
    const pendingCount = recentAttempts.filter(a => a.status === 'pending').length;
    const cancelledCount = recentAttempts.filter(a => a.status === 'cancelled').length;
    
    const successfulAttempts = recentAttempts.filter(a => a.status === 'success' && a.duration);
    const averageDuration = successfulAttempts.length > 0
      ? successfulAttempts.reduce((sum, a) => sum + (a.duration || 0), 0) / successfulAttempts.length
      : 0;

    const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

    const lastSync = recentAttempts.find(a => a.status === 'success');

    return {
      totalAttempts,
      successCount,
      failedCount,
      pendingCount,
      averageDuration,
      successRate,
      lastSyncTime: lastSync?.timestamp,
      networkQuality: this.getNetworkQuality(successRate),
    };
  }

  getRecentAttempts(limit: number = 3): SyncAttempt[] {
    return this.attempts.slice(0, limit);
  }

  cancelPendingAttempts(): void {
    const now = Date.now();
    let cancelled = 0;
    
    this.attempts.forEach(attempt => {
      if (attempt.status === 'pending') {
        attempt.status = 'cancelled';
        attempt.error = 'Cancelled by user';
        cancelled++;
      }
    });
    
    if (cancelled > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  getFailedAttempts(): SyncAttempt[] {
    return this.attempts.filter(a => a.status === 'failed');
  }

  clearOldAttempts(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.attempts = this.attempts.filter(a => a.timestamp.getTime() > oneDayAgo);
    this.saveToStorage();
    this.notifyListeners();
  }

  private getNetworkQuality(successRate: number): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!navigator.onLine) return 'offline';
    if (successRate >= 95) return 'excellent';
    if (successRate >= 80) return 'good';
    return 'poor';
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('sync-analytics', JSON.stringify(this.attempts));
    } catch (error) {
      console.error('Failed to save sync analytics:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('sync-analytics');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.attempts = parsed.map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load sync analytics:', error);
      this.attempts = [];
    }
  }

  subscribe(callback: (stats: SyncStats) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }
}

export const syncAnalytics = SyncAnalyticsService.getInstance();
