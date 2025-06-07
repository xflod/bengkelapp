
"use client";

import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, SupplierOrder, SupplierOrderItem, SupplierOrderStatus } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { Search, FilterX, CheckSquare, AlertTriangle } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });


export default function GoodsReceiptPage() {
  const { toast } = useToast();
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [supplierOrdersList, setSupplierOrdersList] = useState<SupplierOrder[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null);
  const [itemReceiptDetails, setItemReceiptDetails] = useState<Record<string, { quantityReceivedThisSession: string; actualCostPriceThisSession: string }>>({});
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState('');
  const [currentReceivingNotes, setCurrentReceivingNotes] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  const [filterOrderId, setFilterOrderId] = useState('');
  const [filterSupplierName, setFilterSupplierName] = useState('');

  const goodsReceiptDialogTitleId = useId();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: invData, error: invError } = await supabase.from('products').select('*').neq('category', 'Jasa');
      if (invError) {
        console.error("Error fetching products for goods receipt (raw):", JSON.stringify(invError, null, 2));
        let detailedMessage = "Gagal memuat produk dari server.";
        if (invError.message) {
          detailedMessage = invError.message;
        } else if (typeof invError === 'object' && invError !== null && Object.keys(invError).length === 0) {
          detailedMessage = "Query produk berhasil namun tidak ada data yang dikembalikan, atau akses ditolak. Periksa RLS Supabase untuk 'products'.";
        } else if (typeof invError === 'object' && invError !== null) {
          detailedMessage = `Terjadi kesalahan: ${JSON.stringify(invError)}. Periksa RLS Supabase.`;
        }
        toast({ variant: "destructive", title: "Kesalahan Database Produk", description: detailedMessage });
        throw invError;
      }
      const transformedInvData = invData.map(p => ({ 
          ...p, 
          id: String(p.id),
          sellingPrices: typeof p.selling_prices === 'string' ? JSON.parse(p.selling_prices) : p.selling_prices,
          costPrice: p.cost_price,
          stockQuantity: p.stock_quantity,
          lowStockThreshold: p.low_stock_threshold,
          isActive: p.is_active,
        }));
      setInventoryProducts(transformedInvData as Product[]);

      const { data: orderData, error: orderError } = await supabase.from('supplier_orders').select('*')
        .in('status', ['Dipesan ke Supplier', 'Sebagian Diterima'])
        .order('order_date', { ascending: false });
      if (orderError) {
        console.error("Error fetching supplier orders (raw):", JSON.stringify(orderError, null, 2));
        let detailedMessage = "Gagal memuat order supplier dari server.";
        if (orderError.message) {
          detailedMessage = orderError.message;
        } else if (typeof orderError === 'object' && orderError !== null && Object.keys(orderError).length === 0) {
          detailedMessage = "Query order berhasil namun tidak ada data yang dikembalikan, atau akses ditolak. Periksa RLS Supabase untuk 'supplier_orders'.";
        } else if (typeof orderError === 'object' && orderError !== null) {
          detailedMessage = `Terjadi kesalahan: ${JSON.stringify(orderError)}. Periksa RLS Supabase.`;
        }
        toast({ variant: "destructive", title: "Kesalahan Database Order", description: detailedMessage });
        throw orderError;
      }
      const transformedOrderData = orderData.map(so => ({
        ...so,
        id: String(so.id),
        items: typeof so.items === 'string' ? JSON.parse(so.items) : so.items,
        orderDate: so.order_date,
        totalOrderQuantity: so.total_order_quantity,
        supplierName: so.supplier_name,
        receivedDate: so.received_date,
        invoiceNumber: so.invoice_number,
        receivingNotes: so.receiving_notes,
        createdAt: so.created_at,
        updatedAt: so.updated_at,
      }));
      setSupplierOrdersList(transformedOrderData as SupplierOrder[]);
    } catch (error: any) {
      if (!toast.toasts.find(t => t.title?.toString().includes("Kesalahan Database"))) {
        toast({ variant: "destructive", title: "Gagal Memuat Data Awal", description: "Terjadi kesalahan umum." });
      }
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const relevantOrders = useMemo(() => {
    return supplierOrdersList.filter(order => {
      const orderIdString = typeof order.id === 'number' ? order.id.toString() : order.id;
      const matchesOrderId = filterOrderId ? orderIdString.toLowerCase().includes(filterOrderId.toLowerCase()) : true;
      const matchesSupplierName = filterSupplierName ? (order.supplierName || '').toLowerCase().includes(filterSupplierName.toLowerCase()) : true;
      return matchesOrderId && matchesSupplierName;
    }).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [supplierOrdersList, filterOrderId, filterSupplierName]);

  const handleOpenReceiptDialog = (order: SupplierOrder) => {
    setSelectedOrder(order);
    const initialDetails: Record<string, { quantityReceivedThisSession: string; actualCostPriceThisSession: string }> = {};
    order.items.forEach(item => {
      const productInInventory = inventoryProducts.find(p => p.id === item.productId);
      const remainingToReceive = item.orderQuantity - (item.quantityReceived || 0);
      initialDetails[String(item.productId)] = {
        quantityReceivedThisSession: Math.max(0, remainingToReceive).toString(),
        actualCostPriceThisSession: item.actualCostPrice?.toString() || productInInventory?.costPrice.toString() || '0',
      };
    });
    setItemReceiptDetails(initialDetails);
    setCurrentInvoiceNumber(order.invoiceNumber || '');
    setCurrentReceivingNotes(order.receivingNotes || '');
  };

  const handleReceiptDetailChange = (productId: string, field: 'quantityReceivedThisSession' | 'actualCostPriceThisSession', value: string) => {
    setItemReceiptDetails(prev => ({ ...prev, [productId]: { ...prev[productId], [field]: value } }));
  };

  const handleConfirmReceipt = async () => {
    if (!selectedOrder) return;
    let sellingPricesAdjusted = false;

    try {
      const productUpdates = [];
      const updatedOrderItems = selectedOrder.items.map(item => {
        const detail = itemReceiptDetails[String(item.productId)];
        const qtyReceivedNum = parseInt(detail.quantityReceivedThisSession, 10);
        const costPriceNum = parseFloat(detail.actualCostPriceThisSession);

        if (isNaN(qtyReceivedNum) || qtyReceivedNum < 0) throw new Error(`Jml terima tdk valid u/ ${item.productName}`);
        if (isNaN(costPriceNum) || costPriceNum < 0) throw new Error(`Hrg beli tdk valid u/ ${item.productName}`);
        
        const productInInventory = inventoryProducts.find(p => p.id === item.productId);
        if (productInInventory) {
          const oldCostPrice = productInInventory.costPrice;
          const newActualCostPrice = costPriceNum;
          let currentProductSellingPrices = productInInventory.sellingPrices;

          if (newActualCostPrice > oldCostPrice) {
            const costPriceIncrease = newActualCostPrice - oldCostPrice;
            currentProductSellingPrices = currentProductSellingPrices.map(tier => ({ ...tier, price: tier.price + costPriceIncrease, }));
            sellingPricesAdjusted = true;
          }

          productUpdates.push(
            supabase.from('products')
              .update({
                stock_quantity: (productInInventory.stockQuantity || 0) + qtyReceivedNum,
                cost_price: newActualCostPrice,
                selling_prices: currentProductSellingPrices,
                updated_at: new Date().toISOString(),
              }).match({ id: item.productId })
          );
        }
        return { ...item, quantityReceived: (item.quantityReceived || 0) + qtyReceivedNum, actualCostPrice: costPriceNum };
      });

      const productUpdateResults = await Promise.all(productUpdates);
      for (const result of productUpdateResults) {
        if (result.error) throw new Error(`Gagal update produk: ${result.error.message}`);
      }

      const isOrderComplete = updatedOrderItems.every(item => (item.quantityReceived || 0) >= item.orderQuantity);
      const newOrderStatus: SupplierOrderStatus = isOrderComplete ? 'Diterima Lengkap' : 'Sebagian Diterima';

      const { error: orderUpdateError } = await supabase.from('supplier_orders')
        .update({
          items: updatedOrderItems, status: newOrderStatus, invoice_number: currentInvoiceNumber,
          receiving_notes: currentReceivingNotes, received_date: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).match({ id: selectedOrder.id });
      if (orderUpdateError) throw new Error(`Gagal update order: ${orderUpdateError.message}`);

      let toastDescription = `Stok & harga modal diupdate. Status: ${newOrderStatus}.`;
      if (sellingPricesAdjusted) toastDescription += " Harga jual disesuaikan.";
      toast({ title: "Penerimaan Berhasil", description: toastDescription });
      fetchInitialData(); 
      setSelectedOrder(null);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Konfirmasi Penerimaan", description: error.message });
    }
  };

  const getStatusBadgeColor = (status: SupplierOrderStatus) => { switch (status) { case 'Draf Order': return 'bg-gray-400'; case 'Dipesan ke Supplier': return 'bg-blue-500'; case 'Sebagian Diterima': return 'bg-yellow-500'; case 'Diterima Lengkap': return 'bg-green-500'; case 'Dibatalkan': return 'bg-red-500'; default: return 'bg-gray-400'; } };

  if (isLoading && inventoryProducts.length === 0 && supplierOrdersList.length === 0) { return <div className="flex justify-center items-center h-screen"><p>Memuat data...</p></div>; }

  return (
    <div className="space-y-6">
      <PageHeader title="Penerimaan Barang dari Supplier" description="Proses penerimaan barang dan update stok."/>
      <Card className="shadow-md"><CardHeader><CardTitle>Filter Order Supplier</CardTitle><div className="grid sm:grid-cols-2 gap-4 pt-2"><Input placeholder="Filter ID Order..." value={filterOrderId} onChange={(e) => setFilterOrderId(e.target.value)}/><Input placeholder="Filter Nama Supplier..." value={filterSupplierName} onChange={(e) => setFilterSupplierName(e.target.value)}/></div></CardHeader></Card>
      {relevantOrders.length === 0 && !selectedOrder ? (<Card className="text-center py-10 shadow-md border-dashed"><CardHeader className="items-center"><FilterX className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">Belum Ada Order Perlu Diproses</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Tidak ada order "Dipesan" atau "Sebagian Diterima".</p></CardContent></Card>) : (
        <Card className="shadow-md"><CardHeader><CardTitle>Order untuk Penerimaan ({relevantOrders.length})</CardTitle><CardDescription>Pilih order untuk proses penerimaan.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto max-h-[60vh]"><Table><TableHeader><TableRow><TableHead>ID Order</TableHead><TableHead>Tgl. Order</TableHead><TableHead>Supplier</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>
          {relevantOrders.map((order) => (<TableRow key={order.id}><TableCell className="font-mono text-xs">{order.id}</TableCell><TableCell>{format(parseISO(order.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })}</TableCell><TableCell>{order.supplierName || '-'}</TableCell><TableCell className="text-center"><Badge variant="default" className={`${getStatusBadgeColor(order.status)} text-white hover:${getStatusBadgeColor(order.status)}`}>{order.status}</Badge></TableCell><TableCell className="text-right"><Button onClick={() => handleOpenReceiptDialog(order)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground"><CheckSquare className="mr-2 h-4 w-4" /> Proses Terima</Button></TableCell></TableRow>))}
        </TableBody></Table></div></CardContent></Card>
      )}
      {selectedOrder && (
        <DynamicDialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
          <DynamicDialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" >
            <DynamicDialogHeader>
              <DynamicDialogTitle id={goodsReceiptDialogTitleId}>Proses Penerimaan Order: {selectedOrder.id}</DynamicDialogTitle>
              <DynamicDialogDescription>Supplier: {selectedOrder.supplierName || "N/A"} | Status: <Badge variant="default" className={`${getStatusBadgeColor(selectedOrder.status)} text-white`}>{selectedOrder.status}</Badge></DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 py-2">
              <div><Label htmlFor="invoiceNumber">No. Surat Jalan/Invoice (Opsional)</Label><Input id="invoiceNumber" value={currentInvoiceNumber} onChange={(e) => setCurrentInvoiceNumber(e.target.value)} placeholder="No. invoice"/></div>
              <h4 className="font-semibold text-md pt-2">Detail Item Diterima:</h4>
              <Table><TableHeader><TableRow><TableHead className="w-[30%]">Nama Item</TableHead><TableHead className="text-center">Dipesan</TableHead><TableHead className="text-center">Sudah Terima</TableHead><TableHead className="text-center w-[100px]">Qty Terima</TableHead><TableHead className="text-center w-[150px]">Hrg. Beli Aktual</TableHead></TableRow></TableHeader><TableBody>
                {selectedOrder.items.map(item => { const detail = itemReceiptDetails[String(item.productId)] || { quantityReceivedThisSession: '0', actualCostPriceThisSession: '0' }; const remainingToReceive = item.orderQuantity - (item.quantityReceived || 0); return (
                  <TableRow key={item.productId}><TableCell>{item.productName}<p className="text-xs text-muted-foreground font-mono">{item.sku}</p></TableCell><TableCell className="text-center">{item.orderQuantity}</TableCell><TableCell className="text-center">{item.quantityReceived || 0}</TableCell><TableCell className="text-center"><Input type="number" value={detail.quantityReceivedThisSession} onChange={(e) => handleReceiptDetailChange(String(item.productId), 'quantityReceivedThisSession', e.target.value)} className="w-20 h-8 text-center mx-auto" min="0" max={remainingToReceive.toString()} placeholder="Qty"/></TableCell><TableCell className="text-center"><Input type="number" value={detail.actualCostPriceThisSession} onChange={(e) => handleReceiptDetailChange(String(item.productId), 'actualCostPriceThisSession', e.target.value)} className="w-32 h-8 text-center mx-auto" min="0" placeholder="Harga"/></TableCell></TableRow>
                );})}
              </TableBody></Table>
              <div className="mt-4"><Label htmlFor="overallReceivingNotes">Catatan Penerimaan (Opsional)</Label><Textarea id="overallReceivingNotes" value={currentReceivingNotes} onChange={(e) => setCurrentReceivingNotes(e.target.value)} placeholder="Contoh: 1 item rusak, dus penyok." rows={2}/></div>
            </div>
            <DynamicDialogFooter className="mt-4 border-t pt-4">
              <DynamicDialogClose asChild><Button variant="outline">Batal</Button></DynamicDialogClose>
              <Button onClick={handleConfirmReceipt} className="bg-green-600 hover:bg-green-700 text-white"><CheckSquare className="mr-2 h-4 w-4" /> Konfirmasi & Update Data</Button>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}

