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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Plus, Mail, Phone, ArrowLeft, CheckCircle2, X } from 'lucide-react';
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
  phone: z.string().refine(
    (val) => /^[0-9]{10,15}$/.test(val.replace(/\D/g, '')),
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

type RegistrationStep = 'details' | 'otp-phone' | 'otp-email' | 'complete';

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

  // OTP verification states
  const [registrationStep, setRegistrationStep] = useState<RegistrationStep>('details');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signUpSchema.parse(signUpData);
      // Send WhatsApp OTP automatically
      await sendOTPForChannel('phone');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const sendOTPForChannel = async (channel: 'phone' | 'email') => {
    setSendingOTP(true);
    try {
      const isPhone = channel === 'phone';
      const { data, error } = await supabase.functions.invoke('send-public-otp', {
        body: isPhone
          ? { action: 'send', channel: 'whatsapp', phone: signUpData.phone.replace(/\D/g, '') }
          : { action: 'send', channel: 'email', email: signUpData.email },
      });
      if (error) throw error;
      toast.success(isPhone ? 'Verification code sent to your WhatsApp' : 'Verification code sent to your email');
      
      setOtpCode('');
      setRegistrationStep(isPhone ? 'otp-phone' : 'otp-email');
      setResendCooldown(60);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send verification code');
    } finally {
      setSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setVerifyingOTP(true);
    try {
      const isPhone = registrationStep === 'otp-phone';
      const { data, error } = await supabase.functions.invoke('send-public-otp', {
        body: isPhone
          ? { action: 'verify', channel: 'whatsapp', phone: signUpData.phone.replace(/\D/g, ''), otp: otpCode }
          : { action: 'verify', channel: 'email', email: signUpData.email, otp: otpCode },
      });
      if (error) throw error;
      
      if (data.verified) {
        if (isPhone) {
          setPhoneVerified(true);
          toast.success('Phone verified! Now verify your email.');
          // Automatically send email OTP
          await sendOTPForChannel('email');
        } else {
          setEmailVerified(true);
          toast.success('Email verified! Creating your account...');
          await completeRegistration();
        }
      } else {
        toast.error(data.error || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify code');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const completeRegistration = async () => {
    try {
      setLoading(true);
      const validatedData = signUpSchema.parse(signUpData);
      
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

        setRegistrationStep('complete');
        
        // Redirect after showing success
        setTimeout(() => {
          if (validatedData.createNewOrg) {
            navigate('/onboarding', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 2000);
      } else {
        toast.success('Account created! Please check your email to verify your account.');
        setActiveTab('signin');
        resetRegistration();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      setLoading(false);
    }
  };

  const resetRegistration = () => {
    setRegistrationStep('details');
    setOtpCode('');
    setPhoneVerified(false);
    setEmailVerified(false);
    setResendCooldown(0);
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

  const renderOTPStep = (channel: 'phone' | 'email') => {
    const isPhone = channel === 'phone';
    const identifier = isPhone ? signUpData.phone : signUpData.email;
    const label = isPhone ? 'WhatsApp' : 'Email';
    const stepNumber = isPhone ? '1/2' : '2/2';
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              if (isPhone) {
                setRegistrationStep('details');
              } else {
                setRegistrationStep('otp-phone');
              }
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-foreground">Verify {label} ({stepNumber})</h3>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-2">
          <div className={`h-1 flex-1 rounded-full ${phoneVerified ? 'bg-green-500' : isPhone ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full ${emailVerified ? 'bg-green-500' : !isPhone ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <p className="text-sm text-muted-foreground text-center">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">
            {identifier}
          </span>
          {isPhone && ' via WhatsApp'}
        </p>

        <div className="flex justify-center py-4">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            disabled={verifyingOTP}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          onClick={verifyOTP} 
          className="w-full" 
          disabled={verifyingOTP || otpCode.length !== 6}
        >
          {verifyingOTP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPhone ? 'Verify & Continue' : 'Verify & Create Account'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => sendOTPForChannel(channel)}
            disabled={resendCooldown > 0 || sendingOTP}
            className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 
              ? `Resend code in ${resendCooldown}s` 
              : 'Resend code'}
          </button>
        </div>
      </div>
    );
  };

  const renderRegistrationStep = () => {
    switch (registrationStep) {
      case 'otp-phone':
        return renderOTPStep('phone');

      case 'otp-email':
        return renderOTPStep('email');

      case 'complete':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle2 size={48} />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground">Account Created!</h3>
            <p className="text-muted-foreground">
              Welcome to InSync. Redirecting you now...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        );

      default:
        return (
          <form onSubmit={handleDetailsSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-name" className="text-sm text-foreground">Full Name</Label>
              <Input 
                id="signup-name" 
                type="text" 
                placeholder="John Doe" 
                value={signUpData.fullName} 
                onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })} 
                required 
                disabled={loading} 
                className="h-9 text-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-sm text-foreground">Email</Label>
              <Input 
                id="signup-email" 
                type="email" 
                placeholder="john@company.com" 
                value={signUpData.email} 
                onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} 
                required 
                disabled={loading} 
                className="h-9 text-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-phone" className="text-sm text-foreground">Phone</Label>
              <Input 
                id="signup-phone" 
                type="tel" 
                placeholder="9876543210" 
                value={signUpData.phone} 
                onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })} 
                required
                disabled={loading} 
                className="h-9 text-sm" 
              />
              <p className="text-xs text-muted-foreground">Verification code will be sent via WhatsApp</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-sm text-foreground">Password</Label>
                <div className="relative">
                  <Input 
                    id="signup-password" 
                    type={showSignUpPassword ? "text" : "password"} 
                    placeholder="••••••" 
                    value={signUpData.password} 
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} 
                    required 
                    disabled={loading} 
                    className="h-9 text-sm pr-9" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showSignUpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm" className="text-sm text-foreground">Confirm</Label>
                <div className="relative">
                  <Input 
                    id="signup-confirm" 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••" 
                    value={signUpData.confirmPassword} 
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })} 
                    required 
                    disabled={loading} 
                    className="h-9 text-sm pr-9" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Organization</Label>
              <Select 
                value={signUpData.createNewOrg ? '__create_new__' : signUpData.organizationId} 
                onValueChange={(value) => {
                  if (value === '__create_new__') {
                    setSignUpData({ ...signUpData, createNewOrg: true, organizationId: '' });
                  } else {
                    setSignUpData({ ...signUpData, createNewOrg: false, organizationId: value, newOrgName: '' });
                  }
                }} 
                disabled={loading || loadingOrgs}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={loadingOrgs ? "Loading..." : "Select or create organization"} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                  <SelectItem value="__create_new__" className="text-primary font-medium">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Organization
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {signUpData.createNewOrg && (
                <div className="space-y-3">
                  <Input 
                    type="text" 
                    placeholder="Enter your organization name" 
                    value={signUpData.newOrgName} 
                    onChange={(e) => setSignUpData({ ...signUpData, newOrgName: e.target.value })} 
                    disabled={loading} 
                    className="h-9 text-sm" 
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    You'll be assigned as the admin of this organization.
                  </p>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full mt-6 h-9 text-sm" disabled={loading || sendingOTP || (!signUpData.createNewOrg && loadingOrgs)}>
              {sendingOTP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Subtle background elements */}
      <div className="absolute top-20 left-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />

      <Card className="w-full max-w-md relative z-10 animate-scale-in border-border shadow-lg bg-card">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-3">
            <img 
              src={insyncLogo} 
              alt="InSync" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            {activeTab === 'signin' ? 'Welcome Back' : registrationStep === 'complete' ? 'Success!' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {activeTab === 'signin' ? 'Sign in to your account' : registrationStep === 'details' ? 'Register to get started' : ''}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-2">
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); resetRegistration(); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
              <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="register" className="text-sm">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className="text-sm text-foreground">Email</Label>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    placeholder="agent@company.com" 
                    value={signInData.email} 
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} 
                    required 
                    disabled={loading} 
                    className="h-9 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className="text-sm text-foreground">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signin-password" 
                      type={showSignInPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={signInData.password} 
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} 
                      required 
                      disabled={loading} 
                      className="h-9 text-sm pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-organization" className="text-sm text-foreground">Organization</Label>
                  <Select 
                    value={signInData.organizationId} 
                    onValueChange={(value) => setSignInData({ ...signInData, organizationId: value })} 
                    disabled={loading || loadingOrgs}
                  >
                    <SelectTrigger id="signin-organization" className="h-9 text-sm">
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
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full h-9 text-sm" disabled={loading || loadingOrgs}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {renderRegistrationStep()}
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
