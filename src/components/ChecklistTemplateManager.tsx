import { useState } from 'react';
import { useChecklistTemplates } from '@/hooks/useVisits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ClipboardList, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ChecklistTemplateManager() {
  const { templates, isLoading, createTemplate, deleteTemplate, isCreating } = useChecklistTemplates();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [items, setItems] = useState<{ label: string; required: boolean }[]>([
    { label: '', required: false },
  ]);

  const addItem = () => setItems([...items, { label: '', required: false }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: 'label' | 'required', value: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const handleCreate = () => {
    const validItems = items.filter((i) => i.label.trim());
    if (!name.trim() || validItems.length === 0) return;
    createTemplate(
      { name: name.trim(), items: validItems },
      {
        onSuccess: () => {
          setOpen(false);
          setName('');
          setItems([{ label: '', required: false }]);
        },
      } as any
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Checklist Templates
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-3 w-3" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Checklist Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Visit" />
                </div>
                <div>
                  <Label className="mb-2 block">Items</Label>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={item.label}
                          onChange={(e) => updateItem(idx, 'label', e.target.value)}
                          placeholder="Task description"
                          className="flex-1 h-8 text-sm"
                        />
                        <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                          <Checkbox
                            checked={item.required}
                            onCheckedChange={(v) => updateItem(idx, 'required', v)}
                          />
                          Req
                        </label>
                        {items.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={addItem}>
                    <Plus className="h-3 w-3" />
                    Add Item
                  </Button>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!name.trim() || items.every((i) => !i.label.trim()) || isCreating}
                  className="w-full"
                >
                  {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="text-sm font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">{tpl.items.length} items</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {tpl.items.filter((i) => i.required).length} required
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTemplate(tpl.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
