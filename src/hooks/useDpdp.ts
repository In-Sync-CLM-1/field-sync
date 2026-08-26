import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const sb = supabase as any;

export interface PiiAccessLog {
  id: string;
  user_id: string;
  table_name: string;
  column_name: string;
  record_id: string | null;
  purpose: string;
  accessed_at: string;
}

export function usePiiAccessLog() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['pii-access-log', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<PiiAccessLog[]> => {
      const { data, error } = await sb
        .from('pii_access_log')
        .select('*')
        .eq('organization_id', org!.id)
        .order('accessed_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as PiiAccessLog[];
    },
  });
}

/** Reveal a lead's real mobile number — decrypts + writes an audit log row atomically. */
export function useRevealLeadContact() {
  return useMutation({
    mutationFn: async (leadId: string): Promise<string> => {
      const { data, error } = await sb.rpc('get_lead_contact_unmasked', { p_lead_id: leadId });
      if (error) throw error;
      return data as string;
    },
    onError: (e: any) => toast.error(e?.message || 'Failed to reveal contact'),
  });
}

export interface DataRequest {
  id: string;
  request_type: 'access' | 'correction' | 'erasure' | 'withdraw_consent' | 'nominate';
  subject_name: string;
  subject_contact: string;
  details?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  due_date: string;
  completed_at?: string;
  admin_notes?: string;
  created_at: string;
}

export function useDataRequests() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['data-requests', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<DataRequest[]> => {
      const { data, error } = await sb
        .from('data_requests')
        .select('*')
        .eq('organization_id', org!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DataRequest[];
    },
  });
}

export function useDataRequestMutations() {
  const qc = useQueryClient();
  const org = useAuthStore((s) => s.currentOrganization);
  const user = useAuthStore((s) => s.user);

  const logRequest = useMutation({
    mutationFn: async (input: { request_type: DataRequest['request_type']; subject_name: string; subject_contact: string; details?: string }) => {
      if (!org) throw new Error('No organization');
      const { error } = await sb.from('data_requests').insert({ ...input, organization_id: org.id, logged_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['data-requests'] }); toast.success('Request logged'); },
    onError: (e: any) => toast.error(e?.message || 'Failed to log request'),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: DataRequest['status']; admin_notes?: string }) => {
      const payload: Record<string, any> = { status, admin_notes };
      if (status === 'completed') payload.completed_at = new Date().toISOString();
      const { error } = await sb.from('data_requests').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['data-requests'] }); toast.success('Request updated'); },
    onError: () => toast.error('Failed to update request'),
  });

  return { logRequest, updateStatus };
}

export interface BreachNotification {
  id: string;
  title: string;
  description: string;
  impact: string;
  remedial_steps: string;
  contact_info: string;
  triggered_at: string;
}

export function useBreachNotifications() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['breach-notifications', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<BreachNotification[]> => {
      const { data, error } = await sb
        .from('breach_notifications')
        .select('*')
        .eq('organization_id', org!.id)
        .order('triggered_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BreachNotification[];
    },
  });
}

export function useReportBreach() {
  const qc = useQueryClient();
  const org = useAuthStore((s) => s.currentOrganization);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (input: { title: string; description: string; impact: string; remedial_steps: string; contact_info: string }) => {
      if (!org || !user) throw new Error('Not authenticated');
      const { error } = await sb.from('breach_notifications').insert({ ...input, organization_id: org.id, triggered_by: user.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['breach-notifications'] }); toast.success('Breach notification recorded'); },
    onError: (e: any) => toast.error(e?.message || 'Failed to record breach'),
  });
}

export function useConsentRecords() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['consent-records', org?.id],
    enabled: !!org,
    queryFn: async () => {
      const { data, error } = await sb
        .from('consent_records')
        .select('*')
        .eq('organization_id', org!.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

/** Log a consent record — called at the moment consent is actually captured
 * (e.g. right after a person-met OTP verification succeeds on a visit). */
export async function recordConsent(input: {
  organizationId: string;
  subjectType: 'lead' | 'employee' | 'person_met';
  subjectName?: string;
  subjectMobile?: string;
  leadId?: string;
  visitId?: string;
  purpose?: string;
  recordedBy?: string;
}) {
  await sb.from('consent_records').insert({
    organization_id: input.organizationId,
    subject_type: input.subjectType,
    subject_name: input.subjectName,
    subject_mobile: input.subjectMobile,
    lead_id: input.leadId,
    visit_id: input.visitId,
    purpose: input.purpose || 'field_visit_data_collection',
    recorded_by: input.recordedBy,
  });
}
