import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingBag, FileText, Wallet, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useImageParser } from '@/hooks/useImageParser';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db';
import { AgentSelector } from '@/components/AgentSelector';

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const { currentOrganization } = useAuthStore();

  // Agent selector for managers/admins
  const [onBehalfUserId, setOnBehalfUserId] = useState<string | null>(null);

  // Image parser
  const { parseImage, isLoading: isParsing } = useImageParser();

  // Order scan state
  const orderFileRef = useRef<HTMLInputElement>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);

  // Invoice scan state
  const invoiceFileRef = useRef<HTMLInputElement>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);

  // Collection state
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionCustomer, setCollectionCustomer] = useState('');
  const [savingCollection, setSavingCollection] = useState(false);
  const receiptFileRef = useRef<HTMLInputElement>(null);

  // --- Order handlers ---
  const handleScanOrder = () => {
    orderFileRef.current?.click();
  };

  const handleOrderFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseImage(file, 'order');
    if (result) {
      setOrderData(result);
      setShowOrderDialog(true);
    } else {
      toast.error('Could not read the order. Try again with better lighting.');
    }
    if (orderFileRef.current) orderFileRef.current.value = '';
  };

  const handleSaveOrder = async () => {
    if (!orderData) return;
    setSavingOrder(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const orderId = crypto.randomUUID();
      const orderRecord = {
        id: orderId,
        user_id: onBehalfUserId || user?.id || null,
        items_text: orderData.items_text || orderData.items || '',
        total_amount: parseFloat(orderData.total_amount || orderData.total || '0') || 0,
        notes: orderData.notes || '',
        organization_id: currentOrganization?.id || null,
        created_at: new Date().toISOString(),
      };

      if (navigator.onLine) {
        const { error } = await supabase.from('orders').insert(orderRecord);
        if (error) throw error;
      } else {
        await db.orders.add({ ...orderRecord, synced: false });
        await db.syncQueue.add({
          id: crypto.randomUUID(),
          type: 'order',
          entityId: orderId,
          action: 'create',
          data: orderRecord,
          priority: 2,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
        });
      }

      setShowOrderDialog(false);
      setOrderData(null);
      toast.success('Order saved!');
    } catch (err: any) {
      console.error('Save order error:', err);
      toast.error('Failed to save order');
    } finally {
      setSavingOrder(false);
    }
  };

  // --- Invoice handlers ---
  const handleScanInvoice = () => {
    invoiceFileRef.current?.click();
  };

  const handleInvoiceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseImage(file, 'invoice');
    if (result) {
      setInvoiceData(result);
      setShowInvoiceDialog(true);
    } else {
      toast.error('Could not read the invoice. Try again with better lighting.');
    }
    if (invoiceFileRef.current) invoiceFileRef.current.value = '';
  };

  const handleSaveInvoice = async () => {
    if (!invoiceData) return;
    setSavingInvoice(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const invoiceId = crypto.randomUUID();
      const invoiceRecord = {
        id: invoiceId,
        user_id: onBehalfUserId || user?.id || null,
        extracted_data: invoiceData,
        amount: parseFloat(invoiceData.total || invoiceData.amount || '0') || 0,
        organization_id: currentOrganization?.id || null,
        created_at: new Date().toISOString(),
      };

      if (navigator.onLine) {
        const { error } = await supabase.from('field_invoices').insert(invoiceRecord);
        if (error) throw error;
      } else {
        await db.fieldInvoices.add({ ...invoiceRecord, synced: false });
        await db.syncQueue.add({
          id: crypto.randomUUID(),
          type: 'field_invoice',
          entityId: invoiceId,
          action: 'create',
          data: invoiceRecord,
          priority: 2,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
        });
      }

      setShowInvoiceDialog(false);
      setInvoiceData(null);
      toast.success('Invoice saved!');
    } catch (err: any) {
      console.error('Save invoice error:', err);
      toast.error('Failed to save invoice');
    } finally {
      setSavingInvoice(false);
    }
  };

  // --- Collection handlers ---
  const handleNewCollection = () => {
    setCollectionAmount('');
    setCollectionDescription('');
    setCollectionCustomer('');
    setShowCollectionDialog(true);
  };

  const handleReceiptScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseImage(file, 'receipt');
    if (result) {
      if (result.amount) setCollectionAmount(String(result.amount));
      if (result.description) setCollectionDescription(result.description);
      toast.success('Receipt scanned! Amount auto-filled.');
    } else {
      toast.error('Could not read the receipt.');
    }
    if (receiptFileRef.current) receiptFileRef.current.value = '';
  };

  const handleSaveCollection = async () => {
    if (!collectionAmount) {
      toast.error('Please enter an amount');
      return;
    }
    setSavingCollection(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const collectionId = crypto.randomUUID();
      const collectionRecord = {
        id: collectionId,
        user_id: onBehalfUserId || user?.id || null,
        amount: parseFloat(collectionAmount) || 0,
        description: collectionDescription || null,
        organization_id: currentOrganization?.id || null,
        created_at: new Date().toISOString(),
      };

      if (navigator.onLine) {
        const { error } = await supabase.from('collections').insert(collectionRecord);
        if (error) throw error;
      } else {
        await db.collections.add({ ...collectionRecord, synced: false });
        await db.syncQueue.add({
          id: crypto.randomUUID(),
          type: 'collection',
          entityId: collectionId,
          action: 'create',
          data: collectionRecord,
          priority: 2,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date(),
        });
      }

      setShowCollectionDialog(false);
      toast.success('Collection recorded!');
    } catch (err: any) {
      console.error('Save collection error:', err);
      toast.error('Failed to save collection');
    } finally {
      setSavingCollection(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          Orders
        </h1>
        <p className="text-muted-foreground">Orders, invoices, and collections</p>
      </div>

      {/* Agent selector for managers/admins */}
      <AgentSelector onAgentChange={(userId) => setOnBehalfUserId(userId)} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-1">
            <FileText className="h-4 w-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-1">
            <Wallet className="h-4 w-4" /> Collections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">Capture Orders</h3>
              <p className="text-sm text-muted-foreground mb-4">Snap a photo of a handwritten or printed order to capture it instantly</p>
              <Button onClick={handleScanOrder} disabled={isParsing}>
                <Camera className="h-4 w-4 mr-2" />{isParsing && activeTab === 'orders' ? 'Scanning...' : 'Scan Order'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">Scan Invoices</h3>
              <p className="text-sm text-muted-foreground mb-4">Take a photo of an invoice to automatically extract details</p>
              <Button onClick={handleScanInvoice} disabled={isParsing}>
                <Camera className="h-4 w-4 mr-2" />{isParsing && activeTab === 'invoices' ? 'Scanning...' : 'Scan Invoice'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="collections" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <h3 className="font-semibold mb-1">Record Collections</h3>
              <p className="text-sm text-muted-foreground mb-4">Record payment received with optional receipt photo</p>
              <Button onClick={handleNewCollection}>
                <Wallet className="h-4 w-4 mr-2" />New Collection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden file inputs */}
      <input ref={orderFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleOrderFileSelected} />
      <input ref={invoiceFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInvoiceFileSelected} />
      <input ref={receiptFileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptScan} />

      {/* Order Scan Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanned Order</DialogTitle>
          </DialogHeader>
          {orderData && (
            <div className="space-y-3">
              <div>
                <Label>Items</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={orderData.items_text || orderData.items || ''}
                  onChange={e => setOrderData({...orderData, items_text: e.target.value})}
                />
              </div>
              <div>
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  value={orderData.total_amount || orderData.total || ''}
                  onChange={e => setOrderData({...orderData, total_amount: e.target.value})}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={orderData.notes || ''}
                  onChange={e => setOrderData({...orderData, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveOrder} disabled={savingOrder}>
              {savingOrder ? 'Saving...' : 'Save Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Scan Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanned Invoice</DialogTitle>
          </DialogHeader>
          {invoiceData && (
            <div className="space-y-3">
              <div>
                <Label>Vendor</Label>
                <Input
                  value={invoiceData.vendor || invoiceData.seller || ''}
                  onChange={e => setInvoiceData({...invoiceData, vendor: e.target.value})}
                />
              </div>
              <div>
                <Label>Items</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={typeof invoiceData.items === 'string' ? invoiceData.items : JSON.stringify(invoiceData.items || [], null, 2)}
                  onChange={e => setInvoiceData({...invoiceData, items: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Total</Label>
                  <Input
                    type="number"
                    value={invoiceData.total || invoiceData.amount || ''}
                    onChange={e => setInvoiceData({...invoiceData, total: e.target.value})}
                  />
                </div>
                <div>
                  <Label>GST</Label>
                  <Input
                    value={invoiceData.gst || invoiceData.tax || ''}
                    onChange={e => setInvoiceData({...invoiceData, gst: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveInvoice} disabled={savingInvoice}>
              {savingInvoice ? 'Saving...' : 'Save Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collection Dialog */}
      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Customer Name (optional)</Label>
              <Input
                value={collectionCustomer}
                onChange={e => setCollectionCustomer(e.target.value)}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={collectionAmount}
                onChange={e => setCollectionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={collectionDescription}
                onChange={e => setCollectionDescription(e.target.value)}
                placeholder="Payment for..."
              />
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => receiptFileRef.current?.click()} disabled={isParsing}>
                <Camera className="h-4 w-4 mr-2" />
                {isParsing ? 'Scanning...' : 'Scan Receipt (auto-fill amount)'}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCollection} disabled={savingCollection}>
              {savingCollection ? 'Saving...' : 'Save Collection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
