import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const sb = supabase as any;

export interface SubDSA {
  id: string;
  organization_id: string;
  dsa_id: string;
  code: string;
  name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface DSA {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  contact_name?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface DSAListItem extends DSA {
  sub_dsa_count: number;
}

/** All Corporate DSAs for the org, with a Sub-DSA count each (for the management list). */
export function useDSAs() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['dsas', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<DSAListItem[]> => {
      const { data: dsas, error } = await sb
        .from('dsas')
        .select('*')
        .eq('organization_id', org!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (dsas || []) as DSA[];
      if (rows.length === 0) return [];

      const { data: subs } = await sb
        .from('sub_dsas')
        .select('dsa_id')
        .in('dsa_id', rows.map((d) => d.id));
      const counts = new Map<string, number>();
      (subs || []).forEach((s: any) => counts.set(s.dsa_id, (counts.get(s.dsa_id) || 0) + 1));

      return rows.map((d) => ({ ...d, sub_dsa_count: counts.get(d.id) || 0 }));
    },
  });
}

/** Sub-DSAs under one Corporate DSA (for the visit-form picker and the registry editor). */
export function useSubDSAs(dsaId?: string) {
  return useQuery({
    queryKey: ['sub-dsas', dsaId],
    enabled: !!dsaId,
    queryFn: async (): Promise<SubDSA[]> => {
      const { data, error } = await sb
        .from('sub_dsas')
        .select('*')
        .eq('dsa_id', dsaId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as SubDSA[];
    },
  });
}

/** Only active DSAs (for the visit-form picker; management page uses useDSAs for the full list). */
export function useActiveDSAs() {
  const org = useAuthStore((s) => s.currentOrganization);
  return useQuery({
    queryKey: ['dsas-active', org?.id],
    enabled: !!org,
    queryFn: async (): Promise<DSA[]> => {
      const { data, error } = await sb
        .from('dsas')
        .select('*')
        .eq('organization_id', org!.id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as DSA[];
    },
  });
}

export function useDSAMutations() {
  const qc = useQueryClient();
  const org = useAuthStore((s) => s.currentOrganization);
  const user = useAuthStore((s) => s.user);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['dsas'] });
    qc.invalidateQueries({ queryKey: ['dsas-active'] });
    qc.invalidateQueries({ queryKey: ['sub-dsas'] });
  };

  const saveDSA = useMutation({
    mutationFn: async (input: { id?: string; name: string; contact_name?: string; contact_phone?: string; is_active: boolean }) => {
      if (!org) throw new Error('No organization');
      if (input.id) {
        const { error } = await sb
          .from('dsas')
          .update({
            name: input.name.trim(),
            contact_name: input.contact_name || null,
            contact_phone: input.contact_phone || null,
            is_active: input.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.id);
        if (error) throw error;
        return input.id;
      }
      const { data: code, error: codeErr } = await sb.rpc('generate_dsa_code', { p_org: org.id });
      if (codeErr) throw codeErr;
      const { data, error } = await sb
        .from('dsas')
        .insert({
          organization_id: org.id,
          code,
          name: input.name.trim(),
          contact_name: input.contact_name || null,
          contact_phone: input.contact_phone || null,
          is_active: input.is_active,
          created_by: user?.id,
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => { invalidateAll(); toast.success('DSA saved'); },
    onError: (e: any) => toast.error(e?.message || 'Failed to save DSA'),
  });

  const deleteDSA = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('dsas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success('DSA deleted'); },
    onError: () => toast.error('Failed to delete DSA (remove its Sub-DSAs first)'),
  });

  /** Quick-add a new Sub-DSA under a DSA — used both from the registry and from the visit form. */
  const addSubDSA = useMutation({
    mutationFn: async (input: { dsa_id: string; name: string; phone?: string }) => {
      if (!org) throw new Error('No organization');
      const { data: code, error: codeErr } = await sb.rpc('generate_sub_dsa_code', { p_org: org.id });
      if (codeErr) throw codeErr;
      const { data, error } = await sb
        .from('sub_dsas')
        .insert({
          organization_id: org.id,
          dsa_id: input.dsa_id,
          code,
          name: input.name.trim(),
          phone: input.phone || null,
          created_by: user?.id,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as SubDSA;
    },
    onSuccess: () => { invalidateAll(); toast.success('Sub-DSA added'); },
    onError: (e: any) => toast.error(e?.message || 'Failed to add Sub-DSA'),
  });

  const toggleSubDSAActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await sb.from('sub_dsas').update({ is_active, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
    onError: () => toast.error('Failed to update Sub-DSA'),
  });

  const deleteSubDSA = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from('sub_dsas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success('Sub-DSA deleted'); },
    onError: () => toast.error('Failed to delete Sub-DSA'),
  });

  return { saveDSA, deleteDSA, addSubDSA, toggleSubDSAActive, deleteSubDSA };
}
