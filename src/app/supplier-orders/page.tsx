
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, SupplierOrderItem, ProductCategory, SupplierOrder, SupplierOrderStatus } from "@/lib/types";
import { ShoppingBag, Search, Filter, PlusCircle, MinusCircle, Trash2, MessageSquare, PackagePlus, AlertTriangle, ListOrdered, CheckSquare, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";


type ProductFilter = 'all' | 'lowStock' | 'outOfStock' | 'inactive' | 'allActive';

const MOCK_PRODUCTS_INVENTORY_DETAILED: Product[] = [
  { id: 'PROD-1690000001', sku: 'SKU-OLI-001', name: 'Oli Mesin SuperX 1L', category: 'Oli & Cairan', costPrice: 50000, sellingPrices: [{ tierName: 'default', price: 75000 }, { tierName: 'partner', price: 65000 }, { tierName: 'servicePackage', price: 90000 }], stockQuantity: 50, lowStockThreshold: 10, description: "Oli berkualitas tinggi untuk performa maksimal.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000002', sku: 'SKU-PART-001', name: 'Kampas Rem Depan YMH', category: 'Suku Cadang', costPrice: 30000, sellingPrices: [{ tierName: 'default', price: 45000 }, { tierName: 'servicePackage', price: 60000 }], stockQuantity: 30, lowStockThreshold: 5, description: "Kampas rem original Yamaha.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000003', sku: 'SKU-PART-002', name: 'Busi Champion Z9', category: 'Suku Cadang', costPrice: 10000, sellingPrices: [{ tierName: 'default', price: 15000 }, { tierName: 'partner', price: 12000 }, { tierName: 'servicePackage', price: 25000 }], stockQuantity: 0, lowStockThreshold: 20, description: "Busi standar untuk berbagai jenis motor.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


export default function SupplierOrdersPage() {
  const { toast } = useToast();
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // For "Buat Draf Order" Tab
  const [orderItems, setOrderItems] = useState<SupplierOrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('allActive');
  const [orderQuantitiesInput, setOrderQuantitiesInput] = useState<Record<string, string>>({});

  // For "Riwayat & Penerimaan Order" Tab
  const [supplierOrdersList, setSupplierOrdersList] = useState<SupplierOrder[]>([]);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SupplierOrder | null>(null);
  const [isDetailOrderDialogOpen, setIsDetailOrderDialogOpen] = useState(false);

  // Load inventory products
  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem('inventoryProductsBengkelKu');
      if (storedInventory) {
        const parsed = JSON.parse(storedInventory);
         if (Array.isArray(parsed) && parsed.every(p => typeof p.category === 'string')) {
            setInventoryProducts(parsed.filter(p => p.category !== 'Jasa'));
        } else {
            setInventoryProducts(MOCK_PRODUCTS_INVENTORY_DETAILED.filter(p => p.category !== 'Jasa'));
        }
      } else {
        setInventoryProducts(MOCK_PRODUCTS_INVENTORY_DETAILED.filter(p => p.category !== 'Jasa'));
      }
    } catch (error) {
      console.error("Failed to parse inventory from localStorage:", error);
      setInventoryProducts(MOCK_PRODUCTS_INVENTORY_DETAILED.filter(p => p.category !== 'Jasa'));
      toast({ variant: "destructive", title: "Gagal Memuat Inventaris", description: (error as Error).message });
    }
    setIsLoading(false);
  }, [toast]);

  // Load supplier orders history
  useEffect(() => {
    try {
      const storedSupplierOrders = localStorage.getItem('supplierOrdersDataBengkelKu');
      if (storedSupplierOrders) {
        setSupplierOrdersList(JSON.parse(storedSupplierOrders));
      }
    } catch (error) {
      console.error("Failed to parse supplier orders from localStorage:", error);
      toast({ variant: "destructive", title: "Gagal Memuat Riwayat Order", description: (error as Error).message });
    }
  }, [toast]);

  // Save supplier orders history
  useEffect(() => {
    if (!isLoading && supplierOrdersList.length >= 0) { // Save even if empty to clear if needed
        try {
            localStorage.setItem('supplierOrdersDataBengkelKu', JSON.stringify(supplierOrdersList));
        } catch (error) {
            console.error("Error saving supplier orders list to localStorage", error);
            toast({ variant: "destructive", title: "Gagal Menyimpan Riwayat Order", description: "Perubahan pada riwayat order mungkin tidak tersimpan." });
        }
    }
  }, [supplierOrdersList, isLoading, toast]);


  const handleInputChange = (productId: string, value: string) => {
    setOrderQuantitiesInput(prev => ({ ...prev, [productId]: value }));
  };

  const handleAddToOrder = (product: Product) => {
    const quantityStr = orderQuantitiesInput[product.id] || '0';
    const quantity = parseInt(quantityStr, 10);

    if (isNaN(quantity) || quantity <= 0) {
      toast({ variant: "destructive", title: "Jumlah Tidak Valid", description: "Masukkan jumlah order yang valid (lebih dari 0)." });
      return;
    }

    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].orderQuantity += quantity;
        return updatedItems;
      } else {
        return [...prevItems, { productId: product.id, productName: product.name, sku: product.sku, orderQuantity: quantity }];
      }
    });
    toast({ title: "Ditambahkan ke Keranjang Order", description: `${quantity} x ${product.name} ditambahkan.` });
    setOrderQuantitiesInput(prev => ({ ...prev, [product.id]: '' }));
  };

  const handleUpdateOrderItemQuantity = (productId: string, change: number) => {
    setOrderItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.productId === productId);
      if (itemIndex === -1) return prevItems;

      const updatedItems = [...prevItems];
      const newQuantity = updatedItems[itemIndex].orderQuantity + change;

      if (newQuantity <= 0) {
        return updatedItems.filter(item => item.productId !== productId);
      } else {
        updatedItems[itemIndex].orderQuantity = newQuantity;
        return updatedItems;
      }
    });
  };

  const handleRemoveFromOrder = (productId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Item Dihapus dari Keranjang", description: "Item telah dihapus." });
  };
  
  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = inventoryProducts.filter(p => p.category !== 'Jasa');
    if (searchTerm) {
        tempProducts = tempProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    switch (activeFilter) {
        case 'lowStock': tempProducts = tempProducts.filter(p => p.isActive && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold); break;
        case 'outOfStock': tempProducts = tempProducts.filter(p => p.isActive && p.stockQuantity === 0); break;
        case 'inactive': tempProducts = tempProducts.filter(p => !p.isActive); break;
        case 'allActive': tempProducts = tempProducts.filter(p => p.isActive); break;
        case 'all': break;
    }
    return tempProducts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [inventoryProducts, searchTerm, activeFilter]);

  const handleSaveDraftAndGenerateWhatsApp = () => {
    if (orderItems.length === 0) {
      toast({ variant: "destructive", title: "Keranjang Order Kosong", description: "Tambahkan item ke keranjang terlebih dahulu." });
      return;
    }
    const now = new Date();
    const newOrder: SupplierOrder = {
      id: `SO-${format(now, 'yyyyMMddHHmmss')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      orderDate: now.toISOString(),
      items: [...orderItems],
      status: 'Draf Order',
      totalOrderQuantity: orderItems.reduce((sum, item) => sum + item.orderQuantity, 0),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setSupplierOrdersList(prevOrders => [newOrder, ...prevOrders]);
    
    let message = "Selamat pagi/siang/sore,\n\nDengan hormat,\nKami dari BengkelKu ingin melakukan pemesanan beberapa item berikut:\n\n";
    orderItems.forEach((item, index) => {
      message += `${index + 1}. ${item.productName} - ${item.orderQuantity} pcs\n`;
    });
    message += "\nMohon informasikan ketersediaan stok dan total harga untuk pesanan ini.\nAtas perhatian dan kerjasamanya, kami ucapkan terima kasih.\n\nSalam,\nBengkelKu";
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast({ title: "Draf Order Disimpan & Pesan WhatsApp Siap", description: `Order ID: ${newOrder.id} telah disimpan.` });
    setOrderItems([]); // Clear current cart
  };

  const getProductRowClass = (product: Product) => {
    if (!product.isActive) return "bg-muted/40 text-muted-foreground hover:bg-muted/50 opacity-70";
    if (product.stockQuantity === 0) return "bg-red-100/70 dark:bg-red-900/30 hover:bg-red-200/70 dark:hover:bg-red-800/40";
    if (product.stockQuantity <= product.lowStockThreshold) return "bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-200/70 dark:hover:bg-yellow-800/40";
    return "";
  };

  const getStatusBadgeColor = (status: SupplierOrderStatus) => {
    switch (status) {
      case 'Draf Order': return 'bg-gray-500';
      case 'Dipesan ke Supplier': return 'bg-blue-500';
      case 'Sebagian Diterima': return 'bg-yellow-500';
      case 'Diterima Lengkap': return 'bg-green-500';
      case 'Dibatalkan': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const handleOpenDetailDialog = (order: SupplierOrder) => {
    setSelectedOrderForDetail(order);
    setIsDetailOrderDialogOpen(true);
  };
  
  const handleDeleteSupplierOrder = (orderId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus draf order ini?")) {
        setSupplierOrdersList(prev => prev.filter(order => order.id !== orderId));
        toast({ title: "Draf Order Dihapus" });
    }
  };


  if (isLoading && inventoryProducts.length === 0) { // Show loading only if inventory is also loading
    return <div className="flex justify-center items-center h-screen"><p>Memuat data...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Order & Penerimaan dari Supplier"
        description="Buat draf order ke supplier, lihat riwayat, dan kelola penerimaan barang."
      />
      <Tabs defaultValue="createOrder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="createOrder"><PackagePlus className="mr-2 h-4 w-4"/>Buat Draf Order</TabsTrigger>
          <TabsTrigger value="orderHistory"><ListOrdered className="mr-2 h-4 w-4"/>Riwayat & Penerimaan Order</TabsTrigger>
        </TabsList>

        <TabsContent value="createOrder">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Daftar Item Inventaris (Non-Jasa)</CardTitle>
                  <CardDescription>Cari dan pilih item yang akan diorder.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="text" placeholder="Cari berdasarkan Nama atau SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <Filter className="mr-2 h-4 w-4" /> 
                           Filter ({ activeFilter === 'all' ? 'Semua Item Fisik' : activeFilter === 'lowStock' ? 'Stok Menipis' : activeFilter === 'outOfStock' ? 'Stok Habis' : activeFilter === 'inactive' ? 'Nonaktif' : 'Semua Aktif' })
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Filter Berdasarkan Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setActiveFilter('allActive')}>Semua Aktif</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter('lowStock')}>Stok Menipis</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter('outOfStock')}>Stok Habis</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveFilter('inactive')}>Nonaktif</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setActiveFilter('all')}>Semua Item Fisik</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {filteredAndSortedProducts.length > 0 ? (
                    <div className="overflow-x-auto max-h-[60vh]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                            <TableHead className="min-w-[200px]">Nama Item</TableHead>
                            <TableHead className="min-w-[120px]">SKU</TableHead>
                            <TableHead className="text-center min-w-[80px]">Stok</TableHead>
                            <TableHead className="w-[120px] text-center">Jumlah Order</TableHead>
                            <TableHead className="w-[100px] text-right">Aksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedProducts.map((product) => (
                            <TableRow key={product.id} className={getProductRowClass(product)}>
                              <TableCell className="font-medium">
                                {product.name}
                                {!product.isActive && <Badge variant="outline" className="ml-2 text-xs">Nonaktif</Badge>}
                                {product.isActive && product.stockQuantity === 0 && <Badge variant="destructive" className="ml-2 text-xs">Habis</Badge>}
                                {product.isActive && product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold && <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-700">Menipis</Badge>}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                              <TableCell className="text-center">{product.stockQuantity}</TableCell>
                              <TableCell className="text-center">
                                <Input type="number" value={orderQuantitiesInput[product.id] || ''} onChange={(e) => handleInputChange(product.id, e.target.value)} placeholder="Qty" className="w-20 h-8 text-center mx-auto" min="1" disabled={!product.isActive} />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" onClick={() => handleAddToOrder(product)} disabled={!product.isActive || !orderQuantitiesInput[product.id] || parseInt(orderQuantitiesInput[product.id] || '0') <= 0} className="h-8"><PlusCircle className="mr-1 h-4 w-4" /> Add</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : ( <Card className="w-full text-center shadow-none border-dashed border-gray-300 py-10"><CardHeader className="items-center">{ (activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? <PackagePlus className="w-16 h-16 text-muted-foreground mb-4" /> : <Search className="w-16 h-16 text-muted-foreground mb-4" />}<CardTitle className="text-xl text-foreground">{ (activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? "Belum Ada Item Fisik" : "Item Tidak Ditemukan"}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{ (activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? "Tidak ada item fisik di inventaris atau item jasa telah difilter." : "Tidak ada item yang cocok dengan kriteria pencarian atau filter Anda."}</p></CardContent></Card>)}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-4">
              <Card className="shadow-md lg:sticky lg:top-20">
                <CardHeader>
                  <CardTitle>Keranjang Order (Draf)</CardTitle>
                  <CardDescription>Item yang akan di-draft untuk order.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {orderItems.length > 0 ? (
                    <div className="max-h-[450px] overflow-y-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-[60%]">Item</TableHead><TableHead className="text-center w-[30%]">Qty</TableHead><TableHead className="text-right w-[10%]">Aksi</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {orderItems.map(item => (
                            <TableRow key={item.productId}>
                              <TableCell className="font-medium text-sm break-words">{item.productName} <br/><span className="text-xs text-muted-foreground font-mono">{item.sku}</span></TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateOrderItemQuantity(item.productId, -1)}><MinusCircle className="h-3 w-3" /></Button>
                                  <span className="w-8 text-center text-sm font-medium">{item.orderQuantity}</span>
                                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateOrderItemQuantity(item.productId, 1)}><PlusCircle className="h-3 w-3" /></Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromOrder(item.productId)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (<div className="text-center py-8 text-muted-foreground"><ShoppingBag className="mx-auto h-12 w-12 mb-2 opacity-50" /><p>Keranjang order kosong.</p><p className="text-xs">Pilih item dari daftar di sebelah kiri.</p></div>)}
                </CardContent>
                {orderItems.length > 0 && (<CardFooter className="border-t pt-4"><Button onClick={handleSaveDraftAndGenerateWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white"><MessageSquare className="mr-2 h-4 w-4" /> Simpan Draf & Buat Pesan WA</Button></CardFooter>)}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orderHistory">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Riwayat Order ke Supplier</CardTitle>
              <CardDescription>Daftar order yang telah dibuat dan status penerimaannya.</CardDescription>
            </CardHeader>
            <CardContent>
              {supplierOrdersList.length > 0 ? (
                <div className="overflow-x-auto max-h-[70vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Order</TableHead>
                        <TableHead>Tgl. Order</TableHead>
                        <TableHead className="text-center">Total Item</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierOrdersList.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id}</TableCell>
                          <TableCell>{format(new Date(order.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })}</TableCell>
                          <TableCell className="text-center">{order.totalOrderQuantity}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusBadgeColor(order.status)} text-white hover:${getStatusBadgeColor(order.status)}`}>{order.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenDetailDialog(order)} title="Lihat Detail & Proses Penerimaan">
                                <Eye className="mr-1 h-4 w-4" /> Detail / Terima
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteSupplierOrder(order.id)} title="Hapus Draf Order">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <ListOrdered className="mx-auto h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg">Belum ada riwayat order.</p>
                  <p className="text-sm">Buat draf order baru pada tab "Buat Draf Order".</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

       {/* Dialog untuk Detail Order & Placeholder Penerimaan */}
      {selectedOrderForDetail && (
        <Dialog open={isDetailOrderDialogOpen} onOpenChange={setIsDetailOrderDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Detail Order: {selectedOrderForDetail.id}</DialogTitle>
              <DialogDescription>
                Tanggal: {format(new Date(selectedOrderForDetail.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })} | Status: <Badge className={`${getStatusBadgeColor(selectedOrderForDetail.status)} text-white`}>{selectedOrderForDetail.status}</Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2">
              <h4 className="font-semibold mb-2">Item Dipesan:</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Qty Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrderForDetail.items.map(item => (
                    <TableRow key={item.productId}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-center">{item.orderQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 p-4 border-dashed border-2 border-amber-500 rounded-md bg-amber-50">
                <div className="flex items-center text-amber-700">
                  <AlertTriangle className="h-6 w-6 mr-3 shrink-0" />
                  <div>
                    <h3 className="font-semibold">Fitur Penerimaan & Audit Stok</h3>
                    <p className="text-xs">Fitur untuk input jumlah barang diterima, penyesuaian harga beli, dan update stok otomatis akan dikembangkan pada tahap berikutnya.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4 border-t pt-4">
              <DialogClose asChild>
                <Button variant="outline">Tutup</Button>
              </DialogClose>
               {/* Placeholder for future action */}
               {selectedOrderForDetail.status === 'Draf Order' && (
                 <Button onClick={() => {
                     setSupplierOrdersList(prev => prev.map(o => o.id === selectedOrderForDetail.id ? {...o, status: 'Dipesan ke Supplier', updatedAt: new Date().toISOString()} : o));
                     setIsDetailOrderDialogOpen(false);
                     toast({title: "Status Order Diubah", description: `Order ${selectedOrderForDetail.id} ditandai 'Dipesan ke Supplier'.`})
                    }} 
                    className="bg-blue-600 hover:bg-blue-700 text-white">
                    Tandai "Dipesan ke Supplier"
                 </Button>
               )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

