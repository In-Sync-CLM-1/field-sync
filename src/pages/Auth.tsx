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
import { Loader2, Eye, EyeOff, Plus, Mail, Phone, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

type RegistrationStep = 'details' | 'verify-method' | 'otp' | 'complete';
type VerificationType = 'email' | 'phone';

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
  const [verificationType, setVerificationType] = useState<VerificationType>('email');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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
      // Move to verification method selection
      setRegistrationStep('verify-method');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const sendOTP = async () => {
    const identifier = verificationType === 'email' ? signUpData.email : signUpData.phone;
    
    if (!identifier) {
      toast.error(`Please provide a valid ${verificationType}`);
      return;
    }

    if (verificationType === 'phone' && !signUpData.phone) {
      toast.error('Phone number is required for WhatsApp verification');
      return;
    }

    setSendingOTP(true);
    try {
      if (verificationType === 'phone') {
        // Use WhatsApp OTP via send-public-otp
        const { data, error } = await supabase.functions.invoke('send-public-otp', {
          body: {
            phone: signUpData.phone.replace(/\D/g, ''),
            channel: 'whatsapp',
          },
        });
        if (error) throw error;
        toast.success('Verification code sent to your WhatsApp');
      } else {
        // Use email OTP via existing send-otp
        const { data, error } = await supabase.functions.invoke('send-otp', {
          body: {
            identifier: signUpData.email,
            identifier_type: 'email',
          },
        });
        if (error) throw error;
        toast.success('Verification code sent to your email');
      }
      
      setRegistrationStep('otp');
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
      if (verificationType === 'phone') {
        // Verify via send-public-otp
        const { data, error } = await supabase.functions.invoke('send-public-otp', {
          body: {
            phone: signUpData.phone.replace(/\D/g, ''),
            otp: otpCode,
            action: 'verify',
          },
        });
        if (error) throw error;
        
        if (data.verified) {
          setOtpVerified(true);
          toast.success('WhatsApp verification successful!');
          await completeRegistration();
        } else {
          toast.error(data.error || 'Invalid verification code');
        }
      } else {
        // Verify via existing verify-otp
        const { data, error } = await supabase.functions.invoke('verify-otp', {
          body: {
            identifier: signUpData.email,
            identifier_type: 'email',
            code: otpCode,
          },
        });
        if (error) throw error;
        
        if (data.success) {
          setOtpVerified(true);
          toast.success('Verification successful!');
          await completeRegistration();
        } else {
          toast.error(data.error || 'Invalid verification code');
        }
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
    setVerificationType('email');
    setOtpCode('');
    setOtpVerified(false);
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

  const renderRegistrationStep = () => {
    switch (registrationStep) {
      case 'verify-method':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setRegistrationStep('details')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold text-foreground">Verify Your Identity</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Choose how you'd like to receive your verification code:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setVerificationType('email')}
                className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  verificationType === 'email' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className={`p-2 rounded-full ${verificationType === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Mail size={20} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground truncate">{signUpData.email}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVerificationType('phone')}
                disabled={!signUpData.phone}
                className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 transition-all ${
                  verificationType === 'phone' 
                    ? 'border-primary bg-primary/5' 
                    : signUpData.phone 
                      ? 'border-border hover:border-muted-foreground' 
                      : 'border-border opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`p-2 rounded-full ${verificationType === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Phone size={20} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    {signUpData.phone || 'No phone number provided'}
                  </p>
                </div>
              </button>
            </div>

            <Button 
              onClick={sendOTP} 
              className="w-full mt-4" 
              disabled={sendingOTP}
            >
              {sendingOTP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Verification Code
            </Button>
          </div>
        );

      case 'otp':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setRegistrationStep('verify-method')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-lg font-semibold text-foreground">Enter Verification Code</h3>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-foreground">
                {verificationType === 'email' ? signUpData.email : signUpData.phone}
              </span>
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
              Verify & Create Account
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={sendOTP}
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
              <Label htmlFor="signup-phone" className="text-sm text-foreground">Phone (for OTP verification)</Label>
              <Input 
                id="signup-phone" 
                type="tel" 
                placeholder="9876543210" 
                value={signUpData.phone} 
                onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })} 
                disabled={loading} 
                className="h-9 text-sm" 
              />
              <p className="text-xs text-muted-foreground">Optional if verifying via email</p>
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
                <div className="space-y-2">
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
            <Button type="submit" className="w-full mt-6 h-9 text-sm" disabled={loading || (!signUpData.createNewOrg && loadingOrgs)}>
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
