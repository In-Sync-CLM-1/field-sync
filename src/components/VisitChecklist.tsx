import { ChecklistItem } from '@/hooks/useVisits';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';

interface Props {
  items: ChecklistItem[];
  onToggle?: (index: number) => void;
  readOnly?: boolean;
}

export function VisitChecklist({ items, onToggle, readOnly = false }: Props) {
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;

  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ClipboardCheck className="h-4 w-4" />
          Checklist
        </div>
        <Badge variant="secondary" className="text-xs">
          {completed}/{total}
        </Badge>
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <label
            key={idx}
            className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
              readOnly ? '' : 'hover:bg-accent/50 cursor-pointer'
            } ${item.completed ? 'text-muted-foreground line-through' : ''}`}
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => !readOnly && onToggle?.(idx)}
              disabled={readOnly}
            />
            <span className="flex-1">{item.label}</span>
            {item.required && !item.completed && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1">
                Required
              </Badge>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
