import { useState, useEffect } from 'react';
import { useOrderCollections, OrderCollection } from '@/hooks/useOrderCollections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Banknote, Loader2, CheckCircle2, Mail, Package, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface OrderCollectionFormProps {
  visitId: string;
  leadName?: string;
  leadPhone?: string;
  leadId?: string;
  isActive: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function SubmittedRecord({ record }: { record: OrderCollection }) {
  const isSalesOrder = record.type === 'sales_order';
  const modeLabels: Record<string, string> = {
    cash: 'Cash', cheque: 'Cheque', upi: 'UPI',
    bank_transfer: 'Bank Transfer', online: 'Online', other: 'Other',
  };

  return (
    <div className="p-3 border rounded-lg bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSalesOrder ? <Package className="h-4 w-4 text-blue-500" /> : <CreditCard className="h-4 w-4 text-green-500" />}
          <span className="font-medium text-sm">
            {isSalesOrder ? record.product_name || 'Sales Order' : 'Payment Collection'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {record.email_sent && (
            <Badge variant="outline" className="text-xs gap-1">
              <Mail className="h-3 w-3" /> Emailed
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {formatCurrency(record.total_amount)}
          </Badge>
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>{record.customer_name}{record.customer_phone ? ` • ${record.customer_phone}` : ''}</p>
        {!isSalesOrder && record.payment_mode && (
          <p>Mode: {modeLabels[record.payment_mode] || record.payment_mode}
            {record.payment_reference ? ` • Ref: ${record.payment_reference}` : ''}</p>
        )}
        {isSalesOrder && <p>Qty: {record.quantity} × {formatCurrency(record.unit_price)}</p>}
        {record.remarks && <p className="italic">"{record.remarks}"</p>}
        <p className="text-muted-foreground/70">{format(new Date(record.created_at), 'PP p')}</p>
      </div>
    </div>
  );
}

export function OrderCollectionForm({ visitId, leadName, leadPhone, leadId, isActive }: OrderCollectionFormProps) {
  const { orderCollections, isLoading, createOrderCollection, isSubmitting } = useOrderCollections(visitId);

  const [activeTab, setActiveTab] = useState<'sales_order' | 'payment_collection'>('sales_order');
  const [showForm, setShowForm] = useState(false);

  // Sales order fields
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  // Payment collection fields
  const [collectionAmount, setCollectionAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Shared fields
  const [customerName, setCustomerName] = useState(leadName || '');
  const [customerPhone, setCustomerPhone] = useState(leadPhone || '');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (leadName) setCustomerName(leadName);
    if (leadPhone) setCustomerPhone(leadPhone);
  }, [leadName, leadPhone]);

  const totalAmount = activeTab === 'sales_order'
    ? (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)
    : parseFloat(collectionAmount) || 0;

  const resetForm = () => {
    setProductName('');
    setProductDescription('');
    setQuantity('1');
    setUnitPrice('');
    setCollectionAmount('');
    setPaymentMode('');
    setPaymentReference('');
    setRemarks('');
    setShowForm(false);
  };

  const canSubmit = activeTab === 'sales_order'
    ? productName.trim() && totalAmount > 0
    : parseFloat(collectionAmount) > 0 && paymentMode;

  const handleSubmit = () => {
    if (!canSubmit) return;

    createOrderCollection(
      {
        visit_id: visitId,
        lead_id: leadId,
        type: activeTab,
        product_name: activeTab === 'sales_order' ? productName : undefined,
        product_description: activeTab === 'sales_order' ? productDescription || undefined : undefined,
        quantity: activeTab === 'sales_order' ? parseInt(quantity) || 1 : undefined,
        unit_price: activeTab === 'sales_order' ? parseFloat(unitPrice) || 0 : undefined,
        total_amount: totalAmount,
        payment_mode: activeTab === 'payment_collection' ? paymentMode : undefined,
        payment_reference: activeTab === 'payment_collection' ? paymentReference || undefined : undefined,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        remarks: remarks || undefined,
      },
      { onSuccess: resetForm }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          Orders & Collections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Previously submitted records */}
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {orderCollections.length > 0 && (
          <div className="space-y-2">
            {orderCollections.map((record) => (
              <SubmittedRecord key={record.id} record={record} />
            ))}
          </div>
        )}

        {/* Add new button or form */}
        {isActive && !showForm && (
          <Button variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
            <ShoppingCart className="h-4 w-4" />
            Book Sales Order / Collect Payment
          </Button>
        )}

        {isActive && showForm && (
          <div className="space-y-4 pt-2">
            <Separator />
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales_order" className="gap-1.5 text-xs">
                  <Package className="h-3.5 w-3.5" /> Sales Order
                </TabsTrigger>
                <TabsTrigger value="payment_collection" className="gap-1.5 text-xs">
                  <Banknote className="h-3.5 w-3.5" /> Collect Payment
                </TabsTrigger>
              </TabsList>

              {/* Sales Order Tab */}
              <TabsContent value="sales_order" className="space-y-3 pt-2">
                <div>
                  <Label>Product / Service Name *</Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Life Insurance Policy"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Unit Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {totalAmount > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</span>
                  </div>
                )}
              </TabsContent>

              {/* Payment Collection Tab */}
              <TabsContent value="payment_collection" className="space-y-3 pt-2">
                <div>
                  <Label>Amount Collected (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={collectionAmount}
                    onChange={(e) => setCollectionAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Payment Mode *</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference Number</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Cheque no., UPI ref, transaction ID..."
                  />
                </div>
                {parseFloat(collectionAmount) > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-sm font-medium">Amount Collected</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(parseFloat(collectionAmount))}</span>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Shared fields */}
            <div className="space-y-3">
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
                <div>
                  <Label>Customer Phone</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    type="tel"
                  />
                </div>
              </div>
              <div>
                <Label>Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isActive && orderCollections.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No orders or collections recorded
          </p>
        )}
      </CardContent>
    </Card>
  );
}
