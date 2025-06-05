
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
import type { Product, SupplierOrderItem, ProductCategory } from "@/lib/types";
import { ShoppingBag, Search, Filter, PlusCircle, MinusCircle, Trash2, MessageSquare, PackagePlus, AlertTriangle } from "lucide-react";

type ProductFilter = 'all' | 'lowStock' | 'outOfStock' | 'inactive' | 'allActive';

// Mock data - in a real app, this would come from Product type in inventory
const MOCK_PRODUCTS_INVENTORY_DETAILED: Product[] = [
  { id: 'PROD-1690000001', sku: 'SKU-OLI-001', name: 'Oli Mesin SuperX 1L', category: 'Oli & Cairan', costPrice: 50000, sellingPrices: [{ tierName: 'default', price: 75000 }, { tierName: 'partner', price: 65000 }, { tierName: 'servicePackage', price: 90000 }], stockQuantity: 50, lowStockThreshold: 10, description: "Oli berkualitas tinggi untuk performa maksimal.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000002', sku: 'SKU-PART-001', name: 'Kampas Rem Depan YMH', category: 'Suku Cadang', costPrice: 30000, sellingPrices: [{ tierName: 'default', price: 45000 }, { tierName: 'servicePackage', price: 60000 }], stockQuantity: 30, lowStockThreshold: 5, description: "Kampas rem original Yamaha.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000003', sku: 'SKU-PART-002', name: 'Busi Champion Z9', category: 'Suku Cadang', costPrice: 10000, sellingPrices: [{ tierName: 'default', price: 15000 }, { tierName: 'partner', price: 12000 }, { tierName: 'servicePackage', price: 25000 }], stockQuantity: 0, lowStockThreshold: 20, description: "Busi standar untuk berbagai jenis motor.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000004', sku: 'SKU-JASA-001', name: 'Servis Rutin Ringan', category: 'Jasa', costPrice: 0, sellingPrices: [{ tierName: 'default', price: 100000 }], stockQuantity: 999, lowStockThreshold: 0, description: "Pemeriksaan dan penyetelan ringan.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000005', sku: 'SKU-AKSES-001', name: 'Handle Grip Racing CNC', category: 'Aksesoris', costPrice: 75000, sellingPrices: [{ tierName: 'default', price: 120000 }, { tierName: 'partner', price: 100000 }, { tierName: 'servicePackage', price: 140000 }], stockQuantity: 5, lowStockThreshold: 3, description: "Handle grip CNC model racing, anti slip.", isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


export default function SupplierOrdersPage() {
  const { toast } = useToast();
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderItems, setOrderItems] = useState<SupplierOrderItem[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('allActive');
  const [orderQuantitiesInput, setOrderQuantitiesInput] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('inventoryProductsBengkelKu');
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
         if (Array.isArray(parsed) && parsed.every(p => typeof p.category === 'string')) { // Basic check
            setInventoryProducts(parsed.filter(p => p.category !== 'Jasa')); // Filter out 'Jasa' category
        } else {
            console.warn("Stored inventory data is not valid, using mock data (excluding Jasa).");
            setInventoryProducts(MOCK_PRODUCTS_INVENTORY_DETAILED.filter(p => p.category !== 'Jasa'));
        }
      } else {
        setInventoryProducts(MOCK_PRODUCTS_INVENTORY_DETAILED.filter(p => p.category !== 'Jasa'));
      }
    } catch (error) {
      console.error("Failed to parse products from localStorage:", error);
      setInventoryProducts(MOCK_PRODUCTS_INVENTORY_DETAILED.filter(p => p.category !== 'Jasa'));
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Memuat data contoh. Kesalahan: " + (error as Error).message });
    }
    setIsLoading(false);
  }, [toast]);

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
    toast({ title: "Ditambahkan ke Orderan", description: `${quantity} x ${product.name} ditambahkan.` });
    setOrderQuantitiesInput(prev => ({ ...prev, [product.id]: '' })); // Reset input for this product
  };

  const handleUpdateOrderItemQuantity = (productId: string, change: number) => {
    setOrderItems(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.productId === productId);
      if (itemIndex === -1) return prevItems;

      const updatedItems = [...prevItems];
      const newQuantity = updatedItems[itemIndex].orderQuantity + change;

      if (newQuantity <= 0) {
        return updatedItems.filter(item => item.productId !== productId); // Remove if quantity is 0 or less
      } else {
        updatedItems[itemIndex].orderQuantity = newQuantity;
        return updatedItems;
      }
    });
  };

  const handleRemoveFromOrder = (productId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Item Dihapus", description: "Item telah dihapus dari daftar orderan." });
  };
  
  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = inventoryProducts.filter(p => p.category !== 'Jasa'); // Ensure Jasa is always filtered out

    if (searchTerm) {
        tempProducts = tempProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    switch (activeFilter) {
        case 'lowStock':
            tempProducts = tempProducts.filter(p => p.isActive && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
            break;
        case 'outOfStock':
            tempProducts = tempProducts.filter(p => p.isActive && p.stockQuantity === 0);
            break;
        case 'inactive':
            tempProducts = tempProducts.filter(p => !p.isActive);
            break;
        case 'allActive':
             tempProducts = tempProducts.filter(p => p.isActive);
            break;
        case 'all': 
            // No additional filtering based on activity status if 'all' is selected
            break;
    }
    return tempProducts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [inventoryProducts, searchTerm, activeFilter]);


  const generateWhatsAppMessage = () => {
    if (orderItems.length === 0) {
      toast({ variant: "destructive", title: "Orderan Kosong", description: "Tambahkan item ke daftar orderan terlebih dahulu." });
      return;
    }
    let message = "Halo Supplier,\nSaya mau order barang berikut:\n\n";
    orderItems.forEach(item => {
      message += `- ${item.productName} (SKU: ${item.sku}) - ${item.orderQuantity} pcs\n`;
    });
    message += "\nMohon info ketersediaan dan totalnya.\nTerima kasih.";
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast({ title: "Pesan WhatsApp Dibuat", description: "Silakan lanjutkan pengiriman pesan di WhatsApp." });
  };

  const getProductRowClass = (product: Product) => {
    if (!product.isActive) return "bg-muted/40 text-muted-foreground hover:bg-muted/50 opacity-70";
    if (product.category !== 'Jasa') { // Should always be true due to initial filter
        if (product.stockQuantity === 0) return "bg-red-100/70 dark:bg-red-900/30 hover:bg-red-200/70 dark:hover:bg-red-800/40";
        if (product.stockQuantity <= product.lowStockThreshold) return "bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-200/70 dark:hover:bg-yellow-800/40";
    }
    return "";
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data inventaris...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Order ke Supplier"
        description="Pilih item dari inventaris untuk membuat daftar pesanan ke supplier."
      />

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
                    <Input
                        type="text"
                        placeholder="Cari berdasarkan Nama atau SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full"
                    />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Filter className="mr-2 h-4 w-4" /> 
                       Filter ({ activeFilter === 'all' ? 'Semua Item Fisik' :
                                 activeFilter === 'lowStock' ? 'Stok Menipis' :
                                 activeFilter === 'outOfStock' ? 'Stok Habis' :
                                 activeFilter === 'inactive' ? 'Nonaktif' : 'Semua Aktif'
                               })
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
                    <DropdownMenuItem onClick={() => setActiveFilter('all')}>Tampilkan Semua Item Fisik</DropdownMenuItem>
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
                            <Input
                              type="number"
                              value={orderQuantitiesInput[product.id] || ''}
                              onChange={(e) => handleInputChange(product.id, e.target.value)}
                              placeholder="Qty"
                              className="w-20 h-8 text-center mx-auto"
                              min="1"
                              disabled={!product.isActive}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={() => handleAddToOrder(product)}
                              disabled={!product.isActive || !orderQuantitiesInput[product.id] || parseInt(orderQuantitiesInput[product.id] || '0') <= 0}
                              className="h-8"
                            >
                              <PlusCircle className="mr-1 h-4 w-4" /> Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                 <Card className="w-full text-center shadow-none border-dashed border-gray-300 py-10">
                    <CardHeader className="items-center">
                        {(activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? 
                            <PackagePlus className="w-16 h-16 text-muted-foreground mb-4" /> :
                            <Search className="w-16 h-16 text-muted-foreground mb-4" />
                        }
                        <CardTitle className="text-xl text-foreground">
                        {(activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? "Belum Ada Item Fisik" : "Item Tidak Ditemukan"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                        {(activeFilter === 'all' && !searchTerm) || (activeFilter === 'allActive' && !searchTerm) ? 
                            "Tidak ada item fisik di inventaris atau item jasa telah difilter." :
                            "Tidak ada item yang cocok dengan kriteria pencarian atau filter Anda."
                        }
                        </p>
                    </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-md lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>Keranjang Orderan</CardTitle>
              <CardDescription>Item yang akan dipesan dari supplier.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {orderItems.length > 0 ? (
                <div className="max-h-[450px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60%]">Item</TableHead>
                        <TableHead className="text-center w-[30%]">Qty</TableHead>
                        <TableHead className="text-right w-[10%]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium text-sm break-words">
                            {item.productName} <br/>
                            <span className="text-xs text-muted-foreground font-mono">{item.sku}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateOrderItemQuantity(item.productId, -1)}>
                                <MinusCircle className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium">{item.orderQuantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateOrderItemQuantity(item.productId, 1)}>
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromOrder(item.productId)} className="text-destructive hover:text-destructive/80 h-7 w-7">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Keranjang orderan kosong.</p>
                  <p className="text-xs">Pilih item dari daftar di sebelah kiri.</p>
                </div>
              )}
            </CardContent>
            {orderItems.length > 0 && (
              <CardFooter className="border-t pt-4">
                <Button onClick={generateWhatsAppMessage} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <MessageSquare className="mr-2 h-4 w-4" /> Buat Pesan WhatsApp Order
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

