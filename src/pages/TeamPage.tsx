import { Card, CardContent } from '@/components/ui/card';
import { UserCog } from 'lucide-react';

const TeamPage = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6" />
          Team
        </h1>
        <p className="text-muted-foreground">Manage users and product catalog</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <UserCog className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-semibold mb-1 text-foreground">Team Management</h3>
          <p className="text-sm">User management, bulk import, and product catalog. Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamPage;
