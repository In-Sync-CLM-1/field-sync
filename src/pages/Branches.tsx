import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Plus, MapPin, Phone, Mail, Trash2, Edit2, ArrowLeft 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useBranches } from '@/hooks/useBranches';

export default function Branches() {
  const navigate = useNavigate();
  const { branches, isLoading, createBranch, updateBranch, deleteBranch, canManageBranches } = useBranches();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '', city: '', state: '', phone: '', email: '' });
    setEditingBranch(null);
  };

  const handleSubmit = async () => {
    if (editingBranch) {
      await updateBranch.mutateAsync({ id: editingBranch.id, ...formData });
    } else {
      await createBranch.mutateAsync(formData);
    }
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      phone: branch.phone || '',
      email: branch.email || '',
    });
    setIsAddDialogOpen(true);
  };

  const handleToggleActive = async (branch: any) => {
    await updateBranch.mutateAsync({ id: branch.id, is_active: !branch.is_active });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Branches</h1>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <Building2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Branches</h1>
        </div>
      </div>

      {/* Add Button */}
      {canManageBranches && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Main Branch" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Branch Code</Label>
                    <Input id="code" value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="MB001" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Mumbai" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={formData.state} onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))} placeholder="Maharashtra" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 9876543210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="branch@example.com" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={!formData.name || createBranch.isPending || updateBranch.isPending}>
                  {editingBranch ? 'Update' : 'Create'} Branch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Branches List */}
      {branches && branches.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className={cn("transition-opacity", !branch.is_active && "opacity-60")}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{branch.name}</CardTitle>
                  </div>
                  {branch.code && <Badge variant="outline" className="text-xs">{branch.code}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {branch.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>{branch.address}{branch.city && `, ${branch.city}`}{branch.state && `, ${branch.state}`}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{branch.email}</span>
                  </div>
                )}
                
                {canManageBranches && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Switch checked={branch.is_active} onCheckedChange={() => handleToggleActive(branch)} />
                      <span className="text-xs">{branch.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEdit(branch)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{branch.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBranch.mutateAsync(branch.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No branches yet</p>
            {canManageBranches && <p className="text-xs mt-1">Click "Add Branch" to create your first branch</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
