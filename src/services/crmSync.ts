import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { syncAnalytics } from './syncAnalytics';
import { networkMonitor } from './networkMonitor';
import { errorHandler } from './errorHandler';
import { logger } from './logger';

export class CRMSyncService {
  private static instance: CRMSyncService;
  private isSyncing = false;
  private currentAbortController: AbortController | null = null;

  private constructor() {}

  static getInstance(): CRMSyncService {
    if (!CRMSyncService.instance) {
      CRMSyncService.instance = new CRMSyncService();
    }
    return CRMSyncService.instance;
  }

  cancelCurrentSync(): void {
    if (this.currentAbortController) {
      logger.info('Cancelling current sync operation', 'CRM Sync', {
        wasRunning: this.isSyncing
      });
      this.currentAbortController.abort();
      this.currentAbortController = null;
      this.isSyncing = false;
    }
  }

  /**
   * Push a single visit to CRM
   */
  async pushVisitToCrm(visit: any): Promise<void> {
    const attemptId = crypto.randomUUID();
    const startTime = Date.now();
    logger.setCorrelationId(attemptId);
    
    logger.info('Pushing visit to CRM', 'CRMSync', { 
      attemptId, 
      visitId: visit.id,
      customerId: visit.customerId 
    });
    logger.addBreadcrumb(`Sync: Push visit ${visit.id}`);
    
    syncAnalytics.recordAttempt({
      type: 'visit',
      status: 'pending',
      retryCount: 0
    });
    
    try {
      // Check network quality
      const networkStatus = networkMonitor.getStatus();
      if (!networkMonitor.shouldSync()) {
        logger.warn('Network unsuitable for visit sync', 'CRMSync', { networkStatus });
        throw new Error('Network unsuitable for sync');
      }
      
      // Get organization_id from visit's customer
      const customer = await db.customers.get(visit.customerId);
      const organization_id = customer?.organizationId;

      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: { 
          action: 'push_visit',
          data: { ...visit, organization_id }
        }
      });

      if (error) {
        logger.error('CRM API error on push visit', 'CRMSync', error, { 
          visitId: visit.id,
          attemptId 
        });
        throw error;
      }

      // Mark visit as synced
      await db.visits.update(visit.id, {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
        crmActivityId: data.activityId
      });

      // Update customer location
      if (visit.checkOutLatitude && visit.checkOutLongitude) {
        await db.customers.update(visit.customerId, {
          latitude: visit.checkOutLatitude,
          longitude: visit.checkOutLongitude,
          lastVerifiedLocationAt: visit.checkOutTime || visit.checkInTime,
          syncStatus: 'synced'
        });
      }

      const duration = Date.now() - startTime;
      syncAnalytics.updateAttemptStatus(attemptId, 'success', undefined, duration);
      
      logger.info('Visit synced to CRM successfully', 'CRMSync', {
        attemptId,
        visitId: visit.id,
        activityId: data.activityId,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const appError = errorHandler.handle(error, 'Visit Sync');
      syncAnalytics.updateAttemptStatus(attemptId, 'failed', appError.message, duration);
      
      logger.error('Failed to push visit to CRM', 'CRMSync', error as Error, {
        attemptId,
        visitId: visit.id,
        duration,
        retryable: appError.retryable
      });
      
      // Add to sync queue for retry if retryable
      if (appError.retryable) {
        logger.info('Adding visit to sync queue for retry', 'CRMSync', { visitId: visit.id });
        await db.syncQueue.add({
          id: crypto.randomUUID(),
          type: 'visit',
          entityId: visit.id,
          action: 'create',
          data: visit,
          priority: 1,
          retryCount: 0,
          maxRetries: 3,
          error: appError.message,
          createdAt: new Date()
        });
      }

      throw error;
    }
  }

