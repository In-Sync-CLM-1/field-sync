import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import insyncLogo from '@/assets/insync-logo-color.png';

const signInSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  organizationId: z.string().min(1, 'Organization is required'),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const { setCurrentOrganization } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);

  const [signInData, setSignInData] = useState({ email: '', password: '', organizationId: '' });

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setOrganizations(orgs || []);
      } catch (error: any) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (user) {
      const checkOrganization = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        
        if (profile?.organization_id) {
          navigate('/', { replace: true });
        }
      };
      checkOrganization();
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signInSchema.parse(signInData);
      setLoading(true);
      const { error } = await signIn(signInData.email, signInData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
      } else {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ organization_id: signInData.organizationId })
            .eq('id', currentUser.id);
          if (profileError) {
            toast.error('Failed to set organization');
            setLoading(false);
            return;
          }
          const selectedOrg = organizations.find(org => org.id === signInData.organizationId);
          if (selectedOrg) setCurrentOrganization(selectedOrg);
        }
        toast.success('Signed in successfully');
        navigate('/', { replace: true });
      }
    } catch (error) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-muted/30" />
      
      {/* Subtle floating orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-orb-float" />
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-orb-float" style={{ animationDelay: '-4s' }} />

      <Card className="w-full max-w-md relative z-10 animate-scale-in border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={insyncLogo} 
              alt="InSync" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome Back
          </CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input 
                id="signin-email" 
                type="email" 
                placeholder="agent@company.com" 
                value={signInData.email} 
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} 
                required 
                disabled={loading} 
                className="focus:ring-primary/30 focus:border-primary" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <Input 
                id="signin-password" 
                type="password" 
                placeholder="••••••••" 
                value={signInData.password} 
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} 
                required 
                disabled={loading} 
                className="focus:ring-primary/30 focus:border-primary" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-organization">Organization</Label>
              <Select 
                value={signInData.organizationId} 
                onValueChange={(value) => setSignInData({ ...signInData, organizationId: value })} 
                disabled={loading || loadingOrgs}
              >
                <SelectTrigger id="signin-organization">
                  <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select organization"} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading || loadingOrgs}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
        
        <CardFooter>
          <p className="text-xs text-center text-muted-foreground w-full">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
