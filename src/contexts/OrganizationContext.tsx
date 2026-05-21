import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore, Organization } from '@/store/authStore';
import { applyOrganizationBranding } from '@/utils/branding';

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
