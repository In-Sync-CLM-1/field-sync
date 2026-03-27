import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssignUserDialogProps {
  entityType: 'lead' | 'visit';
  entityId: string;
  currentAssigneeId?: string | null;
  currentAssigneeName?: string | null;
  onAssigned?: () => void;
}

interface UserOption {
  id: string;
  full_name: string | null;
}

export function AssignUserDialog({
  entityType,
  entityId,
  currentAssigneeId,
  currentAssigneeName,
  onAssigned,
}: AssignUserDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentAssigneeId || 'none');
  const [isAdmin, setIsAdmin] = useState(false);

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

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['assignable-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as UserOption[];
    },
    enabled: open && isAdmin,
  });

  const assignMutation = useMutation({
    mutationFn: async (userId: string | null) => {
      if (entityType === 'lead') {
        const { error } = await supabase
          .from('leads')
          .update({ assigned_user_id: userId })
          .eq('id', entityId);

        if (error) throw error;
      } else if (entityType === 'visit') {
        const { error } = await supabase
          .from('visits')
          .update({ user_id: userId! })
          .eq('id', entityId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`${entityType === 'lead' ? 'Prospect' : 'Visit'} assigned successfully`);
      queryClient.invalidateQueries({ queryKey: [entityType, entityId] });
      queryClient.invalidateQueries({ queryKey: [entityType + 's'] });
      setOpen(false);
      onAssigned?.();
    },
    onError: (error) => {
      console.error('Error assigning user:', error);
      toast.error(`Failed to assign ${entityType}`);
    },
  });

  const handleAssign = () => {
    const userId = selectedUserId === 'none' ? null : selectedUserId;

    if (entityType === 'visit' && !userId) {
      toast.error('Visits must be assigned to a user');
      return;
    }

    assignMutation.mutate(userId);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          {currentAssigneeName || 'Assign User'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign {entityType === 'lead' ? 'Prospect' : 'Visit'}</DialogTitle>
          <DialogDescription>
            Select a user to assign this {entityType === 'lead' ? 'prospect' : 'visit'} to.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Assign to User</Label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading users...
              </div>
            ) : (
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {entityType === 'lead' && (
                    <SelectItem value="none">Unassigned</SelectItem>
                  )}
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || 'Unnamed User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {currentAssigneeName && (
            <p className="text-sm text-muted-foreground">
              Currently assigned to: <strong>{currentAssigneeName}</strong>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assignMutation.isPending || (entityType === 'visit' && selectedUserId === 'none')}
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
