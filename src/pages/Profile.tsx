import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { User, Mail, Phone, Building2, Shield, Save, Loader2 } from 'lucide-react';
const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Platform Admin',
  admin: 'Admin',
  agent: 'Agent',
};
const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [orgName, setOrgName] = useState('');
  const [branchName, setBranchName] = useState('');

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      setLoading(true);
      try {
        // Fetch profile, roles, org, and branch in parallel
        const [profileRes, rolesRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user!.id).single(),
          supabase.from('user_roles').select('role').eq('user_id', user!.id),
        ]);

        if (profileRes.data) {
          const p = profileRes.data;
          setProfile(p);
          setFirstName(p.first_name || '');
          setLastName(p.last_name || '');
          setPhone(p.phone || '');

          // Fetch org name
          if (p.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', p.organization_id)
              .single();
            if (org) setOrgName(org.name);
          }

          // Fetch branch name
          if (p.branch_id) {
            const { data: branch } = await supabase
              .from('branches')
              .select('name')
              .eq('id', p.branch_id)
              .single();
            if (branch) setBranchName(branch.name);
          }
        }

        setRoles(rolesRes.data?.map(r => r.role) || []);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || profile?.email;
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          full_name: fullName,
          phone: phone || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
    }
    return profile?.email?.charAt(0)?.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarFallback className="text-xl bg-primary text-primary-foreground font-bold">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {profile?.full_name || profile?.email}
          </h1>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {roles.map(role => (
              <Badge key={role} variant="secondary" className="text-xs">
                {getRoleLabel(role)}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Editable Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your name and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Phone Number
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Enter phone number"
              type="tel"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              Email
            </Label>
            <Input value={profile?.email || ''} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Read-only Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Organization</span>
            <span className="text-sm font-medium text-foreground">{orgName || '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Branch</span>
            <span className="text-sm font-medium text-foreground">{branchName || '—'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Role(s)
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {roles.map(role => (
                <Badge key={role} variant="outline" className="text-xs">
                  {getRoleLabel(role)}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
