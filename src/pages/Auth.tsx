import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Building2, Plus } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import insyncLogo from '@/assets/insync-logo-color.png';

const signInSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  organizationId: z.string().min(1, 'Organization is required'),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().optional().refine(
    (val) => !val || /^[0-9]{10,15}$/.test(val.replace(/\D/g, '')),
    'Invalid phone number'
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  organizationId: z.string().optional(),
  newOrgName: z.string().optional(),
  createNewOrg: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.createNewOrg) {
    return data.newOrgName && data.newOrgName.trim().length >= 2;
  }
  return data.organizationId && data.organizationId.length > 0;
}, {
  message: "Organization is required",
  path: ["organizationId"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { setCurrentOrganization } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('signin');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const [signInData, setSignInData] = useState({ email: '', password: '', organizationId: '' });
  const [signUpData, setSignUpData] = useState({ 
    fullName: '', 
    email: '', 
    phone: '',
    password: '', 
    confirmPassword: '',
    organizationId: '',
    newOrgName: '',
    createNewOrg: false
  });

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = signUpSchema.parse(signUpData);
      setLoading(true);
      
      const { error } = await signUp(validatedData.email, validatedData.password, validatedData.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please sign in.');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the newly created user and update their profile
      const { data: { user: newUser } } = await supabase.auth.getUser();
      
      if (newUser) {
        let organizationId = validatedData.organizationId;

        // Create new organization if user chose that option
        if (validatedData.createNewOrg && validatedData.newOrgName) {
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: validatedData.newOrgName.trim() })
            .select()
            .single();

          if (orgError) {
            console.error('Organization creation error:', orgError);
            toast.error('Failed to create organization');
            setLoading(false);
            return;
          }

          organizationId = newOrg.id;

          // Assign admin role to the creator
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: newUser.id, role: 'admin' });

          if (roleError) {
            console.error('Role assignment error:', roleError);
            // Don't block - they can still use the app
          }
        }

        const updateData: { organization_id: string; phone?: string } = {
          organization_id: organizationId!,
        };
        
        if (validatedData.phone) {
          updateData.phone = validatedData.phone.replace(/\D/g, '');
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', newUser.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        const selectedOrg = validatedData.createNewOrg 
          ? { id: organizationId, name: validatedData.newOrgName }
          : organizations.find(org => org.id === organizationId);
        if (selectedOrg) setCurrentOrganization(selectedOrg);

        toast.success(validatedData.createNewOrg 
          ? 'Organization created! Welcome to InSync.' 
          : 'Account created successfully! Welcome to InSync.');
        navigate('/', { replace: true });
      } else {
        toast.success('Account created! Please check your email to verify your account.');
        setActiveTab('signin');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setSendingReset(true);
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast.error('Failed to send reset email');
    } finally {
      setSendingReset(false);
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
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {activeTab === 'signin' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'signin' ? 'Sign in to your account' : 'Register to get started'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
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
                  <div className="relative">
                    <Input 
                      id="signin-password" 
                      type={showSignInPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={signInData.password} 
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} 
                      required 
                      disabled={loading} 
                      className="focus:ring-primary/30 focus:border-primary pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={loading || loadingOrgs}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input 
                    id="signup-name" 
                    type="text" 
                    placeholder="John Doe" 
                    value={signUpData.fullName} 
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })} 
                    required 
                    disabled={loading} 
                    className="focus:ring-primary/30 focus:border-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="john@company.com" 
                    value={signUpData.email} 
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} 
                    required 
                    disabled={loading} 
                    className="focus:ring-primary/30 focus:border-primary" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (Optional)</Label>
                  <Input 
                    id="signup-phone" 
                    type="tel" 
                    placeholder="9876543210" 
                    value={signUpData.phone} 
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })} 
                    disabled={loading} 
                    className="focus:ring-primary/30 focus:border-primary" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input 
                        id="signup-password" 
                        type={showSignUpPassword ? "text" : "password"} 
                        placeholder="••••••" 
                        value={signUpData.password} 
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} 
                        required 
                        disabled={loading} 
                        className="focus:ring-primary/30 focus:border-primary pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm</Label>
                    <div className="relative">
                      <Input 
                        id="signup-confirm" 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="••••••" 
                        value={signUpData.confirmPassword} 
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })} 
                        required 
                        disabled={loading} 
                        className="focus:ring-primary/30 focus:border-primary pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Organization</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!signUpData.createNewOrg ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSignUpData({ ...signUpData, createNewOrg: false, newOrgName: '' })}
                      disabled={loading}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Join Existing
                    </Button>
                    <Button
                      type="button"
                      variant={signUpData.createNewOrg ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setSignUpData({ ...signUpData, createNewOrg: true, organizationId: '' })}
                      disabled={loading}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                  
                  {!signUpData.createNewOrg ? (
                    <Select 
                      value={signUpData.organizationId} 
                      onValueChange={(value) => setSignUpData({ ...signUpData, organizationId: value })} 
                      disabled={loading || loadingOrgs}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select organization"} />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      type="text" 
                      placeholder="Enter organization name" 
                      value={signUpData.newOrgName} 
                      onChange={(e) => setSignUpData({ ...signUpData, newOrgName: e.target.value })} 
                      disabled={loading} 
                      className="focus:ring-primary/30 focus:border-primary" 
                    />
                  )}
                  
                  {signUpData.createNewOrg && (
                    <p className="text-xs text-muted-foreground">
                      You'll be assigned as the admin of this organization.
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading || (!signUpData.createNewOrg && loadingOrgs)}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <p className="text-xs text-center text-muted-foreground w-full">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="agent@company.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                disabled={sendingReset}
                className="focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                disabled={sendingReset}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendingReset}>
                {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
