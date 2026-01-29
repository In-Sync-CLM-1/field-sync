import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

export interface Organization {
  id: string;
  name: string;
  code: string | null;
  slug: string | null;
  description: string | null;
  is_active: boolean;
  logo_url: string | null;
  primary_color: string | null;
  settings: any;
  usage_limits: any;
  subscription_active: boolean | null;
  services_enabled: any;
  max_automation_emails_per_day: number | null;
  apollo_config: any;
  created_at: string;
  updated_at: string;
  // Subscription fields
  trial_ends_at: string | null;
  subscription_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | null;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  billing_email: string | null;
  billing_address: any;
  user_count: number | null;
  current_plan_id: string | null;
}

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentOrganization: Organization | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setCurrentOrganization: (organization: Organization | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  loading: true,
  currentOrganization: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setCurrentOrganization: (organization) => {
    set({ currentOrganization: organization });
    // Persist to localStorage
    if (organization) {
      localStorage.setItem('currentOrganization', JSON.stringify(organization));
    } else {
      localStorage.removeItem('currentOrganization');
    }
  },
}));
