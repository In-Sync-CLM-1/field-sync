import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Loader2, Radio } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/services/logger';

interface ConnectionResult {
  success: boolean;
  status?: number;
  baseUrl?: string;
  message: string;
  error?: string;
  sampleData?: any;
}

export function CrmConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);

  const testConnection = async () => {
    const testId = logger.generateId();
    logger.setCorrelationId(testId);
    setTesting(true);
    setResult(null);

    logger.info('Testing CRM connection', 'CrmConnectionTest', { testId });
    logger.addBreadcrumb('CRM: Connection test started');

    try {
      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: { action: 'test_connection' }
      });

      if (error) {
        logger.error('CRM connection test failed', 'CrmConnectionTest', error, { testId });
        throw error;
      }

      logger.info('CRM connection test completed', 'CrmConnectionTest', { 
        testId,
        success: data.success,
        endpoint: data.workingEndpoint 
      });

      setResult(data);
      
      if (data.success) {
        toast.success('CRM connection successful!');
      } else {
        toast.error('CRM connection failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to test connection';
      logger.error('Connection test error', 'CrmConnectionTest', error as Error, { testId });
      
      setResult({
        success: false,
        message: 'Connection test failed',
        error: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          CRM Connection Test
        </CardTitle>
        <CardDescription>
          Verify that your CRM API credentials and base URL are configured correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="font-medium">
                  {result.message}
                </AlertDescription>
                
                {result.baseUrl && (
                  <div className="text-sm opacity-90">
                    <span className="font-semibold">Base URL:</span> {result.baseUrl}
                  </div>
                )}

                {result.status && (
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    HTTP {result.status}
                  </Badge>
                )}

                {result.error && (
                  <div className="text-sm mt-2 p-2 bg-background/50 rounded border">
                    <span className="font-semibold">Error:</span> {result.error}
                  </div>
                )}

                {result.success && result.sampleData && (
                  <details className="text-sm mt-2">
                    <summary className="cursor-pointer font-semibold">
                      View sample response
                    </summary>
                    <pre className="mt-2 p-2 bg-background/50 rounded border overflow-auto text-xs">
                      {JSON.stringify(result.sampleData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-semibold">Troubleshooting tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Verify CRM_BASE_URL is correct (e.g., https://api.yourcrm.com/v1)</li>
            <li>Ensure CRM_API_KEY has proper permissions</li>
            <li>Check that the /contacts endpoint exists in your CRM API</li>
            <li>Review the CRM API documentation for authentication requirements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