  /**
   * Process sync queue - push pending changes to CRM
   */
  async pushPendingChanges(): Promise<void> {
    const correlationId = logger.generateId();
    logger.setCorrelationId(correlationId);
    
    try {
      const pendingItems = await db.syncQueue
        .orderBy('priority')
        .filter(item => item.retryCount < item.maxRetries)
        .toArray();

      logger.info('Checking pending sync items', 'CRMSync', { 
        correlationId,
        count: pendingItems.length 
      });

      if (pendingItems.length === 0) {
        logger.debug('No pending changes to sync', 'CRMSync');
        return;
      }

      logger.info(`Processing ${pendingItems.length} pending sync items`, 'CRMSync', {
        correlationId,
        items: pendingItems.map(i => ({ id: i.id, type: i.type, retries: i.retryCount }))
      });

      for (const item of pendingItems) {
        const itemTimer = logger.startTimer();
        try {
          logger.info(`Syncing ${item.type}`, 'CRMSync', { 
            itemId: item.id,
            entityId: item.entityId,
            retryCount: item.retryCount 
          });
          
          const { data, error } = await supabase.functions.invoke('crm-sync', {
            body: { 
              action: `push_${item.type}`,
              data: item.data
            }
          });

          if (error) throw error;

          // Remove from queue on success
          await db.syncQueue.delete(item.id);

          // Update entity sync status
          if (item.type === 'visit') {
            await db.visits.update(item.entityId, {
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
              crmActivityId: data.activityId
            });
          }

          const duration = itemTimer.end(`Successfully synced ${item.type}`, 'CRMSync');
          logger.info(`Sync queue item completed`, 'CRMSync', {
            itemId: item.id,
            type: item.type,
            entityId: item.entityId,
            duration
          });
        } catch (error) {
          // Increment retry count
          const newRetryCount = item.retryCount + 1;
          await db.syncQueue.update(item.id, {
            retryCount: newRetryCount,
            lastAttemptAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          logger.error(`Failed to sync ${item.type}`, 'CRMSync', error as Error, {
            itemId: item.id,
            entityId: item.entityId,
            retryCount: newRetryCount,
            maxRetries: item.maxRetries
          });
        }
      }

      const failedCount = await db.syncQueue.count();
      logger.info('Sync queue processing complete', 'CRMSync', { 
        correlationId,
        failedCount 
      });
      
      if (failedCount > 0) {
        toast.warning(`${failedCount} items still pending sync`);
      } else {
        toast.success('All changes synced to CRM');
      }
    } catch (error) {
      logger.error('Error processing sync queue', 'CRMSync', error as Error);
      toast.error('Failed to sync changes to CRM');
    }
  }

  /**
   * Setup hybrid sync: immediate + 30-minute batch
   */
  setupPeriodicSync(): void {
    logger.info('Setting up periodic sync', 'CRMSync', {
      pendingChangesInterval: '5 minutes'
    });

    // Check for pending changes every 5 minutes
    setInterval(() => {
      logger.debug('Running scheduled 5-minute pending changes check', 'CRMSync');
      this.pushPendingChanges().catch(err => {
        logger.error('Scheduled pending changes check failed', 'CRMSync', err);
      });
    }, 5 * 60 * 1000);
  }

  /**
   * Sync all organizations from CRM to local database
   * - Fetches from /organizations endpoint
   * - Upserts all organizations (creates new, updates existing)
   * - Caches timestamp to prevent frequent syncing
   */
  async syncOrganizations(): Promise<void> {
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const CACHE_KEY = 'org_last_sync';

    try {
      // Check cache - only sync if >24h old
      const lastSync = localStorage.getItem(CACHE_KEY);
      if (lastSync && Date.now() - parseInt(lastSync) < CACHE_DURATION) {
        logger.info('Organizations data is fresh, skipping sync', 'CRMSync');
        return;
      }

      logger.info('Starting organizations sync from CRM...', 'CRMSync');

      // Check network
      if (!navigator.onLine) {
        throw new Error('No network connection');
      }

      // Fetch from CRM via edge function
      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: { action: 'fetch_organizations' }
      });

      if (error) {
        logger.error('Failed to fetch organizations:', 'CRMSync', error);
        throw error;
      }

      if (!data?.organizations || !Array.isArray(data.organizations)) {
        throw new Error('Invalid organizations data format');
      }

      logger.info(`Fetched ${data.organizations.length} organizations from CRM`, 'CRMSync');

      // Upsert each organization
      for (const org of data.organizations) {
        const { error: upsertError } = await supabase
          .from('organizations')
          .upsert({
            id: org.id,
            name: org.name,
            code: org.slug,
            slug: org.slug,
            description: org.name,
            logo_url: org.logo_url,
            primary_color: org.primary_color,
            settings: org.settings || {},
            usage_limits: org.usage_limits || {},
            subscription_active: org.subscription_active ?? true,
            services_enabled: org.services_enabled || {},
            max_automation_emails_per_day: org.max_automation_emails_per_day,
            apollo_config: org.apollo_config,
            is_active: org.subscription_active ?? true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          logger.error(`Failed to upsert organization ${org.id}:`, 'CRMSync', upsertError);
          throw upsertError;
        }
      }

      // Update cache timestamp
      localStorage.setItem(CACHE_KEY, Date.now().toString());
      
      logger.info('Organizations sync completed successfully', 'CRMSync');
      toast.success(`Synced ${data.organizations.length} organizations`);

    } catch (error) {
      logger.error('Organizations sync failed:', 'CRMSync', error as Error);
      toast.error('Failed to sync organizations');
      throw error;
    }
  }

  /**
   * Force refresh organizations (ignores cache)
   */
  async refreshOrganizations(): Promise<void> {
    localStorage.removeItem('org_last_sync');
    await this.syncOrganizations();
  }

  /**
   * Sync contacts from CRM for a specific organization
   * - Fetches contacts filtered by organization_id
   * - Upserts to IndexedDB with organizationId
   * - Syncs to Supabase customers table
   * - Caches for 1 hour
   */
  async syncContacts(organizationId: string): Promise<void> {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const CACHE_KEY = `contacts_last_sync_${organizationId}`;

    try {
      // Check cache - only sync if >1h old
      const lastSync = localStorage.getItem(CACHE_KEY);
      if (lastSync && Date.now() - parseInt(lastSync) < CACHE_DURATION) {
        logger.info('Contacts data is fresh, skipping sync', 'CRMSync', { organizationId });
        return;
      }

      logger.info('Starting contacts sync from CRM...', 'CRMSync', { organizationId });

      // Check network
      if (!navigator.onLine) {
        throw new Error('No network connection');
      }

      // Fetch from CRM via edge function
      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: { 
          action: 'fetch_contacts',
          data: { organization_id: organizationId }
        }
      });

      if (error) {
        logger.error('Failed to fetch contacts:', 'CRMSync', error);
        throw error;
      }

      if (!data?.contacts || !Array.isArray(data.contacts)) {
        throw new Error('Invalid contacts data format');
      }

      logger.info(`Fetched ${data.contacts.length} contacts from CRM`, 'CRMSync', { organizationId });

      // Upsert to IndexedDB
      for (const contact of data.contacts) {
        await db.customers.put({
          id: contact.id,
          organizationId: contact.organization_id || organizationId,
          name: contact.first_name && contact.last_name 
            ? `${contact.first_name} ${contact.last_name}` 
            : contact.name || 'Unknown',
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          city: contact.city,
          status: contact.status || 'active',
          territory: contact.territory,
          tags: contact.tags || [],
          latitude: contact.latitude,
          longitude: contact.longitude,
          lastVerifiedLocationAt: contact.last_verified_location_at,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
          crmId: contact.id
        });
      }

      // Sync to Supabase customers table
      for (const contact of data.contacts) {
        const { error: upsertError } = await supabase
          .from('customers')
          .upsert({
            id: contact.id,
            organization_id: contact.organization_id || organizationId,
            name: contact.first_name && contact.last_name 
              ? `${contact.first_name} ${contact.last_name}` 
              : contact.name || 'Unknown',
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            city: contact.city,
            state: contact.state,
            postal_code: contact.postal_code,
            country: contact.country,
            status: contact.status || 'active',
            territory: contact.territory,
            tags: contact.tags,
            latitude: contact.latitude,
            longitude: contact.longitude,
            company_name: contact.company,
            crm_customer_id: contact.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          logger.error(`Failed to upsert contact ${contact.id}:`, 'CRMSync', upsertError);
        }
      }

      // Update cache timestamp
      localStorage.setItem(CACHE_KEY, Date.now().toString());
      
      logger.info('Contacts sync completed successfully', 'CRMSync', { 
        organizationId,
        count: data.contacts.length 
      });
      toast.success(`Synced ${data.contacts.length} contacts`);

    } catch (error) {
      logger.error('Contacts sync failed:', 'CRMSync', error as Error, { organizationId });
      toast.error('Failed to sync contacts from CRM');
      throw error;
    }
  }

