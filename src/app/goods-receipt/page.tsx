
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
import { ArchiveRestore, Search, FilterX, AlertTriangle, CheckSquare, ChevronRight } from "lucide-react";
import { format } from 'date-fns';
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

  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const isLoading = !(inventoryLoaded && ordersLoaded);

  const [filterOrderId, setFilterOrderId] = useState('');
  const [filterSupplierName, setFilterSupplierName] = useState('');

  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem('inventoryProductsBengkelKu');
      if (storedInventory) {
        const parsedInventory = JSON.parse(storedInventory);
        if (Array.isArray(parsedInventory)) {
          setInventoryProducts(
            parsedInventory.filter((p: Product) => p.category !== 'Jasa')
          );
        } else {
          console.warn('inventoryProductsBengkelKu from localStorage is not an array.');
          setInventoryProducts([]); 
        }
      } else {
        setInventoryProducts([]); 
      }
    } catch (error) {
      console.error("Failed to parse inventory from localStorage:", error);
      toast({ variant: "destructive", title: "Gagal Memuat Inventaris", description: (error as Error).message });
      setInventoryProducts([]); 
    }
    setInventoryLoaded(true);
  }, [toast]);

  useEffect(() => {
    try {
      const storedSupplierOrders = localStorage.getItem('supplierOrdersDataBengkelKu');
      if (storedSupplierOrders) {
        const parsedOrders = JSON.parse(storedSupplierOrders);
        if (Array.isArray(parsedOrders)) {
          const relevant = parsedOrders.filter(
            (order: SupplierOrder) =>
              order.status === 'Dipesan ke Supplier' ||
              order.status === 'Sebagian Diterima'
          );
          setSupplierOrdersList(relevant);
        } else {
          console.warn('supplierOrdersDataBengkelKu from localStorage is not an array.');
          setSupplierOrdersList([]);
        }
      } else {
        setSupplierOrdersList([]);
      }
    } catch (error) {
      console.error("Failed to parse supplier orders from localStorage:", error);
      toast({ variant: "destructive", title: "Gagal Memuat Riwayat Order Supplier", description: (error as Error).message });
      setSupplierOrdersList([]);
    }
    setOrdersLoaded(true);
  }, [toast]);

  const relevantOrders = useMemo(() => {
    return supplierOrdersList.filter(order => {
      const matchesOrderId = filterOrderId ? order.id.toLowerCase().includes(filterOrderId.toLowerCase()) : true;
      const matchesSupplierName = filterSupplierName ? (order.supplierName || '').toLowerCase().includes(filterSupplierName.toLowerCase()) : true;
      return matchesOrderId && matchesSupplierName;
    }).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [supplierOrdersList, filterOrderId, filterSupplierName]);

  const handleOpenReceiptDialog = (order: SupplierOrder) => {
    setSelectedOrder(order);
    const initialDetails: Record<string, { quantityReceivedThisSession: string; actualCostPriceThisSession: string }> = {};
    const invProds = inventoryProducts; // Use state directly

    order.items.forEach(item => {
      const productInInventory = invProds.find(p => p.id === item.productId);
      const remainingToReceive = item.orderQuantity - (item.quantityReceived || 0);
      initialDetails[item.productId] = {
        quantityReceivedThisSession: Math.max(0, remainingToReceive).toString(),
        actualCostPriceThisSession: item.actualCostPrice?.toString() || productInInventory?.costPrice.toString() || '0',
      };
    });
    setItemReceiptDetails(initialDetails);
    setCurrentInvoiceNumber(order.invoiceNumber || '');
    setCurrentReceivingNotes(order.receivingNotes || '');
  };

  const handleReceiptDetailChange = (productId: string, field: 'quantityReceivedThisSession' | 'actualCostPriceThisSession', value: string) => {
    setItemReceiptDetails(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      }
    }));
  };

  const handleConfirmReceipt = () => {
    if (!selectedOrder) return;

    let newInventory = [...inventoryProducts];
    let updatedOrder = { ...selectedOrder };
    let allItemsFullyReceivedForThisOrder = true;

    updatedOrder.items = updatedOrder.items.map(item => {
      const detail = itemReceiptDetails[item.productId];
      const qtyReceivedNum = parseInt(detail.quantityReceivedThisSession, 10);
      const costPriceNum = parseFloat(detail.actualCostPriceThisSession);

      if (isNaN(qtyReceivedNum) || qtyReceivedNum < 0) {
        toast({ variant: "destructive", title: "Jumlah Terima Tidak Valid", description: `Untuk item ${item.productName}, jumlah terima harus angka positif.` });
        throw new Error("Invalid quantity received"); 
      }
      if (isNaN(costPriceNum) || costPriceNum < 0) {
        toast({ variant: "destructive", title: "Harga Beli Tidak Valid", description: `Untuk item ${item.productName}, harga beli harus angka positif.` });
        throw new Error("Invalid cost price");
      }
      
      const productIndex = newInventory.findIndex(p => p.id === item.productId);
      if (productIndex > -1) {
        newInventory[productIndex] = {
          ...newInventory[productIndex],
          stockQuantity: newInventory[productIndex].stockQuantity + qtyReceivedNum,
          costPrice: costPriceNum,
          updatedAt: new Date().toISOString(),
        };
      }

      const newTotalReceivedForItem = (item.quantityReceived || 0) + qtyReceivedNum;
      if (newTotalReceivedForItem < item.orderQuantity) {
        allItemsFullyReceivedForThisOrder = false;
      }

      return {
        ...item,
        quantityReceived: newTotalReceivedForItem,
        actualCostPrice: costPriceNum,
      };
    });
    
    let newOrderStatus: SupplierOrderStatus = 'Sebagian Diterima';
    if (allItemsFullyReceivedForThisOrder) {
        newOrderStatus = 'Diterima Lengkap';
    }
    // If no items were received in this session, but some were previously, keep 'Sebagian Diterima' unless all are now complete
    const totalQtyReceivedThisSession = Object.values(itemReceiptDetails).reduce((sum, det) => sum + (parseInt(det.quantityReceivedThisSession, 10) || 0), 0);
    if (totalQtyReceivedThisSession === 0 && updatedOrder.items.every(i => (i.quantityReceived || 0) > 0 && (i.quantityReceived || 0) < i.orderQuantity)) {
        // No change in this session, but still partially received
        newOrderStatus = 'Sebagian Diterima';
    } else if (totalQtyReceivedThisSession === 0 && updatedOrder.items.every(i => (i.quantityReceived || 0) === 0)) {
        newOrderStatus = 'Dipesan ke Supplier'; // Back to original if nothing was ever received.
    }


    updatedOrder.status = newOrderStatus;
    updatedOrder.invoiceNumber = currentInvoiceNumber;
    updatedOrder.receivingNotes = currentReceivingNotes;
    updatedOrder.receivedDate = new Date().toISOString();
    updatedOrder.updatedAt = new Date().toISOString();

    setInventoryProducts(newInventory);
    localStorage.setItem('inventoryProductsBengkelKu', JSON.stringify(newInventory));

    const updatedOrdersList = supplierOrdersList.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    // We need to update the main list, and also potentially remove it from current view if it's now "Diterima Lengkap"
    const stillRelevantOrders = updatedOrdersList.filter(
        order => order.status === 'Dipesan ke Supplier' || order.status === 'Sebagian Diterima'
    );
    setSupplierOrdersList(stillRelevantOrders); 
    // Save the *full* list of orders (including the updated one which might now be complete)
    const allCurrentOrders = JSON.parse(localStorage.getItem('supplierOrdersDataBengkelKu') || '[]') as SupplierOrder[];
    const allOrdersUpdated = allCurrentOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    localStorage.setItem('supplierOrdersDataBengkelKu', JSON.stringify(allOrdersUpdated));
    

    toast({ title: "Penerimaan Berhasil Diproses", description: `Stok dan harga modal telah diperbarui. Status order: ${newOrderStatus}.` });
    setSelectedOrder(null);
  };

  const getStatusBadgeColor = (status: SupplierOrderStatus) => {
    switch (status) {
      case 'Draf Order': return 'bg-gray-400';
      case 'Dipesan ke Supplier': return 'bg-blue-500';
      case 'Sebagian Diterima': return 'bg-yellow-500';
      case 'Diterima Lengkap': return 'bg-green-500';
      case 'Dibatalkan': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data penerimaan...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penerimaan Barang dari Supplier"
        description="Proses penerimaan barang dari supplier dan update stok inventaris."
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filter Order Supplier</CardTitle>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <Input
                placeholder="Filter berdasarkan ID Order..."
                value={filterOrderId}
                onChange={(e) => setFilterOrderId(e.target.value)}
              />
              <Input
                placeholder="Filter berdasarkan Nama Supplier (jika ada)..."
                value={filterSupplierName}
                onChange={(e) => setFilterSupplierName(e.target.value)}
              />
            </div>
        </CardHeader>
      </Card>

      {relevantOrders.length === 0 && !selectedOrder ? (
        <Card className="text-center py-10 shadow-md border-dashed">
          <CardHeader className="items-center">
            <FilterX className="w-16 h-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl text-foreground">
              Belum Ada Order yang Perlu Diproses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Tidak ada order dengan status "Dipesan ke Supplier" atau "Sebagian Diterima" yang cocok dengan filter Anda.
              <br/> Buat order baru di halaman "Order Supplier".
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Order untuk Penerimaan ({relevantOrders.length})</CardTitle>
            <CardDescription>Pilih order untuk memproses penerimaan barang.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Order</TableHead>
                    <TableHead>Tgl. Order</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{format(new Date(order.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })}</TableCell>
                      <TableCell>{order.supplierName || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getStatusBadgeColor(order.status)} text-white hover:${getStatusBadgeColor(order.status)}`}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleOpenReceiptDialog(order)} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                          <CheckSquare className="mr-2 h-4 w-4" /> Proses Penerimaan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Proses Penerimaan Order: {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Supplier: {selectedOrder.supplierName || "N/A"} | Status Saat Ini: <Badge className={`${getStatusBadgeColor(selectedOrder.status)} text-white`}>{selectedOrder.status}</Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 py-2">
              <div>
                <Label htmlFor="invoiceNumber">No. Surat Jalan/Invoice Supplier (Opsional)</Label>
                <Input id="invoiceNumber" value={currentInvoiceNumber} onChange={(e) => setCurrentInvoiceNumber(e.target.value)} placeholder="Masukkan nomor invoice" />
              </div>
              
              <h4 className="font-semibold text-md pt-2">Detail Item Diterima:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Nama Item</TableHead>
                    <TableHead className="text-center">Dipesan</TableHead>
                    <TableHead className="text-center">Sudah Diterima (Order Ini)</TableHead>
                    <TableHead className="text-center w-[100px]">Qty Diterima (Sesi Ini)</TableHead>
                    <TableHead className="text-center w-[150px]">Hrg. Beli Aktual (Sesi Ini)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map(item => {
                    const detail = itemReceiptDetails[item.productId] || { quantityReceivedThisSession: '0', actualCostPriceThisSession: '0' };
                    const remainingToReceive = item.orderQuantity - (item.quantityReceived || 0);
                    return (
                      <TableRow key={item.productId}>
                        <TableCell>
                          {item.productName}
                          <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                        </TableCell>
                        <TableCell className="text-center">{item.orderQuantity}</TableCell>
                        <TableCell className="text-center">{item.quantityReceived || 0}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={detail.quantityReceivedThisSession}
                            onChange={(e) => handleReceiptDetailChange(item.productId, 'quantityReceivedThisSession', e.target.value)}
                            className="w-20 h-8 text-center mx-auto"
                            min="0"
                            max={remainingToReceive.toString()} // Informational, validation is separate
                            placeholder="Qty"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                           <Input
                            type="number"
                            value={detail.actualCostPriceThisSession}
                            onChange={(e) => handleReceiptDetailChange(item.productId, 'actualCostPriceThisSession', e.target.value)}
                            className="w-32 h-8 text-center mx-auto"
                            min="0"
                            placeholder="Harga"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Label htmlFor="overallReceivingNotes">Catatan Penerimaan Keseluruhan (Opsional)</Label>
                <Textarea id="overallReceivingNotes" value={currentReceivingNotes} onChange={(e) => setCurrentReceivingNotes(e.target.value)} placeholder="Contoh: Ada 1 item rusak, dus penyok, dll." rows={2}/>
              </div>
            </div>
            <DialogFooter className="mt-4 border-t pt-4">
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button onClick={() => {
                try {
                  handleConfirmReceipt();
                } catch (e) {
                  // Errors are toasted inside handleConfirmReceipt
                  console.error("Receipt confirmation failed:", e);
                }
              }} className="bg-green-600 hover:bg-green-700 text-white">
                <CheckSquare className="mr-2 h-4 w-4" /> Konfirmasi Penerimaan & Update Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

