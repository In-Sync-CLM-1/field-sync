import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLeads } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CSVLead {
  branch?: string;
  leadId?: string;
  customerId?: string;
  status?: string;
  assignTo?: string;
  entityName?: string;
  name: string;
  loanAmount?: number;
  loanPurpose?: string;
  villageCity?: string;
  district?: string;
  state?: string;
  customerResponse?: string;
  mobileNo?: string;
  followUpDate?: string;
  leadSource?: string;
  latitude?: number;
  longitude?: number;
}

const CSV_TEMPLATE = `branch,leadId,customerId,status,entityName,name,loanAmount,loanPurpose,villageCity,district,state,customerResponse,mobileNo,followUpDate,leadSource,latitude,longitude
MUM-001,LD-001,CUST-001,new,ABC Corp,John Doe,500000,Business Expansion,Andheri,Mumbai,Maharashtra,Interested,+91-9876543210,2025-01-15,Web Form,19.0760,72.8777
DEL-002,LD-002,CUST-002,approved,XYZ Ltd,Jane Smith,250000,Working Capital,Connaught Place,New Delhi,Delhi,Approved,+91-9876543211,2025-01-20,Referral,28.6139,77.2090`;

export function LeadsUpload() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bulkAddLeads } = useLeads();
  const { currentOrganization } = useAuthStore();

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const parseCSV = (text: string): CSVLead[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const leads: CSVLead[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 1 || !values[0]) continue;

      const lead: CSVLead = {
        branch: values[headers.indexOf('branch')] || undefined,
        leadId: values[headers.indexOf('leadId')] || undefined,
        customerId: values[headers.indexOf('customerId')] || undefined,
        status: values[headers.indexOf('status')] || 'new',
        entityName: values[headers.indexOf('entityName')] || undefined,
        name: values[headers.indexOf('name')] || '',
        loanAmount: values[headers.indexOf('loanAmount')] ? parseFloat(values[headers.indexOf('loanAmount')]) : undefined,
        loanPurpose: values[headers.indexOf('loanPurpose')] || undefined,
        villageCity: values[headers.indexOf('villageCity')] || undefined,
        district: values[headers.indexOf('district')] || undefined,
        state: values[headers.indexOf('state')] || undefined,
        customerResponse: values[headers.indexOf('customerResponse')] || undefined,
        mobileNo: values[headers.indexOf('mobileNo')] || undefined,
        followUpDate: values[headers.indexOf('followUpDate')] || undefined,
        leadSource: values[headers.indexOf('leadSource')] || undefined,
        latitude: values[headers.indexOf('latitude')] ? parseFloat(values[headers.indexOf('latitude')]) : undefined,
        longitude: values[headers.indexOf('longitude')] ? parseFloat(values[headers.indexOf('longitude')]) : undefined,
      };

      if (lead.name) {
        leads.push(lead);
      }
    }

    return leads;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentOrganization?.id) {
      toast.error('Please select an organization first');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const leads = parseCSV(text);

      if (leads.length === 0) {
        toast.error('No valid leads found in CSV');
        return;
      }

      const validLeads = leads.filter(l => l.name && l.name.trim() !== '');
      if (validLeads.length === 0) {
        toast.error('All leads must have a name');
        return;
      }

      await bulkAddLeads(validLeads.map(l => ({
        name: l.name,
        branch: l.branch,
        leadId: l.leadId,
        customerId: l.customerId,
        status: l.status || 'new',
        entityName: l.entityName,
        loanAmount: l.loanAmount,
        loanPurpose: l.loanPurpose,
        villageCity: l.villageCity,
        district: l.district,
        state: l.state,
        customerResponse: l.customerResponse,
        mobileNo: l.mobileNo,
        followUpDate: l.followUpDate,
        leadSource: l.leadSource,
        latitude: l.latitude,
        longitude: l.longitude,
        organizationId: currentOrganization.id,
      })));

      toast.success(`Imported ${validLeads.length} leads`);
      setOpen(false);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import leads');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-3 w-3 mr-1" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Leads</DialogTitle>
          <DialogDescription>
            Import leads from a CSV file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">CSV Template</p>
              <p className="text-xs text-muted-foreground">
                Download the template to see the required format
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-1" />
              Template
            </Button>
          </div>

          <div className="border-t pt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              className="w-full" 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || !currentOrganization}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </>
              )}
            </Button>
            {!currentOrganization && (
              <p className="text-xs text-destructive mt-2 text-center">
                Please select an organization first
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Required columns:</p>
            <p>• name (required)</p>
            <p className="font-medium mt-2">Optional columns:</p>
            <p>• branch, leadId, customerId, status, entityName, loanAmount, loanPurpose, villageCity, district, state, customerResponse, mobileNo, followUpDate, leadSource, latitude, longitude</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
