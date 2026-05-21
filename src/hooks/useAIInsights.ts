import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';

export interface AIInsight {
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'action';
  recommendation: string;
}

export function useAIInsights() {
  const { currentOrganization } = useAuthStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!currentOrganization?.id) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-insights', {
        body: { organization_id: currentOrganization.id },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setInsights(data?.insights ?? []);
    } catch (err: any) {
      console.error('AI insights error:', err);
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  return { insights, loading, error, generate };
}
