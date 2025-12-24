import Dexie, { Table } from 'dexie';

// Database schema interfaces
export interface Contact {
  id: string;
  organizationId?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  lastVerifiedLocationAt?: string;
  status?: string;
  territory?: string;
  tags?: string[];
  applicationId?: string; // Application ID for enrollment tracking
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  updatedAt: Date;
  crmId?: string;
}

// Keep Customer as alias for backward compatibility
export type Customer = Contact;

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
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  schema: any; // JSON schema for form fields
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormResponse {
  id: string;
  visitId: string;
  formId: string;
  userId: string;
  responses: any; // JSON of field responses
  signature?: string; // Base64 signature
  completedAt?: Date;
  syncStatus: 'draft' | 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyPlanLocal {
  id: string;
  odataId?: string; // Remote ID for syncing
  userId: string;
  organizationId: string;
  planDate: string;
  leadsTarget: number;
  loginsTarget: number;
  enrollTarget: number;
  leadsActual: number;
  loginsActual: number;
  enrollActual: number;
  fiTarget: number | null;
  dbTarget: number | null;
  fiActual: number | null;
  dbActual: number | null;
  status: string;
  correctedBy: string | null;
  originalValues: Record<string, unknown> | null;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanEnrollment {
  id: string;
  dailyPlanId: string;
  customerId: string;
  organizationId: string;
  enrolledAt: Date;
  notes?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
  createdAt: Date;
}

export interface SyncQueueItem {
  id: string;
  type: 'visit' | 'photo' | 'form' | 'communication' | 'customer' | 'daily_plan' | 'plan_enrollment';
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

export interface Communication {
  id: string;
  customerId: string;
  visitId?: string;
  userId: string;
  type: 'call' | 'whatsapp' | 'sms' | 'email';
  initiatedAt: Date;
  confirmed: boolean;
  notes?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: Date;
}

// Database version - ONLY increment this when schema actually changes
// Current: 14 (added planEnrollments table and applicationId to customers)
export const DB_VERSION = 14;

class FieldVisitDatabase extends Dexie {
  customers!: Table<Customer, string>;
  visits!: Table<Visit, string>;
  photos!: Table<Photo, string>;
  forms!: Table<FormSchema, string>;
  formResponses!: Table<FormResponse, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  communications!: Table<Communication, string>;
  dailyPlans!: Table<DailyPlanLocal, string>;
  planEnrollments!: Table<PlanEnrollment, string>;

  constructor() {
    super('FieldVisitDB');
    
    // Define schema - Dexie handles all version upgrades automatically
    // STABLE VERSION: Do not change unless schema actually needs modification
    this.version(DB_VERSION).stores({
      customers: 'id, organizationId, name, city, territory, status, applicationId, syncStatus, updatedAt',
      visits: 'id, customerId, userId, checkInTime, status, syncStatus, createdAt',
      photos: 'id, visitId, timestamp, syncStatus',
      forms: 'id, name, isActive, version, createdAt',
      formResponses: 'id, visitId, formId, userId, syncStatus, createdAt',
      syncQueue: 'id, type, priority, createdAt, retryCount',
      communications: 'id, customerId, visitId, userId, type, initiatedAt, syncStatus',
      dailyPlans: 'id, odataId, userId, organizationId, planDate, syncStatus, updatedAt',
      planEnrollments: 'id, dailyPlanId, customerId, organizationId, syncStatus, createdAt'
    });
  }
}

export const db = new FieldVisitDatabase();

// Version checking utility
export async function checkDatabaseVersion(): Promise<{ 
  current: number; 
  expected: number; 
  needsUpgrade: boolean;
  status: 'ok' | 'needs_upgrade' | 'newer_than_expected';
}> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FieldVisitDB');
    
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
