import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ApplicationIdSearch } from './ApplicationIdSearch';
import { Lead, db, PlanEnrollment } from '@/lib/db';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLiveQuery } from 'dexie-react-hooks';

interface EnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dailyPlanId: string;
  enrollCount: number;
  onSave: () => void;
}

export function EnrollmentDialog({
  open,
  onOpenChange,
  dailyPlanId,
  enrollCount,
  onSave
}: EnrollmentDialogProps) {
  const [selectedContacts, setSelectedContacts] = useState<Lead[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { currentOrganization } = useAuthStore();

  // Get existing enrollments for this plan
  const existingEnrollments = useLiveQuery(
    async () => {
      if (!dailyPlanId) return [];
      return db.planEnrollments
        .where('dailyPlanId')
        .equals(dailyPlanId)
        .toArray();
    },
    [dailyPlanId],
    []
  );

  // Load existing leads when dialog opens
  useEffect(() => {
    const loadExistingLeads = async () => {
      if (existingEnrollments.length > 0) {
        const leads: Lead[] = [];
        for (const enrollment of existingEnrollments) {
          const lead = await db.leads.get(enrollment.customerId);
          if (lead) leads.push(lead);
        }
        setSelectedContacts(leads);
      } else {
        setSelectedContacts([]);
      }
    };
    
    if (open) {
      loadExistingLeads();
    }
  }, [open, existingEnrollments]);

  const handleSave = async () => {
    if (!currentOrganization?.id || !dailyPlanId) return;
    
    if (selectedContacts.length !== enrollCount) {
      toast.error(`Please select exactly ${enrollCount} lead(s)`);
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      
      // Delete existing enrollments for this plan
      await db.planEnrollments.where('dailyPlanId').equals(dailyPlanId).delete();
      
      // Create new enrollments
      const enrollments: PlanEnrollment[] = selectedContacts.map(lead => ({
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dailyPlanId,
        customerId: lead.id,
        organizationId: currentOrganization.id,
        enrolledAt: now,
        syncStatus: 'pending' as const,
        createdAt: now,
      }));

      // Save to IndexedDB
      await db.planEnrollments.bulkAdd(enrollments);

      // Add to sync queue
      for (const enrollment of enrollments) {
        await db.syncQueue.add({
          id: `sync_${enrollment.id}`,
          type: 'plan_enrollment',
          entityId: enrollment.id,
          action: 'create',
          data: enrollment,
          priority: 1,
          retryCount: 0,
          maxRetries: 5,
          createdAt: now,
        });
      }

      // Try to sync immediately if online
      if (navigator.onLine) {
        try {
          // Get the remote daily plan ID
          const plan = await db.dailyPlans.get(dailyPlanId);
          const remotePlanId = plan?.odataId || dailyPlanId;

          // Delete existing remote enrollments
          await supabase
            .from('plan_enrollments')
            .delete()
            .eq('daily_plan_id', remotePlanId);

          // Insert new enrollments
          const remoteEnrollments = enrollments.map(e => ({
            daily_plan_id: remotePlanId,
            customer_id: e.customerId,
            organization_id: e.organizationId,
            enrolled_at: e.enrolledAt.toISOString(),
          }));

          const { error } = await supabase
            .from('plan_enrollments')
            .insert(remoteEnrollments);

          if (!error) {
            // Mark as synced
            for (const enrollment of enrollments) {
              await db.planEnrollments.update(enrollment.id, {
                syncStatus: 'synced',
                lastSyncedAt: new Date(),
              });
              await db.syncQueue.delete(`sync_${enrollment.id}`);
            }
          }
        } catch (err) {
          console.log('[Enrollments] Will sync later:', err);
        }
      }

      toast.success('Enrollments saved');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving enrollments:', error);
      toast.error('Failed to save enrollments');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan Enrollments</DialogTitle>
          <DialogDescription>
            Select {enrollCount} lead{enrollCount !== 1 ? 's' : ''} you plan to enroll today.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ApplicationIdSearch
            selectedContacts={selectedContacts}
            onSelect={setSelectedContacts}
            maxSelections={enrollCount}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || selectedContacts.length !== enrollCount}
          >
            {isSaving ? 'Saving...' : 'Save Enrollments'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
