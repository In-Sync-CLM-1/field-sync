import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer } from '@/hooks/useCustomers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Navigation,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, isLoading } = useCustomer(id);

  const handleCall = () => {
    if (!customer?.phone) return;
    window.location.href = `tel:${customer.phone}`;
    toast.info('Opening phone dialer...');
  };

  const handleWhatsApp = () => {
    if (!customer?.phone) return;
    const cleanPhone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
    toast.info('Opening WhatsApp...');
  };

  const handleEmail = () => {
    if (!customer?.email) return;
    window.location.href = `mailto:${customer.email}`;
    toast.info('Opening email...');
  };

  const handleNavigate = () => {
    if (!customer?.latitude || !customer?.longitude) {
      toast.error('Location not available');
      return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`;
    window.open(url, '_blank');
  };

  const handleStartVisit = () => {
    navigate(`/visits/new?customerId=${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container py-6">
        <Button variant="ghost" onClick={() => navigate('/contacts')}>
          <ArrowLeft />
          Back to Contacts
        </Button>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">Customer not found</p>
            <p className="text-sm text-muted-foreground">
              This customer may have been deleted or doesn't exist
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/contacts')}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{customer.name}</CardTitle>
          {customer.company_name && (
            <CardDescription>{customer.company_name}</CardDescription>
          )}
          {customer.city && (
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {customer.city}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}
          </div>

          <Separator />

          {customer.tags && customer.tags.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                {customer.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Separator />
            </>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="icon" onClick={handleCall} disabled={!customer.phone}>
              <Phone />
            </Button>
            <Button variant="outline" size="icon" onClick={handleWhatsApp} disabled={!customer.phone}>
              <MessageSquare />
            </Button>
            <Button variant="outline" size="icon" onClick={handleEmail} disabled={!customer.email}>
              <Mail />
            </Button>
          </div>
        </CardContent>
      </Card>

      {(customer.latitude && customer.longitude) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
            <CardDescription>
              {customer.latitude.toFixed(6)}, {customer.longitude.toFixed(6)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={handleNavigate}>
              <Navigation />
              Get Directions
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visit History</CardTitle>
          <CardDescription>Recent visits to this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No visits yet. Start your first visit below.
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleStartVisit}>
        <Calendar />
        Start Visit
      </Button>
    </div>
  );
}
