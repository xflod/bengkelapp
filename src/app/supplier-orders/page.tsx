
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, SupplierOrderItem, SupplierOrder, SupplierOrderStatus, Supplier } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Search, Filter, PlusCircle, MinusCircle, Trash2, MessageSquare, PackagePlus, ListOrdered, Eye, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });


type ProductFilter = 'all' | 'lowStock' | 'outOfStock' | 'inactive' | 'allActive';

export default function SupplierOrdersPage() {
  const { toast } = useToast();
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [orderItems, setOrderItems] = useState<SupplierOrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('allActive');
  const [orderQuantitiesInput, setOrderQuantitiesInput] = useState<Record<string, string>>({});

  const [supplierOrdersList, setSupplierOrdersList] = useState<SupplierOrder[]>([]);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SupplierOrder | null>(null);
  const [isDetailOrderDialogOpen, setIsDetailOrderDialogOpen] = useState(false);
  
  const [supplierName, setSupplierName] = useState(''); 
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierPopoverOpen, setIsSupplierPopoverOpen] = useState(false);


  const fetchInventory = useCallback(async () => {
    // Removed setIsLoading(true) from here to rely on the main useEffect's isLoading
    const { data, error } = await supabase.from('products').select('*').neq('category', 'Jasa');
    if (error) {
      console.error("Error fetching inventory (raw):", JSON.stringify(error, null, 2));
      let detailedMessage = "Gagal memuat inventaris dari server.";
      if (error.message) {
        detailedMessage = error.message;
      } else if (typeof error === 'object' && error !== null && Object.keys(error).length === 0) {
        detailedMessage = "Query inventaris berhasil namun tidak ada data yang dikembalikan, atau akses ditolak. Mohon periksa Row Level Security (RLS) di Supabase untuk tabel 'products'.";
      } else if (typeof error === 'object' && error !== null) {
        detailedMessage = `Terjadi kesalahan: ${JSON.stringify(error)}. Periksa RLS Supabase.`;
      }
      toast({ variant: "destructive", title: "Gagal Memuat Inventaris", description: detailedMessage });
      setInventoryProducts([]);
    } else {
      const transformedData = data.map(p => ({ 
          ...p, 
          id: String(p.id),
          sellingPrices: typeof p.selling_prices === 'string' ? JSON.parse(p.selling_prices) : p.selling_prices,
          costPrice: p.cost_price,
          stockQuantity: p.stock_quantity,
          lowStockThreshold: p.low_stock_threshold,
          isActive: p.is_active,
        }));
      setInventoryProducts(transformedData as Product[]);
    }
    // Removed setIsLoading(false) from here
  }, [toast]);

  const fetchSupplierOrders = useCallback(async () => {
    // Removed setIsLoading(true) from here
    const { data, error } = await supabase.from('supplier_orders').select('*').order('order_date', { ascending: false });
    if (error) {
      console.error("Error fetching supplier orders (raw):", JSON.stringify(error, null, 2));
      let detailedMessage = "Gagal memuat riwayat order dari server.";
      if (error.message) {
        detailedMessage = error.message;
      } else if (typeof error === 'object' && error !== null && Object.keys(error).length === 0) {
        detailedMessage = "Query riwayat order berhasil namun tidak ada data yang dikembalikan, atau akses ditolak. Mohon periksa Row Level Security (RLS) di Supabase untuk tabel 'supplier_orders'.";
      } else if (typeof error === 'object' && error !== null) {
        detailedMessage = `Terjadi kesalahan: ${JSON.stringify(error)}. Periksa RLS Supabase.`;
      }
      toast({ variant: "destructive", title: "Gagal Memuat Riwayat Order", description: detailedMessage });
      setSupplierOrdersList([]);
    } else {
       const transformedData = data.map(so => ({
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
      setSupplierOrdersList(transformedData as SupplierOrder[]);
    }
    // Removed setIsLoading(false) from here
  }, [toast]);

  const fetchAllSuppliers = useCallback(async () => {
    const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (error) {
      toast({ variant: "destructive", title: "Gagal Memuat Daftar Supplier", description: error.message });
      setAllSuppliers([]);
    } else {
      setAllSuppliers(data.map(s => ({ ...s, id: String(s.id) })) as Supplier[]);
    }
  }, [toast]);

  useEffect(() => {
    setIsLoading(true); // Set loading true at the start of combined fetch
    Promise.all([fetchInventory(), fetchSupplierOrders(), fetchAllSuppliers()]).finally(() => {
      setIsLoading(false); // Set loading false after all fetches are done
    });
  }, [fetchInventory, fetchSupplierOrders, fetchAllSuppliers]);


  const handleInputChange = (productId: string, value: string) => { setOrderQuantitiesInput(prev => ({ ...prev, [productId]: value })); };
  const handleAddToOrder = (product: Product) => { const quantityStr = orderQuantitiesInput[product.id] || '0'; const quantity = parseInt(quantityStr, 10); if (isNaN(quantity) || quantity <= 0) { toast({ variant: "destructive", title: "Jumlah Tidak Valid" }); return; } setOrderItems(prevItems => { const existingItemIndex = prevItems.findIndex(item => item.productId === product.id); if (existingItemIndex > -1) { const updatedItems = [...prevItems]; updatedItems[existingItemIndex].orderQuantity += quantity; return updatedItems; } else { return [...prevItems, { productId: product.id, productName: product.name, sku: product.sku, orderQuantity: quantity }]; } }); toast({ title: "Ditambahkan ke Order" }); setOrderQuantitiesInput(prev => ({ ...prev, [product.id]: '' })); };
  const handleUpdateOrderItemQuantity = (productId: string, change: number) => { setOrderItems(prevItems => { const itemIndex = prevItems.findIndex(item => item.productId === productId); if (itemIndex === -1) return prevItems; const updatedItems = [...prevItems]; const newQuantity = updatedItems[itemIndex].orderQuantity + change; if (newQuantity <= 0) { return updatedItems.filter(item => item.productId !== productId); } else { updatedItems[itemIndex].orderQuantity = newQuantity; return updatedItems; } }); };
  const handleRemoveFromOrder = (productId: string) => { setOrderItems(prevItems => prevItems.filter(item => item.productId !== productId)); toast({ title: "Item Dihapus" }); };
  
  const filteredAndSortedProducts = useMemo(() => { let tempProducts = inventoryProducts.filter(p => p.category !== 'Jasa'); if (searchTerm) { tempProducts = tempProducts.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase())); } switch (activeFilter) { case 'lowStock': tempProducts = tempProducts.filter(p => p.isActive && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold); break; case 'outOfStock': tempProducts = tempProducts.filter(p => p.isActive && p.stockQuantity === 0); break; case 'inactive': tempProducts = tempProducts.filter(p => !p.isActive); break; case 'allActive': tempProducts = tempProducts.filter(p => p.isActive); break; case 'all': break; } return tempProducts.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()); }, [inventoryProducts, searchTerm, activeFilter]);

  const filteredSuppliersForPopover = useMemo(() => {
    if (!supplierName.trim()) return [];
    return allSuppliers.filter(s =>
      s.name.toLowerCase().includes(supplierName.toLowerCase()) ||
      (s.contact_person || '').toLowerCase().includes(supplierName.toLowerCase())
    );
  }, [allSuppliers, supplierName]);

  const handleSaveDraftAndGenerateWhatsApp = async () => {
    if (orderItems.length === 0) { toast({ variant: "destructive", title: "Keranjang Order Kosong" }); return; }
    const now = new Date();
    const newOrderDataSupabase = {
      order_date: now.toISOString(), items: orderItems, status: 'Draf Order' as SupplierOrderStatus,
      total_order_quantity: orderItems.reduce((sum, item) => sum + item.orderQuantity, 0),
      created_at: now.toISOString(), updated_at: now.toISOString(),
      supplier_name: supplierName.trim() || undefined, 
      client_order_id: `SO-${format(now, 'yyyyMMddHHmmss')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
    };

    const { data: insertedOrder, error } = await supabase.from('supplier_orders').insert([newOrderDataSupabase]).select().single();
    if (error) { toast({ variant: "destructive", title: "Gagal Simpan Draf Order", description: error.message }); return; }
    
    let message = `Order ke ${supplierName.trim() || 'Supplier Yang Terhormat'}:\n\n`;
    orderItems.forEach((item, index) => { message += `${index + 1}. ${item.productName} (${item.sku}) - ${item.orderQuantity} pcs\n`; });
    message += "\nMohon info ketersediaan & total harga. Terima kasih.\nBengkelKu";
    
    let whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    if (selectedSupplier && selectedSupplier.whatsapp_number) {
      let cleanNumber = selectedSupplier.whatsapp_number.replace(/\D/g, '');
      if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
      } else if (!cleanNumber.startsWith('62')) {
        if (cleanNumber.length >= 9 && cleanNumber.length <= 13) { 
            cleanNumber = '62' + cleanNumber;
        }
      }
      whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    }
    
    window.open(whatsappUrl, '_blank');
    
    toast({ title: "Draf Order Disimpan & WA Siap", description: `Order ID: ${insertedOrder?.id || newOrderDataSupabase.client_order_id}` });
    setOrderItems([]); setSupplierName(''); setSelectedSupplier(null); fetchSupplierOrders();
  };

  const getProductRowClass = (product: Product) => { if (!product.isActive) return "bg-muted/40 text-muted-foreground opacity-70"; if (product.category !== 'Jasa' && product.stockQuantity === 0) return "bg-red-100/70 dark:bg-red-900/30"; if (product.category !== 'Jasa' && product.stockQuantity > 0 && product.lowStockThreshold > 0 && product.stockQuantity <= product.lowStockThreshold) return "bg-yellow-100/70 dark:bg-yellow-900/30"; return ""; };
  const getStatusBadgeColor = (status: SupplierOrderStatus) => { switch (status) { case 'Draf Order': return 'bg-gray-500'; case 'Dipesan ke Supplier': return 'bg-blue-500'; case 'Sebagian Diterima': return 'bg-yellow-500'; case 'Diterima Lengkap': return 'bg-green-500'; case 'Dibatalkan': return 'bg-red-500'; default: return 'bg-gray-400'; } };
  const handleOpenDetailDialog = (order: SupplierOrder) => { setSelectedOrderForDetail(order); setIsDetailOrderDialogOpen(true); };
  
  const handleDeleteSupplierOrder = async (orderId: string) => {
    if (window.confirm("Yakin ingin menghapus draf order ini?")) {
        const { error } = await supabase.from('supplier_orders').delete().match({ id: orderId });
        if (error) toast({ variant: "destructive", title: "Gagal Hapus Draf Order", description: error.message });
        else { toast({ title: "Draf Order Dihapus" }); fetchSupplierOrders(); }
    }
  };

  if (isLoading && inventoryProducts.length === 0 && supplierOrdersList.length === 0 && allSuppliers.length === 0) { return <div className="flex justify-center items-center h-screen"><p>Memuat data...</p></div>; }

  return (
    <div className="space-y-6">
      <PageHeader title="Order & Penerimaan dari Supplier" description="Buat draf order, lihat riwayat, dan kelola penerimaan."/>
      <Tabs defaultValue="createOrder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4"><TabsTrigger value="createOrder"><PackagePlus className="mr-2 h-4 w-4"/>Buat Draf Order</TabsTrigger><TabsTrigger value="orderHistory"><ListOrdered className="mr-2 h-4 w-4"/>Riwayat & Penerimaan</TabsTrigger></TabsList>
        <TabsContent value="createOrder">
          <div className="mb-4">
            <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Supplier (Opsional)</label>
            <Popover open={isSupplierPopoverOpen} onOpenChange={setIsSupplierPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Input
                    id="supplierName"
                    value={supplierName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setSupplierName(newName);
                      setSelectedSupplier(null); 
                      setIsSupplierPopoverOpen(newName.trim().length > 0);
                    }}
                    onFocus={() => {
                      if (supplierName.trim().length > 0) {
                        setIsSupplierPopoverOpen(true);
                      }
                    }}
                    placeholder="Ketik nama supplier atau pilih dari daftar"
                    className="w-full"
                    autoComplete="off"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{ zIndex: 100 }}>
                {supplierName.trim().length > 0 && (
                    filteredSuppliersForPopover.length > 0 ? (
                    <ScrollArea className="h-auto max-h-[200px]">
                        <div className="p-1 space-y-0.5">
                        {filteredSuppliersForPopover.map((s) => (
                        <Button
                            key={s.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-1.5 px-2 text-sm"
                            onClick={() => {
                            setSupplierName(s.name);
                            setSelectedSupplier(s);
                            setIsSupplierPopoverOpen(false);
                            }}
                        >
                            {s.name} 
                            {(s.contact_person || s.whatsapp_number) && 
                            <span className="ml-auto text-xs text-muted-foreground truncate max-w-[100px]">
                                {s.contact_person || s.whatsapp_number}
                            </span>
                            }
                        </Button>
                        ))}
                        </div>
                    </ScrollArea>
                    ) : !isLoading ? (
                    <div className="p-2 text-sm text-center text-muted-foreground">Supplier tidak ditemukan. <br/> Anda bisa ketik nama baru.</div>
                    ) : null
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4"><Card className="shadow-md"><CardHeader><CardTitle>Daftar Item Inventaris (Non-Jasa)</CardTitle><CardDescription>Cari & pilih item untuk diorder.</CardDescription></CardHeader><CardContent><div className="flex flex-col sm:flex-row gap-2 mb-4"><div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="text" placeholder="Cari Nama/SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" /></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><Filter className="mr-2 h-4 w-4" />Filter ({ activeFilter === 'all' ? 'Semua Fisik' : activeFilter })</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[200px]"><DropdownMenuLabel>Filter Status</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setActiveFilter('allActive')}>Semua Aktif</DropdownMenuItem><DropdownMenuItem onClick={() => setActiveFilter('lowStock')}>Stok Menipis</DropdownMenuItem><DropdownMenuItem onClick={() => setActiveFilter('outOfStock')}>Stok Habis</DropdownMenuItem><DropdownMenuItem onClick={() => setActiveFilter('inactive')}>Nonaktif</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setActiveFilter('all')}>Semua Fisik</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
              {filteredAndSortedProducts.length > 0 ? (<div className="overflow-x-auto max-h-[60vh]"><Table><TableHeader className="sticky top-0 bg-card z-10"><TableRow><TableHead className="min-w-[200px]">Nama Item</TableHead><TableHead className="min-w-[120px]">SKU</TableHead><TableHead className="text-center min-w-[80px]">Stok</TableHead><TableHead className="w-[120px] text-center">Jml Order</TableHead><TableHead className="w-[100px] text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filteredAndSortedProducts.map((product) => (<TableRow key={product.id} className={getProductRowClass(product)}><TableCell className="font-medium">{product.name}{!product.isActive && <Badge variant="outline" className="ml-2 text-xs">Nonaktif</Badge>}{product.isActive && product.category !== 'Jasa' && product.stockQuantity === 0 && <Badge variant="destructive" className="ml-2 text-xs">Habis</Badge>}{product.isActive && product.category !== 'Jasa' && product.stockQuantity > 0 && product.lowStockThreshold > 0 && product.stockQuantity <= product.lowStockThreshold && <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-700">Menipis</Badge>}</TableCell><TableCell className="font-mono text-xs">{product.sku}</TableCell><TableCell className="text-center">{product.category === 'Jasa' ? 'N/A' : product.stockQuantity}</TableCell><TableCell className="text-center"><Input type="number" value={orderQuantitiesInput[product.id] || ''} onChange={(e) => handleInputChange(product.id, e.target.value)} placeholder="Qty" className="w-20 h-8 text-center mx-auto" min="1" disabled={!product.isActive} /></TableCell><TableCell className="text-right"><Button size="sm" onClick={() => handleAddToOrder(product)} disabled={!product.isActive || !orderQuantitiesInput[product.id] || parseInt(orderQuantitiesInput[product.id] || '0') <= 0} className="h-8"><PlusCircle className="mr-1 h-4 w-4" /> Add</Button></TableCell></TableRow>))}</TableBody></Table></div>) : ( <Card className="w-full text-center shadow-none border-dashed py-10"><CardHeader className="items-center">{ (activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? <PackagePlus className="w-16 h-16 text-muted-foreground mb-4" /> : <Search className="w-16 h-16 text-muted-foreground mb-4" />}<CardTitle className="text-xl text-foreground">{ (activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? "Belum Ada Item Fisik" : "Item Tidak Ditemukan"}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{ (activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? "Tidak ada item fisik." : "Item tidak cocok filter."}</p></CardContent></Card>)}
            </CardContent></Card></div>
            <div className="lg:col-span-1 space-y-4"><Card className="shadow-md lg:sticky lg:top-20"><CardHeader><CardTitle>Keranjang Order (Draf)</CardTitle><CardDescription>Item yang akan di-draft.</CardDescription></CardHeader><CardContent className="space-y-2">{orderItems.length > 0 ? (<div className="max-h-[450px] overflow-y-auto"><Table><TableHeader><TableRow><TableHead className="w-[60%]">Item</TableHead><TableHead className="text-center w-[30%]">Qty</TableHead><TableHead className="text-right w-[10%]">Aksi</TableHead></TableRow></TableHeader><TableBody>{orderItems.map(item => (<TableRow key={item.productId}><TableCell className="font-medium text-sm break-words">{item.productName} <br/><span className="text-xs text-muted-foreground font-mono">{item.sku}</span></TableCell><TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateOrderItemQuantity(item.productId, -1)}><MinusCircle className="h-3 w-3" /></Button><span className="w-8 text-center text-sm font-medium">{item.orderQuantity}</span><Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateOrderItemQuantity(item.productId, 1)}><PlusCircle className="h-3 w-3" /></Button></div></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromOrder(item.productId)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></div>) : (<div className="text-center py-8 text-muted-foreground"><ShoppingBag className="mx-auto h-12 w-12 mb-2 opacity-50" /><p>Keranjang order kosong.</p></div>)}</CardContent>{orderItems.length > 0 && (<CardFooter className="border-t pt-4"><Button onClick={handleSaveDraftAndGenerateWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white"><MessageSquare className="mr-2 h-4 w-4" /> Simpan Draf & Buat Pesan WA</Button></CardFooter>)}</Card></div>
          </div>
        </TabsContent>
        <TabsContent value="orderHistory"><Card className="shadow-md"><CardHeader><CardTitle>Riwayat Order ke Supplier</CardTitle><CardDescription>Daftar order dan status penerimaannya.</CardDescription></CardHeader><CardContent>
          {supplierOrdersList.length > 0 ? (<div className="overflow-x-auto max-h-[70vh]"><Table><TableHeader><TableRow><TableHead>ID Order</TableHead><TableHead>Tgl. Order</TableHead><TableHead>Supplier</TableHead><TableHead className="text-center">Total Item</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>
            {supplierOrdersList.map(order => (<TableRow key={order.id}><TableCell className="font-mono text-xs">{order.id}</TableCell><TableCell>{format(parseISO(order.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })}</TableCell><TableCell>{order.supplierName || '-'}</TableCell><TableCell className="text-center">{order.totalOrderQuantity}</TableCell><TableCell><Badge className={`${getStatusBadgeColor(order.status)} text-white hover:${getStatusBadgeColor(order.status)}`}>{order.status}</Badge></TableCell><TableCell className="text-right space-x-1"><Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenDetailDialog(order)} title="Detail"><Eye className="mr-1 h-4 w-4" /> Detail</Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteSupplierOrder(order.id)} title="Hapus"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}
          </TableBody></Table></div>) : (<div className="text-center py-10 text-muted-foreground"><ListOrdered className="mx-auto h-16 w-16 mb-4 opacity-50" /><p className="text-lg">Belum ada riwayat order.</p></div>)}
        </CardContent></Card></TabsContent>
      </Tabs>
      {selectedOrderForDetail && isDetailOrderDialogOpen && (
        <DynamicDialog open={isDetailOrderDialogOpen} onOpenChange={setIsDetailOrderDialogOpen}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DynamicDialogHeader>
              <DynamicDialogTitle>Detail Order: {selectedOrderForDetail.id}</DynamicDialogTitle>
              <DynamicDialogDescription>Tanggal: {format(parseISO(selectedOrderForDetail.orderDate), "dd MMM yyyy, HH:mm", { locale: localeID })} | Supplier: {selectedOrderForDetail.supplierName || '-'} <br/>Status: <Badge className={`${getStatusBadgeColor(selectedOrderForDetail.status)} text-white`}>{selectedOrderForDetail.status}</Badge></DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="flex-grow overflow-y-auto pr-2">
              <h4 className="font-semibold mb-2">Item Dipesan:</h4>
              <Table><TableHeader><TableRow><TableHead>Nama Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-center">Qty Order</TableHead></TableRow></TableHeader><TableBody>{selectedOrderForDetail.items.map(item => (<TableRow key={item.productId}><TableCell>{item.productName}</TableCell><TableCell className="font-mono text-xs">{item.sku}</TableCell><TableCell className="text-center">{item.orderQuantity}</TableCell></TableRow>))}</TableBody></Table>
              <div className="mt-6 p-4 border-dashed border-2 border-amber-500 rounded-md bg-amber-50"><div className="flex items-center text-amber-700"><AlertTriangle className="h-6 w-6 mr-3 shrink-0" /><p className="text-xs">Fitur penerimaan barang & update stok akan di halaman "Penerimaan Barang".</p></div></div>
            </div>
            <DynamicDialogFooter className="mt-4 border-t pt-4">
              <DynamicDialogClose asChild><Button variant="outline">Tutup</Button></DynamicDialogClose>
              {selectedOrderForDetail.status === 'Draf Order' && (
                <Button onClick={async () => { 
                  const { error } = await supabase.from('supplier_orders').update({ status: 'Dipesan ke Supplier', updated_at: new Date().toISOString() }).match({ id: selectedOrderForDetail.id }); 
                  if (error) toast({variant: "destructive", title: "Error Update Status Order"}); 
                  else {toast({title: "Status Order Diubah menjadi 'Dipesan ke Supplier'"}); fetchSupplierOrders(); setIsDetailOrderDialogOpen(false);}}} 
                  className="bg-blue-600 hover:bg-blue-700 text-white">Tandai "Dipesan"</Button>
              )}
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}

