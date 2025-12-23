// Network Quality Monitor - Detect and adapt to network conditions
import { logger } from './logger';

export interface NetworkStatus {
  online: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus;

  private constructor() {
    this.currentStatus = this.getNetworkStatus();
    this.setupListeners();
    logger.info('NetworkMonitor initialized', 'NetworkMonitor', { 
      initialStatus: this.currentStatus 
    });
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private setupListeners(): void {
    window.addEventListener('online', () => this.handleNetworkChange());
    window.addEventListener('offline', () => this.handleNetworkChange());

    // Network Information API (experimental)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', () => this.handleNetworkChange());
    }
  }

  private handleNetworkChange(): void {
    const previousStatus = this.currentStatus;
    this.currentStatus = this.getNetworkStatus();
    
    logger.info('Network status changed', 'NetworkMonitor', {
      from: previousStatus,
      to: this.currentStatus,
      online: this.currentStatus.online,
      quality: this.currentStatus.quality
    });
    
    logger.addBreadcrumb(`Network: ${previousStatus.quality} → ${this.currentStatus.quality}`);
    this.notifyListeners();
  }

  private getNetworkStatus(): NetworkStatus {
    const online = navigator.onLine;

    if (!online) {
      return {
        online: false,
        quality: 'offline',
      };
    }

    // Try to get detailed network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      const downlink = connection?.downlink;
      const rtt = connection?.rtt;
      const saveData = connection?.saveData;

      let quality: 'excellent' | 'good' | 'poor' = 'good';

      if (effectiveType === '4g' && downlink > 5) {
        quality = 'excellent';
      } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink < 2)) {
        quality = 'poor';
      } else if (rtt && rtt > 300) {
        quality = 'poor';
      }

      return {
        online: true,
        quality,
        effectiveType,
        downlink,
        rtt,
        saveData,
      };
    }

    // Fallback: basic online status
    return {
      online: true,
      quality: 'good',
    };
  }

  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  shouldSync(): boolean {
    const status = this.getStatus();
    const should = status.online && status.quality !== 'offline';
    
    logger.debug(`Sync decision: ${should}`, 'NetworkMonitor', {
      online: status.online,
      quality: status.quality
    });
    
    return should;
  }

  shouldDelaySyn(): boolean {
    const status = this.getStatus();
    const should = status.quality === 'poor' || !!status.saveData;
    
    logger.debug(`Delay sync decision: ${should}`, 'NetworkMonitor', {
      quality: status.quality,
      saveData: status.saveData
    });
    
    return should;
  }

  getSyncDelay(): number {
    const status = this.getStatus();
    let delay: number;
    
    if (status.quality === 'excellent') delay = 1000;
    else if (status.quality === 'good') delay = 3000;
    else if (status.quality === 'poor') delay = 10000;
    else delay = 5000;
    
    logger.debug(`Sync delay: ${delay}ms`, 'NetworkMonitor', {
      quality: status.quality
    });
    
    return delay;
  }

  subscribe(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }
}

export const networkMonitor = NetworkMonitor.getInstance();
