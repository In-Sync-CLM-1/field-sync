import Dexie, { Table } from 'dexie';

// Database schema interfaces
export interface Lead {
  id: string;
  organizationId?: string;
  
  // Core Lead Fields
  branch?: string;
  proposalNumber?: string;  // Renamed from leadId - Proposal/Policy number
  customerId?: string;  // Custom customer identifier (e.g., CUST-001)
  status?: string;
  assignedUserId?: string;
  policyTypeCategory?: string;  // Renamed from entityName - Life/Health/Motor/General
  name: string;
  
  // Policy Details (renamed from Loan Details)
  premiumAmount?: number;  // Renamed from loanAmount - Annual premium
  policyType?: string;  // Renamed from loanPurpose - Type of policy
  
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
  status: string;
  correctedBy: string | null;
  originalValues: Record<string, unknown> | null;
  agentFullName?: string;
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
  type: 'visit' | 'photo' | 'form' | 'communication' | 'customer' | 'lead' | 'daily_plan' | 'plan_enrollment';
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

// Database version - INCREMENT when schema changes
// Current: 16 (insurance terminology update)
export const DB_VERSION = 16;

class FieldVisitDatabase extends Dexie {
  leads!: Table<Lead, string>;
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
    this.version(DB_VERSION).stores({
      leads: 'id, organizationId, name, villageCity, district, state, status, proposalNumber, customerId, syncStatus, updatedAt',
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
