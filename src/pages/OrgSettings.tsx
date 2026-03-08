import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Mail, Save, Loader2, Settings, Info, Car } from 'lucide-react';

export default function OrgSettings() {
  const { currentOrganization, setCurrentOrganization } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [ratePerKm, setRatePerKm] = useState('');

  useEffect(() => {
    if (!currentOrganization) return;

    async function loadSettings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', currentOrganization!.id)
          .single();

        if (error) throw error;
        const settings = data?.settings as Record<string, any> || {};
        setNotificationEmail(settings.notification_email || '');
        setRatePerKm(settings.reimbursement_rate_per_km?.toString() || '');
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [currentOrganization?.id]);

  const handleSave = async () => {
    if (!currentOrganization) return;

    if (notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const rate = parseFloat(ratePerKm);
    if (ratePerKm && (isNaN(rate) || rate < 0)) {
      toast.error('Please enter a valid rate per km');
      return;
    }

    setSaving(true);
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', currentOrganization.id)
        .single();

      const currentSettings = (orgData?.settings as Record<string, any>) || {};
      const updatedSettings = {
        ...currentSettings,
        notification_email: notificationEmail.trim() || null,
        reimbursement_rate_per_km: rate > 0 ? rate : null,
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      setCurrentOrganization({
        ...currentOrganization,
        settings: updatedSettings,
      });

      toast.success('Settings saved successfully');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure notifications and preferences for {currentOrganization?.name}
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure where sales orders and payment collection reports are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="e.g. orders@yourcompany.com"
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Sales orders and payment collection details submitted by field agents during visits
                will be emailed to this address. Leave empty to disable email notifications.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel Reimbursement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Travel Reimbursement
          </CardTitle>
          <CardDescription>
            Set the flat rate per kilometer for travel reimbursement claims
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ratePerKm">Rate per Kilometer (₹)</Label>
            <Input
              id="ratePerKm"
              type="number"
              min="0"
              step="0.5"
              value={ratePerKm}
              onChange={(e) => setRatePerKm(e.target.value)}
              placeholder="e.g. 8.50"
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Field agents can submit travel reimbursement claims based on distance travelled.
                The amount is calculated as distance (km) × rate per km. Claims go through
                manager recommendation and HQ approval before being finalized.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? 'Saving...' : 'Save All Settings'}
      </Button>
    </div>
  );
}
