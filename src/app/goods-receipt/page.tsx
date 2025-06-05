
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, SupplierOrder, SupplierOrderItem, SupplierOrderStatus } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { Search, FilterX, CheckSquare, AlertTriangle } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: invData, error: invError } = await supabase.from('products').select('*').neq('category', 'Jasa');
      if (invError) throw invError;
      const transformedInvData = invData.map(p => ({ ...p, sellingPrices: typeof p.sellingPrices === 'string' ? JSON.parse(p.sellingPrices) : p.sellingPrices }));
      setInventoryProducts(transformedInvData as Product[]);

      const { data: orderData, error: orderError } = await supabase.from('supplierOrders').select('*')
        .in('status', ['Dipesan ke Supplier', 'Sebagian Diterima'])
        .order('orderDate', { ascending: false });
      if (orderError) throw orderError;
      setSupplierOrdersList(orderData as SupplierOrder[]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Memuat Data Awal", description: error.message });
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
      initialDetails[String(item.productId)] = { // Ensure productId is string for key
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

    // Start a transaction or use RPC for atomicity in Supabase if needed
    // For simplicity here, we'll do sequential updates and log errors.
    try {
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

          const { error: productUpdateError } = await supabase.from('products')
            .update({
              stockQuantity: (productInInventory.stockQuantity || 0) + qtyReceivedNum,
              costPrice: newActualCostPrice,
              sellingPrices: currentProductSellingPrices,
              updatedAt: new Date().toISOString(),
            }).match({ id: item.productId });
          if (productUpdateError) throw new Error(`Gagal update produk ${item.productName}: ${productUpdateError.message}`);
        }
        return { ...item, quantityReceived: (item.quantityReceived || 0) + qtyReceivedNum, actualCostPrice: costPriceNum };
      });

      const isOrderComplete = updatedOrderItems.every(item => (item.quantityReceived || 0) >= item.orderQuantity);
      const newOrderStatus: SupplierOrderStatus = isOrderComplete ? 'Diterima Lengkap' : 'Sebagian Diterima';

      const { error: orderUpdateError } = await supabase.from('supplierOrders')
        .update({
          items: updatedOrderItems, status: newOrderStatus, invoiceNumber: currentInvoiceNumber,
          receivingNotes: currentReceivingNotes, receivedDate: new Date().toISOString(), updatedAt: new Date().toISOString(),
        }).match({ id: selectedOrder.id });
      if (orderUpdateError) throw new Error(`Gagal update order: ${orderUpdateError.message}`);

      let toastDescription = `Stok & harga modal diupdate. Status: ${newOrderStatus}.`;
      if (sellingPricesAdjusted) toastDescription += " Harga jual disesuaikan.";
      toast({ title: "Penerimaan Berhasil", description: toastDescription });
      fetchInitialData(); // Refresh all data
      setSelectedOrder(null);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error Konfirmasi Penerimaan", description: error.message });
    }
  };

  const getStatusBadgeColor = (status: SupplierOrderStatus) => { /* Unchanged */ switch (status) { case 'Draf Order': return 'bg-gray-400'; case 'Dipesan ke Supplier': return 'bg-blue-500'; case 'Sebagian Diterima': return 'bg-yellow-500'; case 'Diterima Lengkap': return 'bg-green-500'; case 'Dibatalkan': return 'bg-red-500'; default: return 'bg-gray-400'; } };

  if (isLoading) { return <div className="flex justify-center items-center h-screen"><p>Memuat data...</p></div>; }

  // JSX structure remains largely the same
  return (
    <div className="space-y-6">
      <PageHeader title="Penerimaan Barang dari Supplier" description="Proses penerimaan barang dan update stok."/>
      <Card className="shadow-md"><CardHeader><CardTitle>Filter Order Supplier</CardTitle><div className="grid sm:grid-cols-2 gap-4 pt-2"><Input placeholder="Filter ID Order..." value={filterOrderId} onChange={(e) => setFilterOrderId(e.target.value)}/><Input placeholder="Filter Nama Supplier..." value={filterSupplierName} onChange={(e) => setFilterSupplierName(e.target.value)}/></div></CardHeader></Card>
      {relevantOrders.length === 0 && !selectedOrder ? (<Card className="text-center py-10 shadow-md border-dashed"><CardHeader className="items-center"><FilterX className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">Belum Ada Order Perlu Diproses</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Tidak ada order "Dipesan" atau "Sebagian Diterima".</p></CardContent></Card>) : (
        <Card className="shadow-md"><CardHeader><CardTitle>Order untuk Penerimaan ({relevantOrders.length})</CardTitle><CardDescription>Pilih order untuk proses penerimaan.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto max-h-[60vh]"><Table><TableHeader><TableRow><TableHead>ID Order</TableHead><TableHead>Tgl. Order</TableHead><TableHead>Supplier</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>
          {relevantOrders.map((order) => (<TableRow key={order.id}><TableCell className="font-mono text-xs">{order.id}</TableCell><TableCell>{format(parseISO(order.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })}</TableCell><TableCell>{order.supplierName || '-'}</TableCell><TableCell className="text-center"><Badge variant="default" className={`${getStatusBadgeColor(order.status)} text-white hover:${getStatusBadgeColor(order.status)}`}>{order.status}</Badge></TableCell><TableCell className="text-right"><Button onClick={() => handleOpenReceiptDialog(order)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground"><CheckSquare className="mr-2 h-4 w-4" /> Proses Terima</Button></TableCell></TableRow>))}
        </TableBody></Table></div></CardContent></Card>
      )}
      {selectedOrder && (<Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}><DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col"><DialogHeader><DialogTitle>Proses Penerimaan Order: {selectedOrder.id}</DialogTitle><DialogDescription>Supplier: {selectedOrder.supplierName || "N/A"} | Status: <Badge variant="default" className={`${getStatusBadgeColor(selectedOrder.status)} text-white`}>{selectedOrder.status}</Badge></DialogDescription></DialogHeader><div className="flex-grow overflow-y-auto pr-2 space-y-4 py-2"><div><Label htmlFor="invoiceNumber">No. Surat Jalan/Invoice (Opsional)</Label><Input id="invoiceNumber" value={currentInvoiceNumber} onChange={(e) => setCurrentInvoiceNumber(e.target.value)} placeholder="No. invoice"/></div><h4 className="font-semibold text-md pt-2">Detail Item Diterima:</h4><Table><TableHeader><TableRow><TableHead className="w-[30%]">Nama Item</TableHead><TableHead className="text-center">Dipesan</TableHead><TableHead className="text-center">Sudah Terima</TableHead><TableHead className="text-center w-[100px]">Qty Terima</TableHead><TableHead className="text-center w-[150px]">Hrg. Beli Aktual</TableHead></TableRow></TableHeader><TableBody>
        {selectedOrder.items.map(item => { const detail = itemReceiptDetails[String(item.productId)] || { quantityReceivedThisSession: '0', actualCostPriceThisSession: '0' }; const remainingToReceive = item.orderQuantity - (item.quantityReceived || 0); return (
          <TableRow key={item.productId}><TableCell>{item.productName}<p className="text-xs text-muted-foreground font-mono">{item.sku}</p></TableCell><TableCell className="text-center">{item.orderQuantity}</TableCell><TableCell className="text-center">{item.quantityReceived || 0}</TableCell><TableCell className="text-center"><Input type="number" value={detail.quantityReceivedThisSession} onChange={(e) => handleReceiptDetailChange(String(item.productId), 'quantityReceivedThisSession', e.target.value)} className="w-20 h-8 text-center mx-auto" min="0" max={remainingToReceive.toString()} placeholder="Qty"/></TableCell><TableCell className="text-center"><Input type="number" value={detail.actualCostPriceThisSession} onChange={(e) => handleReceiptDetailChange(String(item.productId), 'actualCostPriceThisSession', e.target.value)} className="w-32 h-8 text-center mx-auto" min="0" placeholder="Harga"/></TableCell></TableRow>
        );})}
      </TableBody></Table><div className="mt-4"><Label htmlFor="overallReceivingNotes">Catatan Penerimaan (Opsional)</Label><Textarea id="overallReceivingNotes" value={currentReceivingNotes} onChange={(e) => setCurrentReceivingNotes(e.target.value)} placeholder="Contoh: 1 item rusak, dus penyok." rows={2}/></div></div><DialogFooter className="mt-4 border-t pt-4"><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><Button onClick={handleConfirmReceipt} className="bg-green-600 hover:bg-green-700 text-white"><CheckSquare className="mr-2 h-4 w-4" /> Konfirmasi & Update Data</Button></DialogFooter></DialogContent></Dialog>)}
    </div>
  );
}
