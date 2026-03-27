import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, AlertCircle, Users, Search, UserPlus, KeyRound, Edit2, Trash2, CheckCircle2, Phone, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type UserRole = {
  role: string;
};

type UserWithRoles = {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_active: boolean;
  branch_id: string | null;
  reporting_manager_id: string | null;
  user_roles: UserRole[];
};

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['agent', 'admin']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const editUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  role: z.enum(['agent', 'admin']),
  isActive: z.boolean(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

// Role display names for UI
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  agent: 'Agent',
  admin: 'Admin',
  platform_admin: 'Platform Admin',
};

// Get badge variant based on role
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'platform_admin':
      return 'destructive';
    case 'admin':
      return 'default';
    default:
      return 'outline';
  }
};

type CreateStep = 'details' | 'phone-otp' | 'email-otp';

export default function Forms() {
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // OTP verification state for create user
  const [createStep, setCreateStep] = useState<CreateStep>('details');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  // Store form values before fields unmount during OTP steps
  const [savedFormValues, setSavedFormValues] = useState<CreateUserForm | null>(null);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'agent',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      role: 'agent',
      isActive: true,
    },
  });

  // Fetch users with their roles
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users', currentOrganization?.id],
    queryFn: async () => {
      // Get profiles filtered by current organization
      if (!currentOrganization?.id) return [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, is_active, branch_id, reporting_manager_id')
        .eq('organization_id', currentOrganization.id)
        .order('full_name');

      if (profilesError) throw profilesError;

      // Then get roles for each user
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        user_roles: roles.filter(r => r.user_id === profile.id).map(r => ({ role: r.role }))
      }));

      return usersWithRoles;
    },
    enabled: isAdmin,
  });

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    // Hide platform_admin users from the list
    const hasPlatformAdmin = user.user_roles.some(r => r.role === 'platform_admin');
    if (hasPlatformAdmin) return false;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedUsers,
    goToPage,
    nextPage,
    previousPage,
    canGoNext,
    canGoPrevious,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({
    items: filteredUsers,
    itemsPerPage: 10,
  });

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) return;

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const userRoles = roles?.map(r => r.role) || [];
      setIsAdmin(userRoles.some(r => ['admin', 'platform_admin'].includes(r)));
    }

    checkAdminRole();
  }, [user]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const resetCreateDialog = useCallback(() => {
    setCreateStep('details');
    setPhoneOtp('');
    setEmailOtp('');
    setPhoneVerified(false);
    setEmailVerified(false);
    setResendCooldown(0);
    setSavedFormValues(null);
    form.reset();
  }, [form]);

  // Get the active form values — use saved values when form fields are unmounted
  const getFormValues = useCallback(() => {
    return savedFormValues || form.getValues();
  }, [savedFormValues, form]);

  // Extract error message from supabase.functions.invoke response
  // For non-2xx, data is null and the response body is in error.context
  const getFunctionError = (data: any, error: any): string | null => {
    if (data?.error) return data.error;
    if (error?.context?.error) return error.context.error;
    if (error?.message) return error.message;
    return null;
  };

  const sendOtp = async (channel: 'whatsapp' | 'email', values?: CreateUserForm): Promise<boolean> => {
    const v = values || getFormValues();
    setIsSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-public-otp', {
        body: {
          action: 'send',
          channel,
          ...(channel === 'whatsapp' ? { phone: v.phone } : { email: v.email }),
        },
      });
      const errMsg = getFunctionError(data, error);
      if (errMsg) throw new Error(errMsg);
      setResendCooldown(60);
      toast({
        title: 'OTP Sent',
        description: channel === 'whatsapp'
          ? `WhatsApp OTP sent to ${v.phone}`
          : `Email OTP sent to ${v.email}`,
      });
      return true;
    } catch (err) {
      toast({
        title: 'Failed to send OTP',
        description: err instanceof Error ? err.message : 'Try again',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async (channel: 'whatsapp' | 'email') => {
    const v = getFormValues();
    const code = channel === 'whatsapp' ? phoneOtp : emailOtp;
    if (code.length !== 6) return;

    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-public-otp', {
        body: {
          action: 'verify',
          channel,
          ...(channel === 'whatsapp' ? { phone: v.phone } : { email: v.email }),
          otp: code,
        },
      });
      const errMsg = getFunctionError(data, error);
      if (errMsg) throw new Error(errMsg);
      if (data?.verified !== true) throw new Error('Verification failed');

      if (channel === 'whatsapp') {
        setPhoneVerified(true);
        setCreateStep('email-otp');
        setResendCooldown(0);
        const sent = await sendOtp('email', v);
        if (!sent) {
          toast({
            title: 'Email OTP failed',
            description: 'Could not send email OTP. Please use the Resend button.',
            variant: 'destructive',
          });
        }
      } else {
        setEmailVerified(true);
        await createUserAfterVerification(v);
      }
    } catch (err) {
      toast({
        title: 'Verification failed',
        description: err instanceof Error ? err.message : 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDetailsSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    // Save values BEFORE unmounting form fields
    const values = form.getValues();
    setSavedFormValues(values);
    setCreateStep('phone-otp');
    await sendOtp('whatsapp', values);
  };

  const createUserAfterVerification = async (v?: CreateUserForm) => {
    const values = v || getFormValues();
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: values.email,
          password: values.password,
          fullName: values.fullName,
          phone: values.phone,
          role: values.role,
          organizationId: currentOrganization?.id,
        },
      });

      const errMsg = getFunctionError(data, error);
      if (errMsg) throw new Error(errMsg);

      toast({
        title: 'User Created',
        description: `${values.fullName} has been successfully created with ${ROLE_DISPLAY_NAMES[values.role]} role.`,
      });

      resetCreateDialog();
      setDialogOpen(false);
      refetchUsers();
    } catch (error) {
      console.error('Create user error:', error);
      toast({
        title: 'Failed to Create User',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const onResetPassword = async (values: ResetPasswordForm) => {
    if (!selectedUser) return;
    
    setIsResettingPassword(true);

    try {
      // Call Edge Function to reset password securely
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { 
          userId: selectedUser.id, 
          password: values.password 
        }
      });

      const errMsg = getFunctionError(data, error);
      if (errMsg) throw new Error(errMsg);

      toast({
        title: 'Password Reset',
        description: `Password for ${selectedUser.full_name} has been successfully reset.`,
      });

      resetPasswordForm.reset();
      setResetDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Failed to Reset Password',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleResetPasswordClick = (user: UserWithRoles) => {
    setSelectedUser(user);
    setResetDialogOpen(true);
  };

  const handleEditClick = (user: UserWithRoles) => {
    setSelectedUser(user);
    const primaryRole = user.user_roles[0]?.role || 'agent';
    editForm.reset({
      fullName: user.full_name || '',
      phone: user.phone || '',
      role: primaryRole === 'admin' ? 'admin' : 'agent',
      isActive: user.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: UserWithRoles) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const onEditUser = async (values: EditUserForm) => {
    if (!selectedUser) return;
    
    setIsUpdating(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          userId: selectedUser.id,
          fullName: values.fullName,
          phone: values.phone,
          role: values.role,
          isActive: values.isActive,
        },
      });

      const errMsg = getFunctionError(data, error);
      if (errMsg) throw new Error(errMsg);

      toast({
        title: 'User Updated',
        description: `${values.fullName} has been successfully updated.`,
      });

      setEditDialogOpen(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Update user error:', error);
      toast({
        title: 'Failed to Update User',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedUser.id },
      });

      const errMsg = getFunctionError(data, error);
      if (errMsg) throw new Error(errMsg);

      toast({
        title: 'User Deleted',
        description: `${selectedUser.full_name} has been successfully deleted.`,
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      toast({
        title: 'Failed to Delete User',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">User Management</h1>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need admin privileges to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div data-tour="users-header" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Users</h1>
          <p className="text-muted-foreground">
            Create and manage application users
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetCreateDialog(); }}>
            <DialogTrigger asChild>
              <Button size="lg" className="font-bold text-base" data-tour="add-user-button">
                <UserPlus className="h-5 w-5 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => { if (createStep !== 'details') e.preventDefault(); }}>
            <DialogHeader>
              <DialogTitle>
                {createStep === 'details' && 'Create New User'}
                {createStep === 'phone-otp' && 'Verify Phone Number'}
                {createStep === 'email-otp' && 'Verify Email Address'}
              </DialogTitle>
              <DialogDescription>
                {createStep === 'details' && 'Add a new user with their details and role.'}
                {createStep === 'phone-otp' && (
                  <>Enter the 6-digit OTP sent via WhatsApp to <strong>{savedFormValues?.phone}</strong></>
                )}
                {createStep === 'email-otp' && (
                  <>Enter the 6-digit OTP sent to <strong>{savedFormValues?.email}</strong></>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Progress indicator */}
            {createStep !== 'details' && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`flex items-center gap-1 ${phoneVerified ? 'text-green-600' : 'text-primary'}`}>
                  <Phone className="h-3 w-3" />
                  {phoneVerified ? <CheckCircle2 className="h-3 w-3" /> : <span>Phone</span>}
                </div>
                <span>→</span>
                <div className={`flex items-center gap-1 ${emailVerified ? 'text-green-600' : createStep === 'email-otp' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Mail className="h-3 w-3" />
                  {emailVerified ? <CheckCircle2 className="h-3 w-3" /> : <span>Email</span>}
                </div>
                <span>→</span>
                <span className={isCreating ? 'text-primary' : 'text-muted-foreground'}>Create</span>
              </div>
            )}

            {/* Step 1: Details */}
            {createStep === 'details' && (
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (WhatsApp)</FormLabel>
                        <FormControl>
                          <Input placeholder="9876543210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" onClick={handleDetailsSubmit} disabled={isSendingOtp}>
                      {isSendingOtp ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP...</>
                      ) : (
                        'Verify & Create'
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </Form>
            )}

            {/* Step 2: Phone OTP */}
            {createStep === 'phone-otp' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={phoneOtp} onChange={setPhoneOtp}>
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
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resendCooldown > 0 || isSendingOtp}
                    onClick={() => sendOtp('whatsapp')}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </Button>
                  <Button
                    disabled={phoneOtp.length !== 6 || isVerifyingOtp}
                    onClick={() => verifyOtp('whatsapp')}
                  >
                    {isVerifyingOtp ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                    ) : (
                      'Verify Phone'
                    )}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="w-full" onClick={() => { setCreateStep('details'); setPhoneOtp(''); }}>
                  Back to details
                </Button>
              </div>
            )}

            {/* Step 3: Email OTP */}
            {createStep === 'email-otp' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={emailOtp} onChange={setEmailOtp}>
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
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resendCooldown > 0 || isSendingOtp}
                    onClick={() => sendOtp('email')}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </Button>
                  <Button
                    disabled={emailOtp.length !== 6 || isVerifyingOtp || isCreating}
                    onClick={() => verifyOtp('email')}
                  >
                    {isVerifyingOtp || isCreating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isCreating ? 'Creating...' : 'Verifying...'}</>
                    ) : (
                      'Verify & Create'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedUser?.full_name || 'user'}
            </DialogDescription>
          </DialogHeader>
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
              <FormField
                control={resetPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={resetPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isResettingPassword}>
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {selectedUser?.full_name || 'user'}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {field.value ? 'User can access the system' : 'User is deactivated'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.full_name}</strong>? 
              This action cannot be undone. All data associated with this user will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User List
          </CardTitle>
          <CardDescription>
            All application users and their assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading State */}
          {isLoadingUsers && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingUsers && filteredUsers.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {searchQuery ? 'No users found matching your search.' : 'No users have been created yet. Click "Create New User" to add your first user.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Desktop Table View */}
          {!isLoadingUsers && filteredUsers.length > 0 && (
            <>
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || 'Unknown User'}
                        </TableCell>
                        <TableCell>{u.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={u.is_active ? 'default' : 'secondary'}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.user_roles.map((ur, idx) => (
                              <Badge
                                key={idx}
                                variant={getRoleBadgeVariant(ur.role)}
                              >
                                {ROLE_DISPLAY_NAMES[ur.role] || ur.role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(u)}
                              title="Edit User"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetPasswordClick(u)}
                              title="Reset Password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(u)}
                              title="Delete User"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedUsers.map((u) => (
                  <Card key={u.id}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{u.full_name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{u.phone || '-'}</p>
                        </div>
                        <Badge variant={u.is_active ? 'default' : 'secondary'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {u.user_roles.map((ur, idx) => (
                            <Badge
                              key={idx}
                              variant={getRoleBadgeVariant(ur.role)}
                            >
                              {ROLE_DISPLAY_NAMES[ur.role] || ur.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(u)}
                          className="flex-1"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPasswordClick(u)}
                          className="flex-1"
                        >
                          <KeyRound className="h-4 w-4 mr-2" />
                          Password
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(u)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex} to {endIndex} of {totalItems} users
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={previousPage}
                          className={!canGoPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => goToPage(i + 1)}
                            isActive={currentPage === i + 1}
                            className="cursor-pointer"
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={nextPage}
                          className={!canGoNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}