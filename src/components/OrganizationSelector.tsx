import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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

interface OrganizationSelectorProps {
  open: boolean;
  onSelect: (organization: Organization) => void;
}

export const OrganizationSelector = ({ open, onSelect }: OrganizationSelectorProps) => {
  const { user } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchOrganizations();
    }
  }, [open, user]);

  const fetchOrganizations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all active organizations from CRM
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (orgError) throw orgError;
      
      if (orgs && orgs.length > 0) {
        setOrganizations(orgs);
        
        // Auto-select if only one organization
        if (orgs.length === 1) {
          handleSelectOrganization(orgs[0]);
        }
      } else {
        setOrganizations([]);
        toast.error('No organizations available. Please contact your administrator.');
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrganization = async (organization: Organization) => {
    if (!user) return;

    try {
      // Update profile with selected organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: organization.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Save to user_sessions table
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          organization_id: organization.id,
          last_accessed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (sessionError) throw sessionError;

      // Apply branding after selection
      applyOrganizationBranding(organization);

      onSelect(organization);
      toast.success(`Joined ${organization.name}`);
    } catch (error: any) {
      console.error('Error selecting organization:', error);
      toast.error('Failed to join organization');
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Join Your Organization</DialogTitle>
          <DialogDescription>
            Select your organization from the list below
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : organizations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No organizations available. Please contact your administrator.
            </p>
          </div>
        ) : (
          <>
            {organizations.length > 5 && (
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
            )}
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredOrganizations.map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-4"
                  onClick={() => handleSelectOrganization(org)}
                >
                  <div className="flex flex-col items-start gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-semibold">{org.name}</span>
                    </div>
                    {org.code && (
                      <span className="text-xs text-muted-foreground">Code: {org.code}</span>
                    )}
                    {org.description && (
                      <span className="text-xs text-muted-foreground">{org.description}</span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
