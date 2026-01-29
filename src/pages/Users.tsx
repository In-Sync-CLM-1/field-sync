import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, Users, Search, UserPlus, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/usePagination';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type UserRole = {
  role: string;
};

type UserWithRoles = {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_roles: UserRole[];
};

const createUserSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['sales_officer', 'branch_manager', 'admin', 'super_admin']),
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

// Role display names for UI
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  sales_officer: 'Sales Officer',
  branch_manager: 'Branch Manager',
  admin: 'Admin',
  super_admin: 'Super Admin',
  platform_admin: 'Platform Admin',
};

// Get badge variant based on role
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'super_admin':
    case 'platform_admin':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'branch_manager':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function Forms() {
  const { user } = useAuth();
  const { currentOrganization } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'sales_officer',
    },
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Fetch users with their roles
  const { data: users = [], isLoading: isLoadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
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

      // Check if user has admin, super_admin, or platform_admin role
      const { data: isAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      const { data: isSuperAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'super_admin'
      });

      const { data: isPlatformAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'platform_admin'
      });

      setIsAdmin(!!isAdminRole || !!isSuperAdminRole || !!isPlatformAdminRole);
    }

    checkAdminRole();
  }, [user]);

  const onSubmit = async (values: CreateUserForm) => {
    setIsCreating(true);

    try {
      // Call edge function to create user (doesn't log out current admin)
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

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'User Created',
        description: `${values.fullName} has been successfully created with ${ROLE_DISPLAY_NAMES[values.role]} role.`,
      });

      form.reset();
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

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Users</h1>
          <p className="text-muted-foreground">
            Create and manage application users
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="font-bold text-base">
                <UserPlus className="h-5 w-5 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the application with their details and role.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
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
                          <SelectItem value="sales_officer">Sales Officer</SelectItem>
                          <SelectItem value="branch_manager">Branch Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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
                      <TableHead>Roles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || 'Unknown User'}
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.user_roles.map((ur, idx) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPasswordClick(user)}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <p className="font-medium">{user.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{user.phone || '-'}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {user.user_roles.map((ur, idx) => (
                            <Badge
                              key={idx}
                              variant={getRoleBadgeVariant(ur.role)}
                            >
                              {ROLE_DISPLAY_NAMES[ur.role] || ur.role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPasswordClick(user)}
                        className="w-full"
                      >
                        <KeyRound className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
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