  /**
   * Force refresh contacts (ignores cache)
   */
  async refreshContacts(organizationId: string): Promise<void> {
    localStorage.removeItem(`contacts_last_sync_${organizationId}`);
    await this.syncContacts(organizationId);
  }

  /**
   * Sync users from CRM for a specific organization
   * - Fetches users filtered by organization_id
   * - Syncs to Supabase profiles table
   * - Caches for 1 hour
   */
  async syncUsers(organizationId: string): Promise<void> {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const CACHE_KEY = `users_last_sync_${organizationId}`;

    try {
      // Check cache
      const lastSync = localStorage.getItem(CACHE_KEY);
      if (lastSync && Date.now() - parseInt(lastSync) < CACHE_DURATION) {
        logger.info('Users data is fresh, skipping sync', 'CRMSync', { organizationId });
        return;
      }

      logger.info('Starting users sync from CRM...', 'CRMSync', { organizationId });

      if (!navigator.onLine) {
        throw new Error('No network connection');
      }

      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: { 
          action: 'fetch_users',
          data: { organization_id: organizationId }
        }
      });

      if (error) {
        logger.error('Failed to fetch users:', 'CRMSync', error);
        throw error;
      }

      if (!data?.users || !Array.isArray(data.users)) {
        throw new Error('Invalid users data format');
      }

