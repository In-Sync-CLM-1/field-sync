import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useContacts } from '@/hooks/useContacts';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CSVContact {
  name: string;
  applicationId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

const CSV_TEMPLATE = `name,applicationId,email,phone,address,city,state,postalCode,country,latitude,longitude,status
John Doe,APP-001,john@example.com,+91-9876543210,123 Main St,Mumbai,Maharashtra,400001,India,19.0760,72.8777,active
Jane Smith,APP-002,jane@example.com,+91-9876543211,456 Oak Ave,Delhi,Delhi,110001,India,28.6139,77.2090,active`;

export function ContactsUpload() {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { bulkAddContacts } = useContacts();
  const { currentOrganization } = useAuthStore();

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const parseCSV = (text: string): CSVContact[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const contacts: CSVContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 1 || !values[0]) continue;

      const contact: CSVContact = {
        name: values[headers.indexOf('name')] || '',
        applicationId: values[headers.indexOf('applicationId')] || undefined,
        email: values[headers.indexOf('email')] || undefined,
        phone: values[headers.indexOf('phone')] || undefined,
        address: values[headers.indexOf('address')] || undefined,
        city: values[headers.indexOf('city')] || undefined,
        state: values[headers.indexOf('state')] || undefined,
        postalCode: values[headers.indexOf('postalCode')] || undefined,
        country: values[headers.indexOf('country')] || undefined,
        latitude: values[headers.indexOf('latitude')] ? parseFloat(values[headers.indexOf('latitude')]) : undefined,
        longitude: values[headers.indexOf('longitude')] ? parseFloat(values[headers.indexOf('longitude')]) : undefined,
        status: values[headers.indexOf('status')] || 'active',
      };

      if (contact.name) {
        contacts.push(contact);
      }
    }

    return contacts;
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
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        toast.error('No valid contacts found in CSV');
        return;
      }

      const validContacts = contacts.filter(c => c.name && c.name.trim() !== '');
      if (validContacts.length === 0) {
        toast.error('All contacts must have a name');
        return;
      }

      await bulkAddContacts(validContacts.map(c => ({
        name: c.name,
        applicationId: c.applicationId,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        state: c.state,
        postalCode: c.postalCode,
        country: c.country,
        latitude: c.latitude,
        longitude: c.longitude,
        status: c.status || 'active',
        organizationId: currentOrganization.id,
      })));

      toast.success(`Imported ${validContacts.length} contacts`);
      setOpen(false);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import contacts');
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
          <DialogTitle>Upload Contacts</DialogTitle>
          <DialogDescription>
            Import contacts from a CSV file
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
            <p>• applicationId, email, phone, address, city, state, postalCode, country, latitude, longitude, status</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
