import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { applyOrganizationBranding } from '@/utils/branding';

interface Organization {
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
  subscription_active: boolean;
  services_enabled: any;
  max_automation_emails_per_day: number | null;
  apollo_config: any;
  created_at: string;
  updated_at: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (organization: Organization | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { currentOrganization, setCurrentOrganization } = useAuthStore();

  // Load organization from localStorage on mount
  useEffect(() => {
    const savedOrg = localStorage.getItem('currentOrganization');
    if (savedOrg && !currentOrganization) {
      try {
        const org = JSON.parse(savedOrg);
        setCurrentOrganization(org);
      } catch (error) {
        console.error('Error parsing saved organization:', error);
        localStorage.removeItem('currentOrganization');
      }
    }
  }, [currentOrganization, setCurrentOrganization]);

  // Apply branding when organization changes
  useEffect(() => {
    if (currentOrganization) {
      applyOrganizationBranding(currentOrganization);
    }
  }, [currentOrganization]);

  return (
    <OrganizationContext.Provider value={{ currentOrganization, setCurrentOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
