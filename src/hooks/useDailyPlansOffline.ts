import { useLiveQuery } from 'dexie-react-hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, DailyPlanLocal } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';

// Check online status
const useOnlineStatus = () => {
  const getOnline = () => typeof navigator !== 'undefined' ? navigator.onLine : true;
  return getOnline();
};

// Generate local ID
const generateLocalId = () => `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Convert Supabase plan to local format
const toLocalPlan = (plan: any): DailyPlanLocal => ({
  id: plan.id,
  odataId: plan.id,
  userId: plan.user_id,
  organizationId: plan.organization_id,
  planDate: plan.plan_date,
  leadsTarget: plan.leads_target,
  loginsTarget: plan.logins_target,
  enrollTarget: plan.enroll_target,
  leadsActual: plan.leads_actual,
  loginsActual: plan.logins_actual,
  enrollActual: plan.enroll_actual,
  fiTarget: plan.fi_target,
  dbTarget: plan.db_target,
  fiActual: plan.fi_actual,
  dbActual: plan.db_actual,
  status: plan.status,
  correctedBy: plan.corrected_by,
  originalValues: plan.original_values,
  syncStatus: 'synced',
  lastSyncedAt: new Date(),
  createdAt: new Date(plan.created_at),
  updatedAt: new Date(plan.updated_at),
});

// Convert local plan to Supabase format
const toSupabasePlan = (plan: DailyPlanLocal) => ({
  user_id: plan.userId,
  organization_id: plan.organizationId,
  plan_date: plan.planDate,
  leads_target: plan.leadsTarget,
  logins_target: plan.loginsTarget,
  enroll_target: plan.enrollTarget,
  leads_actual: plan.leadsActual,
  logins_actual: plan.loginsActual,
  enroll_actual: plan.enrollActual,
  fi_target: plan.fiTarget || 0,
  db_target: plan.dbTarget || 0,
  fi_actual: plan.fiActual || 0,
  db_actual: plan.dbActual || 0,
  status: plan.status,
});

// Hook for agent's own plan - OFFLINE FIRST
export function useMyPlanOffline(planDate: string) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  
  // Use a sentinel value to distinguish "loading" from "no data"
  const LOADING = Symbol('loading');
  
  // Read from IndexedDB
  const queryResult = useLiveQuery(
    async () => {
      if (!user) return null;
      const result = await db.dailyPlans
        .where('userId')
        .equals(user.id)
        .filter(plan => plan.planDate === planDate)
        .first();
      return result || null; // Explicitly return null if no data
    },
    [user?.id, planDate],
    LOADING as any
  );
  
  const isLoading = queryResult === LOADING;
  const localPlan = isLoading ? null : queryResult;

  // Sync from server when online
  useEffect(() => {
    const syncFromServer = async () => {
      if (!user || !isOnline) return;
      
      try {
        const { data, error } = await supabase
          .from('daily_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_date', planDate)
          .maybeSingle();

        if (error) {
          console.error('[DailyPlans] Sync error:', error);
          return;
        }

        if (data) {
          const localVersion = toLocalPlan(data);
          // Check if local version exists
          const existing = await db.dailyPlans
            .where('odataId')
            .equals(data.id)
            .first();
          
          if (existing) {
            // Only update if server version is newer and local is synced
            if (existing.syncStatus === 'synced') {
              await db.dailyPlans.put({ ...localVersion, id: existing.id });
            }
          } else {
            // Add server data to local
            await db.dailyPlans.put(localVersion);
          }
        }
      } catch (err) {
        console.error('[DailyPlans] Failed to sync from server:', err);
      }
    };

    syncFromServer();
  }, [user?.id, planDate, isOnline]);

  return {
    data: localPlan,
    isLoading,
    isOnline,
  };
}

// Hook for team plans - OFFLINE FIRST
export function useTeamPlansOffline(planDate: string) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  
  // Read from IndexedDB - get all plans for the date
  const localPlans = useLiveQuery(
    async () => {
      if (!user) return [];
      return db.dailyPlans
        .where('planDate')
        .equals(planDate)
        .toArray();
    },
    [planDate],
    []
  );

  // Sync from server when online
  useEffect(() => {
    const syncFromServer = async () => {
      if (!user || !isOnline) return;
      
      try {
        const { data, error } = await supabase
          .from('daily_plans')
          .select(`
            *,
            user:profiles!daily_plans_user_id_fkey(
              id,
              full_name,
              first_name,
              last_name,
              reporting_manager_id
            )
          `)
          .eq('plan_date', planDate);

        if (error) {
          console.error('[DailyPlans] Team sync error:', error);
          return;
        }

        if (data) {
          // Store locally
          for (const plan of data) {
            const localVersion = toLocalPlan(plan);
            const existing = await db.dailyPlans
              .where('odataId')
              .equals(plan.id)
              .first();
            
            if (existing) {
              if (existing.syncStatus === 'synced') {
                await db.dailyPlans.update(existing.id, { ...localVersion, id: existing.id });
              }
            } else {
              await db.dailyPlans.put(localVersion);
            }
          }
        }
      } catch (err) {
        console.error('[DailyPlans] Failed to sync team from server:', err);
      }
    };

    syncFromServer();
  }, [user?.id, planDate, isOnline]);

  return {
    data: localPlans || [],
    isLoading: localPlans === undefined,
    isOnline,
  };
}

// Hook for org plans - OFFLINE FIRST
export function useOrgPlansOffline(planDate: string) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const isOnline = useOnlineStatus();
  
  // Read from IndexedDB
  const localPlans = useLiveQuery(
    async () => {
      if (!user || !currentOrganization) return [];
      return db.dailyPlans
        .where('organizationId')
        .equals(currentOrganization.id)
        .filter(plan => plan.planDate === planDate)
        .toArray();
    },
    [currentOrganization?.id, planDate],
    []
  );

  // Sync from server when online
  useEffect(() => {
    const syncFromServer = async () => {
      if (!user || !currentOrganization || !isOnline) return;
      
      try {
        const { data, error } = await supabase
          .from('daily_plans')
          .select(`
            *,
            user:profiles!daily_plans_user_id_fkey(
              id,
              full_name,
              first_name,
              last_name,
              reporting_manager_id
            )
          `)
          .eq('organization_id', currentOrganization.id)
          .eq('plan_date', planDate);

        if (error) {
          console.error('[DailyPlans] Org sync error:', error);
          return;
        }

        if (data) {
          for (const plan of data) {
            const localVersion = toLocalPlan(plan);
            const existing = await db.dailyPlans
              .where('odataId')
              .equals(plan.id)
              .first();
            
            if (existing) {
              if (existing.syncStatus === 'synced') {
                await db.dailyPlans.update(existing.id, { ...localVersion, id: existing.id });
              }
            } else {
              await db.dailyPlans.put(localVersion);
            }
          }
        }
      } catch (err) {
        console.error('[DailyPlans] Failed to sync org from server:', err);
      }
    };

    syncFromServer();
  }, [user?.id, currentOrganization?.id, planDate, isOnline]);

  return {
    data: localPlans || [],
    isLoading: localPlans === undefined,
    isOnline,
  };
}

// Create plan mutation - OFFLINE FIRST
export function useCreatePlanOffline() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (input: {
      plan_date: string;
      leads_target: number;
      logins_target: number;
      enroll_target: number;
      fi_target?: number;
      db_target?: number;
    }) => {
      if (!user || !currentOrganization) throw new Error('Not authenticated');

      const localId = generateLocalId();
      const now = new Date();
      
      const localPlan: DailyPlanLocal = {
        id: localId,
        userId: user.id,
        organizationId: currentOrganization.id,
        planDate: input.plan_date,
        leadsTarget: input.leads_target,
        loginsTarget: input.logins_target,
        enrollTarget: input.enroll_target,
        leadsActual: 0,
        loginsActual: 0,
        enrollActual: 0,
        fiTarget: input.fi_target || 0,
        dbTarget: input.db_target || 0,
        fiActual: 0,
        dbActual: 0,
        status: 'submitted',
        correctedBy: null,
        originalValues: null,
        syncStatus: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      // Save to IndexedDB first
      await db.dailyPlans.add(localPlan);

      // Add to sync queue
      await db.syncQueue.add({
        id: `sync_${localId}`,
        type: 'daily_plan',
        entityId: localId,
        action: 'create',
        data: localPlan,
        priority: 1,
        retryCount: 0,
        maxRetries: 5,
        createdAt: now,
      });

      // Try to sync immediately if online
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('daily_plans')
            .insert(toSupabasePlan(localPlan))
            .select()
            .single();

          if (!error && data) {
            // Update local with server ID
            await db.dailyPlans.update(localId, {
              odataId: data.id,
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
            });
            // Remove from sync queue
            await db.syncQueue.delete(`sync_${localId}`);
          }
        } catch (err) {
          console.log('[DailyPlans] Will sync later:', err);
        }
      }

      return localPlan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan', 'my', variables.plan_date] });
      toast.success(isOnline ? 'Plan saved' : 'Plan saved locally (will sync when online)');
    },
    onError: (error: Error) => {
      toast.error('Failed to save plan: ' + error.message);
    },
  });
}

// Update plan mutation - OFFLINE FIRST
export function useUpdatePlanOffline() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      leads_target?: number;
      logins_target?: number;
      enroll_target?: number;
      fi_target?: number;
      db_target?: number;
      leads_actual?: number;
      logins_actual?: number;
      enroll_actual?: number;
      fi_actual?: number;
      db_actual?: number;
      status?: string;
    }) => {
      const { id, ...updates } = input;
      
      // Get existing plan
      const existingPlan = await db.dailyPlans.get(id);
      if (!existingPlan) throw new Error('Plan not found');

      const now = new Date();
      const updatedPlan: Partial<DailyPlanLocal> = {
        ...(updates.leads_target !== undefined && { leadsTarget: updates.leads_target }),
        ...(updates.logins_target !== undefined && { loginsTarget: updates.logins_target }),
        ...(updates.enroll_target !== undefined && { enrollTarget: updates.enroll_target }),
        ...(updates.fi_target !== undefined && { fiTarget: updates.fi_target }),
        ...(updates.db_target !== undefined && { dbTarget: updates.db_target }),
        ...(updates.leads_actual !== undefined && { leadsActual: updates.leads_actual }),
        ...(updates.logins_actual !== undefined && { loginsActual: updates.logins_actual }),
        ...(updates.enroll_actual !== undefined && { enrollActual: updates.enroll_actual }),
        ...(updates.fi_actual !== undefined && { fiActual: updates.fi_actual }),
        ...(updates.db_actual !== undefined && { dbActual: updates.db_actual }),
        ...(updates.status !== undefined && { status: updates.status }),
        syncStatus: 'pending',
        updatedAt: now,
      };

      // Update in IndexedDB
      await db.dailyPlans.update(id, updatedPlan);

      // Add to sync queue
      await db.syncQueue.put({
        id: `sync_${id}`,
        type: 'daily_plan',
        entityId: id,
        action: 'update',
        data: { ...existingPlan, ...updatedPlan },
        priority: 1,
        retryCount: 0,
        maxRetries: 5,
        createdAt: now,
      });

      // Try to sync immediately if online
      if (isOnline && existingPlan.odataId) {
        try {
          const { error } = await supabase
            .from('daily_plans')
            .update({
              ...(updates.leads_target !== undefined && { leads_target: updates.leads_target }),
              ...(updates.logins_target !== undefined && { logins_target: updates.logins_target }),
              ...(updates.enroll_target !== undefined && { enroll_target: updates.enroll_target }),
              ...(updates.fi_target !== undefined && { fi_target: updates.fi_target }),
              ...(updates.db_target !== undefined && { db_target: updates.db_target }),
              ...(updates.leads_actual !== undefined && { leads_actual: updates.leads_actual }),
              ...(updates.logins_actual !== undefined && { logins_actual: updates.logins_actual }),
              ...(updates.enroll_actual !== undefined && { enroll_actual: updates.enroll_actual }),
              ...(updates.fi_actual !== undefined && { fi_actual: updates.fi_actual }),
              ...(updates.db_actual !== undefined && { db_actual: updates.db_actual }),
              ...(updates.status !== undefined && { status: updates.status }),
            })
            .eq('id', existingPlan.odataId);

          if (!error) {
            await db.dailyPlans.update(id, {
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
            });
            await db.syncQueue.delete(`sync_${id}`);
          }
        } catch (err) {
          console.log('[DailyPlans] Will sync update later:', err);
        }
      }

      return { ...existingPlan, ...updatedPlan };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan'] });
      queryClient.invalidateQueries({ queryKey: ['daily-plans'] });
      toast.success(isOnline ? 'Plan updated' : 'Plan updated locally (will sync when online)');
    },
    onError: (error: Error) => {
      toast.error('Failed to update plan: ' + error.message);
    },
  });
}

// Correct plan mutation - OFFLINE FIRST (for managers)
export function useCorrectPlanOffline() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      leads_target?: number;
      logins_target?: number;
      enroll_target?: number;
      original: DailyPlanLocal;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { id, original, ...updates } = input;
      const now = new Date();

      const correction: Partial<DailyPlanLocal> = {
        ...(updates.leads_target !== undefined && { leadsTarget: updates.leads_target }),
        ...(updates.logins_target !== undefined && { loginsTarget: updates.logins_target }),
        ...(updates.enroll_target !== undefined && { enrollTarget: updates.enroll_target }),
        correctedBy: user.id,
        originalValues: {
          leads_target: original.leadsTarget,
          logins_target: original.loginsTarget,
          enroll_target: original.enrollTarget,
        },
        status: 'corrected',
        syncStatus: 'pending',
        updatedAt: now,
      };

      // Update in IndexedDB
      await db.dailyPlans.update(id, correction);

      // Add to sync queue
      await db.syncQueue.put({
        id: `sync_${id}`,
        type: 'daily_plan',
        entityId: id,
        action: 'update',
        data: { ...original, ...correction },
        priority: 1,
        retryCount: 0,
        maxRetries: 5,
        createdAt: now,
      });

      // Try to sync immediately if online
      if (isOnline && original.odataId) {
        try {
          const { error } = await supabase
            .from('daily_plans')
            .update({
              leads_target: updates.leads_target,
              logins_target: updates.logins_target,
              enroll_target: updates.enroll_target,
              corrected_by: user.id,
              original_values: JSON.parse(JSON.stringify({
                leads_target: original.leadsTarget,
                logins_target: original.loginsTarget,
                enroll_target: original.enrollTarget,
              })),
              status: 'corrected',
            })
            .eq('id', original.odataId);

          if (!error) {
            await db.dailyPlans.update(id, {
              syncStatus: 'synced',
              lastSyncedAt: new Date(),
            });
            await db.syncQueue.delete(`sync_${id}`);
          }
        } catch (err) {
          console.log('[DailyPlans] Will sync correction later:', err);
        }
      }

      return { ...original, ...correction };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-plan'] });
      queryClient.invalidateQueries({ queryKey: ['daily-plans'] });
      toast.success(isOnline ? 'Plan corrected' : 'Plan corrected locally (will sync when online)');
    },
    onError: (error: Error) => {
      toast.error('Failed to correct plan: ' + error.message);
    },
  });
}

// Utility to sync pending plans when coming back online
export async function syncPendingDailyPlans() {
  const pendingItems = await db.syncQueue
    .where('type')
    .equals('daily_plan')
    .toArray();

  for (const item of pendingItems) {
    try {
      const plan = await db.dailyPlans.get(item.entityId);
      if (!plan) {
        await db.syncQueue.delete(item.id);
        continue;
      }

      if (item.action === 'create') {
        const { data, error } = await supabase
          .from('daily_plans')
          .insert(toSupabasePlan(plan))
          .select()
          .single();

        if (!error && data) {
          await db.dailyPlans.update(plan.id, {
            odataId: data.id,
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          });
          await db.syncQueue.delete(item.id);
        } else if (error) {
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastAttemptAt: new Date(),
            error: error.message,
          });
        }
      } else if (item.action === 'update' && plan.odataId) {
        const { error } = await supabase
          .from('daily_plans')
          .update(toSupabasePlan(plan))
          .eq('id', plan.odataId);

        if (!error) {
          await db.dailyPlans.update(plan.id, {
            syncStatus: 'synced',
            lastSyncedAt: new Date(),
          });
          await db.syncQueue.delete(item.id);
        } else {
          await db.syncQueue.update(item.id, {
            retryCount: item.retryCount + 1,
            lastAttemptAt: new Date(),
            error: error.message,
          });
        }
      }
    } catch (err) {
      console.error('[DailyPlans] Sync failed for item:', item.id, err);
    }
  }
}
