import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { toast } from 'sonner';
import { Loader2, Database, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function DemoDataLoader() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadDemoData = async () => {
    setLoading(true);
    try {
      toast.info('Generating demo data...', { duration: 3000 });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('seed-demo-data', {
        body: { reset: false }
      });

      if (error) throw error;

      // Populate IndexedDB with demo data
      if (data.demoData) {
        await db.customers.bulkAdd(data.demoData.contacts);
        await db.visits.bulkAdd(data.demoData.visits);
        await db.photos.bulkAdd(data.demoData.photos.map((p: any) => ({
          ...p,
          blob: new Blob() // Placeholder since we can't store actual images easily
        })));
        await db.communications.bulkAdd(data.demoData.communications);

        toast.success(
          `Demo data loaded! Created ${data.results.users} users, ${data.results.contacts} contacts, ${data.results.visits} visits`,
          { duration: 5000 }
        );
        
        // Show login credentials
        console.log('Demo User Credentials:', data.users);
        toast.info('Check console for demo user login credentials', { duration: 3000 });
      }

      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('Error loading demo data:', error);
      toast.error('Failed to load demo data. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const clearDemoData = async () => {
    setClearing(true);
    try {
      toast.info('Clearing demo data...');

      // Clear IndexedDB
      await db.customers.clear();
      await db.visits.clear();
      await db.photos.clear();
      await db.communications.clear();
      await db.syncQueue.clear();
      await db.formResponses.clear();

      toast.success('Demo data cleared successfully');
      
      // Reload page
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error clearing demo data:', error);
      toast.error('Failed to clear demo data');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Data Management</CardTitle>
        <CardDescription>
          Load or clear demo data for testing and presentation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={loadDemoData}
            disabled={loading || clearing}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Demo Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Load Demo Data
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Creates 20 users, 100 contacts, 300 visits with photos and forms. Password: Demo@123
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={loading || clearing}
              className="w-full"
              size="lg"
            >
              {clearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Demo Data
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all contacts, visits, photos, and communications from your local database.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearDemoData}>
                Clear All Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}