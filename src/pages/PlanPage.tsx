import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

const PlanPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Plan
        </h1>
        <p className="text-muted-foreground">Create and assign daily plans for your team</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1 text-foreground">Plan Builder</h3>
          <p className="text-sm">Assign customers to visit for agents by date. Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanPage;