      logger.info(`Fetched ${data.users.length} users from CRM`, 'CRMSync', { organizationId });

      // Sync to Supabase profiles table
      for (const user of data.users) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            organization_id: user.organization_id || organizationId,
            full_name: user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.name || 'Unknown',
            phone: user.phone,
            avatar_url: user.avatar_url,
            crm_user_id: user.id,
            crm_role: user.role,
            reporting_manager_id: user.reporting_manager_id,
            last_synced_from_crm: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          logger.error(`Failed to upsert user ${user.id}:`, 'CRMSync', upsertError);
        }
      }

      localStorage.setItem(CACHE_KEY, Date.now().toString());
      
      logger.info('Users sync completed successfully', 'CRMSync', { 
        organizationId,
        count: data.users.length 
      });
      toast.success(`Synced ${data.users.length} users`);

    } catch (error) {
      logger.error('Users sync failed:', 'CRMSync', error as Error, { organizationId });
      toast.error('Failed to sync users from CRM');
      throw error;
    }
  }

  /**
   * Sync roles from CRM
   * - Fetches all roles from CRM
   * - Stores mapping data for role assignment
   * - Caches for 1 hour
   */
  async syncRoles(): Promise<void> {
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const CACHE_KEY = 'roles_last_sync';

    try {
      const lastSync = localStorage.getItem(CACHE_KEY);
      if (lastSync && Date.now() - parseInt(lastSync) < CACHE_DURATION) {
        logger.info('Roles data is fresh, skipping sync', 'CRMSync');
        return;
      }

      logger.info('Starting roles sync from CRM...', 'CRMSync');

      if (!navigator.onLine) {
        throw new Error('No network connection');
      }

      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: { action: 'fetch_roles' }
      });

      if (error) {
        logger.error('Failed to fetch roles:', 'CRMSync', error);
        throw error;
      }

      if (!data?.roles || !Array.isArray(data.roles)) {
        throw new Error('Invalid roles data format');
      }

      logger.info(`Fetched ${data.roles.length} roles from CRM`, 'CRMSync');

      // Store role mapping in localStorage for reference
      localStorage.setItem('crm_roles', JSON.stringify(data.roles));
      localStorage.setItem(CACHE_KEY, Date.now().toString());
      
      logger.info('Roles sync completed successfully', 'CRMSync', { count: data.roles.length });

    } catch (error) {
      logger.error('Roles sync failed:', 'CRMSync', error as Error);
      toast.error('Failed to sync roles from CRM');
      throw error;
    }
  }

  /**
   * Force refresh users (ignores cache)
   */
  async refreshUsers(organizationId: string): Promise<void> {
    localStorage.removeItem(`users_last_sync_${organizationId}`);
    await this.syncUsers(organizationId);
  }
}

export const crmSync = CRMSyncService.getInstance();
