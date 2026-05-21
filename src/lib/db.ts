import Dexie, { Table } from 'dexie';

// Database schema interfaces
export interface Lead {
  id: string;
  organizationId?: string;

  // Core Lead Fields
  branch?: string;
  customerId?: string;  // Custom customer identifier (e.g., CUST-001)
  status?: string;
  assignedUserId?: string;
  name: string;

  // Location
  villageCity?: string;
  district?: string;
  state?: string;
  latitude?: number;
  longitude?: number;

  // Contact & Follow-up
  customerResponse?: string;
  mobileNo?: string;
  followUpDate?: string;
  leadSource?: string;
  notes?: string;

  // Audit Fields
  createdBy?: string;
  createdAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;

  // Sync
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  updatedAt: Date;
}

// Keep Customer as alias for backward compatibility
export type Customer = Lead;
export type Contact = Lead;

export interface Visit {
  id: string;
  customerId: string;
  userId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLatitude: number;
  checkInLongitude: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  locationAccuracy?: number;
  purpose?: string;
  notes?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  crmActivityId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string;
  visitId: string;
  blob: Blob;
  caption?: string;
  category: 'selfie' | 'property' | 'document' | 'other';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  timestamp: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
}

export interface OrderLocal {
  id?: string;
  customer_id?: string;
  user_id?: string;
  items_text?: string;
  total_amount?: number;
  notes?: string;
  photo_url?: string;
  organization_id?: string;
  created_at?: string;
  synced?: boolean;
}

export interface FieldInvoiceLocal {
  id?: string;
  customer_id?: string;
  user_id?: string;
  extracted_data?: any;
  photo_url?: string;
  amount?: number;
  organization_id?: string;
  created_at?: string;
  synced?: boolean;
}

export interface CollectionLocal {
  id?: string;
  customer_id?: string;
  user_id?: string;
  amount?: number;
  description?: string;
  receipt_photo_url?: string;
  organization_id?: string;
  created_at?: string;
  synced?: boolean;
}

export interface DailyPlanLocal {
  id: string;
  odataId?: string; // Remote ID for syncing
  userId: string;
  organizationId: string;
  planDate: string;
  prospectsTarget: number;  // Renamed from leadsTarget
  quotesTarget: number;  // Renamed from loginsTarget
  policiesTarget: number;  // Renamed from enrollTarget
  prospectsActual: number;  // Renamed from leadsActual
  quotesActual: number;  // Renamed from loginsActual
  policiesActual: number;  // Renamed from enrollActual
  lifeInsuranceTarget: number | null;  // Renamed from fiTarget
  healthInsuranceTarget: number | null;  // Renamed from dbTarget
  lifeInsuranceActual: number | null;  // Renamed from fiActual
  healthInsuranceActual: number | null;  // Renamed from dbActual
  prospectsMarket?: string | null;  // Renamed from leadsMarket
  quotesMarket?: string | null;  // Renamed from loginsMarket
  plannedLeadIds?: string[]; // Ordered list of lead IDs to visit
  assignedBy?: string; // Manager/admin who assigned this plan
  status: string;
  correctedBy: string | null;
  originalValues: Record<string, unknown> | null;
  agentFullName?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncQueueItem {
  id: string;
  type: 'visit' | 'photo' | 'customer' | 'lead' | 'daily_plan' | 'order' | 'field_invoice' | 'collection';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  priority: number; // 1=high, 2=medium, 3=low
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
}

// Database version - INCREMENT when schema changes
// Current: 18 (add orders, fieldInvoices, collections; remove unused stores)
export const DB_VERSION = 18;

class FieldSyncDatabase extends Dexie {
  leads!: Table<Lead, string>;
  visits!: Table<Visit, string>;
  photos!: Table<Photo, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  dailyPlans!: Table<DailyPlanLocal, string>;
  orders!: Table<OrderLocal, string>;
  fieldInvoices!: Table<FieldInvoiceLocal, string>;
  collections!: Table<CollectionLocal, string>;

  constructor() {
    super('FieldSyncDB');

    // Define schema - Dexie handles all version upgrades automatically
    this.version(DB_VERSION).stores({
      leads: 'id, organizationId, name, villageCity, district, state, status, customerId, syncStatus, updatedAt',
      visits: 'id, customerId, userId, checkInTime, status, syncStatus, createdAt',
      photos: 'id, visitId, timestamp, syncStatus',
      syncQueue: 'id, type, priority, createdAt, retryCount',
      dailyPlans: 'id, odataId, userId, organizationId, planDate, syncStatus, updatedAt',
      orders: '++id, customer_id, user_id, organization_id, created_at',
      fieldInvoices: '++id, customer_id, user_id, organization_id, created_at',
      collections: '++id, customer_id, user_id, organization_id, created_at',
      // Remove old stores
      forms: null,
      formResponses: null,
      communications: null,
      planEnrollments: null,
    });
  }
}

export const db = new FieldSyncDatabase();

// Version checking utility
export async function checkDatabaseVersion(): Promise<{ 
  current: number; 
  expected: number; 
  needsUpgrade: boolean;
  status: 'ok' | 'needs_upgrade' | 'newer_than_expected';
}> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FieldSyncDB');
    
    request.onsuccess = () => {
      const currentVersion = request.result.version;
      request.result.close();
      
      resolve({
        current: currentVersion,
        expected: DB_VERSION,
        needsUpgrade: currentVersion < DB_VERSION,
        status: currentVersion < DB_VERSION 
          ? 'needs_upgrade' 
          : currentVersion > DB_VERSION 
            ? 'newer_than_expected' 
            : 'ok'
      });
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Database initialization with stable version management
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('[DB] Opened successfully at version:', db.verno);
    
    // Log version info only once
    const versionInfo = await checkDatabaseVersion();
    
    if (versionInfo.status === 'newer_than_expected') {
      console.warn('[DB] Browser version is newer. This is normal after updates.');
    } else if (versionInfo.status === 'ok') {
      console.log('[DB] Version is stable at', versionInfo.current);
    }
  } catch (error: any) {
    console.error('[DB] Failed to open:', error);
    
    if (error.name === 'VersionError') {
      console.error('[DB] Version conflict - manual reset required via Sync Monitoring page');
      // Don't auto-delete - let user decide via UI button
      throw new Error('Database version conflict. Please reset database from Sync Monitoring page.');
    } else {
      throw error;
    }
  }
}
