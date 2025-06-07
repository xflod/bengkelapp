
"use client";

import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
// Removed dynamic imports for dialog parts, will import directly
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, SellingPriceTier, ProductCategory } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { PackagePlus, Edit3, Trash2, Search, Filter, AlertTriangle } from "lucide-react";
import { Label } from '@/components/ui/label';

// Direct imports for the dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';


type ProductFilter = 'all' | 'lowStock' | 'outOfStock' | 'inactive' | 'allActive';

export default function InventoryPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [costPrice, setCostPrice] = useState<string | number>('');
  const [sellingPriceDefault, setSellingPriceDefault] = useState<string | number>('');
  const [sellingPricePartner, setSellingPricePartner] = useState<string | number>('');
  const [sellingPriceServicePackage, setSellingPriceServicePackage] = useState<string | number>('');
  const [stockQuantity, setStockQuantity] = useState<string | number>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<string | number>('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('allActive');

  const inventoryFormDialogTitleId = useId(); 

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false }); 

    if (error) {
      console.error('Error fetching products (raw):', JSON.stringify(error, null, 2));
      let detailedMessage = "Gagal memuat inventaris dari server.";
      if (error.message) {
        detailedMessage = error.message;
      } else if (typeof error === 'object' && error !== null && Object.keys(error).length === 0) {
        detailedMessage = "Query berhasil namun tidak ada data inventaris yang dikembalikan, atau akses ditolak. Mohon periksa Row Level Security (RLS) di Supabase untuk tabel 'products' dan pastikan tabelnya ada.";
      } else if (typeof error === 'object' && error !== null) {
        detailedMessage = `Terjadi kesalahan: ${JSON.stringify(error)}. Periksa RLS Supabase.`;
      }
      toast({ variant: "destructive", title: "Kesalahan Database Inventaris", description: detailedMessage });
      setProducts([]);
    } else {
      const transformedData = data.map(p => ({
        ...p,
        id: String(p.id), 
        sellingPrices: typeof p.selling_prices === 'string' ? JSON.parse(p.selling_prices) : p.selling_prices,
        costPrice: p.cost_price,
        stockQuantity: p.stock_quantity,
        lowStockThreshold: p.low_stock_threshold,
        isActive: p.is_active,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
      setProducts(transformedData as Product[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetFormFields = useCallback(() => {
    setEditingProduct(null);
    setSku('');
    setProductName('');
    setCategory(null);
    setCostPrice('');
    setSellingPriceDefault('');
    setSellingPricePartner('');
    setSellingPriceServicePackage('');
    setStockQuantity('');
    setLowStockThreshold('');
    setDescription('');
    setIsActive(true);
  }, []);

  const handleOpenFormDialog = useCallback((product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setSku(product.sku);
      setProductName(product.name);
      setCategory(product.category);
      setCostPrice(product.costPrice);
      setSellingPriceDefault(product.sellingPrices.find(p => p.tierName === 'default')?.price || '');
      setSellingPricePartner(product.sellingPrices.find(p => p.tierName === 'partner')?.price || '');
      setSellingPriceServicePackage(product.sellingPrices.find(p => p.tierName === 'servicePackage')?.price || '');
      setStockQuantity(product.category === 'Jasa' ? '' : product.stockQuantity);
      setLowStockThreshold(product.category === 'Jasa' ? '' : product.lowStockThreshold);
      setDescription(product.description || '');
      setIsActive(product.isActive);
    } else {
      resetFormFields();
      setSku(`SKU-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`);
    }
    setIsFormDialogOpen(true);
  }, [resetFormFields]);

  const handleSaveProduct = async () => {
    const currentProductName = productName.trim();
    const currentSku = sku.trim();
    if (!currentProductName || !currentSku || !category) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "SKU, Nama, dan Kategori wajib diisi." });
      return;
    }
    
    const parsedCostPrice = parseFloat(String(costPrice));
    const parsedSellingPriceDefault = parseFloat(String(sellingPriceDefault));
    const parsedSellingPricePartner = String(sellingPricePartner).trim() !== '' ? parseFloat(String(sellingPricePartner)) : undefined;
    const parsedSellingPriceServicePackage = category !== 'Jasa' && String(sellingPriceServicePackage).trim() !== '' ? parseFloat(String(sellingPriceServicePackage)) : undefined;
    let parsedStockQuantity = category === 'Jasa' ? 0 : parseInt(String(stockQuantity), 10); 
    let parsedLowStockThreshold = category === 'Jasa' ? 0 : parseInt(String(lowStockThreshold), 10);

    if (isNaN(parsedCostPrice) || isNaN(parsedSellingPriceDefault) || 
        (parsedSellingPricePartner !== undefined && isNaN(parsedSellingPricePartner)) ||
        (parsedSellingPriceServicePackage !== undefined && isNaN(parsedSellingPriceServicePackage)) ||
        (category !== 'Jasa' && (isNaN(parsedStockQuantity) || isNaN(parsedLowStockThreshold))) ) {
        toast({ variant: "destructive", title: "Data Angka Tidak Valid", description: "Harga dan Stok harus berupa angka." });
        return;
    }
    if (category === 'Jasa') {
        parsedStockQuantity = 9999; 
        parsedLowStockThreshold = 0;
    }


    const sellingPricesArray: SellingPriceTier[] = [
      { tierName: 'default', price: parsedSellingPriceDefault },
    ];
    if (parsedSellingPricePartner !== undefined) {
      sellingPricesArray.push({ tierName: 'partner', price: parsedSellingPricePartner });
    }
    if (category !== 'Jasa' && parsedSellingPriceServicePackage !== undefined) {
      sellingPricesArray.push({ tierName: 'servicePackage', price: parsedSellingPriceServicePackage });
    }

    const productDataToSave = {
      sku: currentSku,
      name: currentProductName,
      category: category as ProductCategory,
      cost_price: parsedCostPrice,
      selling_prices: sellingPricesArray, 
      stock_quantity: parsedStockQuantity,
      low_stock_threshold: parsedLowStockThreshold,
      description: description.trim() || undefined,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };
    
    if (editingProduct && editingProduct.id) {
      const { error } = await supabase
        .from('products')
        .update(productDataToSave)
        .match({ id: editingProduct.id });
      if (error) {
        toast({ variant: "destructive", title: "Gagal Memperbarui Produk", description: error.message });
      } else {
        toast({ title: "Produk Diperbarui", description: `${productDataToSave.name} telah diperbarui.` });
        fetchProducts(); 
      }
    } else {
      const { data: existingSkuData } = await supabase.from('products').select('id').eq('sku', currentSku).single();
      if (existingSkuData) {
        toast({ variant: "destructive", title: "SKU Duplikat", description: `SKU ${currentSku} sudah ada. Mohon gunakan SKU yang unik.` });
        return;
      }
      const { error } = await supabase
        .from('products')
        .insert([{ ...productDataToSave, created_at: new Date().toISOString() }]);
      if (error) {
        toast({ variant: "destructive", title: "Gagal Menambah Produk", description: error.message });
      } else {
        toast({ title: "Produk Ditambahkan", description: `${productDataToSave.name} telah ditambahkan.` });
        fetchProducts(); 
      }
    }
    setIsFormDialogOpen(false);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
      const { error } = await supabase
        .from('products')
        .delete()
        .match({ id: productId });
      if (error) {
        toast({ variant: "destructive", title: "Gagal Menghapus Produk", description: error.message });
      } else {
        toast({ title: "Produk Dihapus", description: `${productName} telah dihapus.` });
        fetchProducts(); 
      }
    }
  };

  const handleToggleActive = async (productId: string, currentIsActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentIsActive, updated_at: new Date().toISOString() })
      .match({ id: productId });
    if (error) {
      toast({ variant: "destructive", title: "Gagal Mengubah Status", description: error.message });
    } else {
      toast({ title: "Status Produk Diubah" });
      fetchProducts(); 
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];
    if (searchTerm) {
        tempProducts = tempProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    switch (activeFilter) {
        case 'lowStock': tempProducts = tempProducts.filter(p => p.category !== 'Jasa' && p.isActive && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold); break;
        case 'outOfStock': tempProducts = tempProducts.filter(p => p.category !== 'Jasa' && p.isActive && p.stockQuantity === 0); break;
        case 'inactive': tempProducts = tempProducts.filter(p => !p.isActive); break;
        case 'allActive': tempProducts = tempProducts.filter(p => p.isActive); break;
        case 'all': break;
    }
    return tempProducts;
  }, [products, searchTerm, activeFilter]);

  if (isLoading && products.length === 0) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data inventaris...</p></div>;
  }

  const getProductRowClass = (product: Product) => {
    if (!product.isActive) return "bg-muted/40 text-muted-foreground hover:bg-muted/50";
    if (product.category !== 'Jasa') {
        if (product.stockQuantity === 0) return "bg-red-100/70 dark:bg-red-900/30 hover:bg-red-200/70 dark:hover:bg-red-800/40";
        if (product.stockQuantity <= product.lowStockThreshold && product.lowStockThreshold > 0) return "bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-200/70 dark:hover:bg-yellow-800/40";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Inventaris"
        description="Kelola semua produk, suku cadang, dan jasa bengkel Anda."
        actions={
          <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PackagePlus className="mr-2 h-4 w-4" />
            Tambah Item Baru
          </Button>
        }
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Daftar Item Inventaris</CardTitle>
          <CardDescription>Cari, filter, dan kelola item Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="text" placeholder="Cari berdasarkan Nama atau SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full"/>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> 
                  Filter ({ activeFilter === 'all' ? 'Semua Item' : activeFilter === 'lowStock' ? 'Stok Menipis' : activeFilter === 'outOfStock' ? 'Stok Habis' : activeFilter === 'inactive' ? 'Nonaktif' : 'Semua Aktif' })
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
                <DropdownMenuItem onClick={() => setActiveFilter('all')}>Tampilkan Semua Item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filteredAndSortedProducts.length > 0 ? (
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-[60px] px-1 py-1.5 text-xs">Status</TableHead>
                    <TableHead className="min-w-[70px] px-1 py-1.5 text-xs hidden sm:table-cell">SKU</TableHead>
                    <TableHead className="min-w-[120px] px-1 py-1.5 text-xs">Nama Item</TableHead>
                    <TableHead className="min-w-[80px] px-1 py-1.5 text-xs hidden sm:table-cell">Kategori</TableHead>
                    <TableHead className="text-right min-w-[80px] px-1 py-1.5 text-xs">Hrg. Modal</TableHead>
                    <TableHead className="text-right min-w-[80px] px-1 py-1.5 text-xs">Hrg. Jual</TableHead>
                    <TableHead className="text-right min-w-[80px] px-1 py-1.5 text-xs">Hrg. Partner</TableHead>
                    <TableHead className="text-right min-w-[90px] px-1 py-1.5 text-xs">Hrg. Jual+Pasang</TableHead>
                    <TableHead className="text-center min-w-[50px] px-1 py-1.5 text-xs">Stok</TableHead>
                    <TableHead className="text-center min-w-[50px] px-1 py-1.5 text-xs hidden sm:table-cell">Stok Min.</TableHead>
                    <TableHead className="text-center w-[80px] px-1 py-1.5 text-xs">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.map((product) => (
                    <TableRow key={product.id} className={getProductRowClass(product)}>
                      <TableCell className="px-1 py-1">
                        <Switch checked={product.isActive} onCheckedChange={() => handleToggleActive(product.id, product.isActive)} aria-label={product.isActive ? "Nonaktifkan" : "Aktifkan"}/>
                      </TableCell>
                      <TableCell className="font-mono text-xs px-1 py-1 break-all hidden sm:table-cell">{product.sku}</TableCell>
                      <TableCell className="font-medium px-1 py-1 break-words text-sm">
                        {product.name}
                        {!product.isActive && <Badge variant="outline" className="ml-1.5 text-xs">Nonaktif</Badge>}
                        {product.category !== 'Jasa' && product.isActive && product.stockQuantity === 0 && <Badge variant="destructive" className="ml-1.5 text-xs">Habis</Badge>}
                        {product.category !== 'Jasa' && product.isActive && product.stockQuantity > 0 && product.lowStockThreshold > 0 && product.stockQuantity <= product.lowStockThreshold && <Badge variant="outline" className="ml-1.5 text-xs border-yellow-500 text-yellow-700">Menipis</Badge>}
                      </TableCell>
                      <TableCell className="px-1 py-1 text-sm hidden sm:table-cell">{product.category}</TableCell>
                      <TableCell className="text-right px-1 py-1 text-sm">Rp {product.costPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right px-1 py-1 text-sm">Rp {product.sellingPrices.find(p => p.tierName === 'default')?.price.toLocaleString() || '-'}</TableCell>
                      <TableCell className="text-right px-1 py-1 text-sm">
                        {product.sellingPrices.find(p => p.tierName === 'partner')?.price?.toLocaleString() ? `Rp ${product.sellingPrices.find(p => p.tierName === 'partner')?.price.toLocaleString()}` : '-'}
                      </TableCell>
                       <TableCell className="text-right px-1 py-1 text-sm">
                        {product.category !== 'Jasa' && product.sellingPrices.find(p => p.tierName === 'servicePackage')?.price?.toLocaleString() ? `Rp ${product.sellingPrices.find(p => p.tierName === 'servicePackage')?.price.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-center px-1 py-1 text-sm">{product.category === 'Jasa' ? '-' : product.stockQuantity}</TableCell>
                      <TableCell className="text-center px-1 py-1 text-sm hidden sm:table-cell">{product.category === 'Jasa' ? '-' : product.lowStockThreshold}</TableCell>
                      <TableCell className="text-center px-1 py-1">
                        <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => handleOpenFormDialog(product)} title="Edit Item"><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id, product.name)} title="Hapus Item"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <Card className="w-full text-center shadow-none border-dashed border-gray-300 py-10">
                <CardHeader className="items-center">{activeFilter === 'all' && !searchTerm ? <PackagePlus className="w-16 h-16 text-muted-foreground mb-4" /> : <Search className="w-16 h-16 text-muted-foreground mb-4" />}</CardHeader>
                <CardContent><p className="text-muted-foreground">{activeFilter === 'all' && !searchTerm ? "Saat ini tidak ada item di inventaris. Klik 'Tambah Item Baru' untuk memulai." : "Tidak ada item yang cocok dengan kriteria pencarian atau filter Anda."}</p></CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {isFormDialogOpen && (
        <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) resetFormFields(); }}>
          <DialogContent 
            className="sm:max-w-lg max-h-[85vh] flex flex-col"
            aria-labelledby={inventoryFormDialogTitleId}
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle id={inventoryFormDialogTitleId}>
                {editingProduct ? 'Edit Item Inventaris' : 'Tambah Item Baru ke Inventaris'}
              </DialogTitle>
              <DialogDescription>
                 {editingProduct ? `Mengedit detail untuk ${editingProduct.name}.` : 'Masukkan detail item baru.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-3 text-sm space-y-3 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="sku" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">SKU<span className="text-destructive">*</span></Label><Input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} className="col-span-1 sm:col-span-3" placeholder="Contoh: SKU-PRD-001" disabled={!!editingProduct} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="productName" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Nama Item<span className="text-destructive">*</span></Label><Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Nama lengkap produk atau jasa" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2">
                <Label htmlFor="category" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Kategori<span className="text-destructive">*</span></Label>
                <Select value={category || undefined} onValueChange={(value) => setCategory(value as ProductCategory)}>
                  <SelectTrigger className="col-span-1 sm:col-span-3"><SelectValue placeholder="Pilih kategori produk/jasa" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Suku Cadang">Suku Cadang</SelectItem><SelectItem value="Aksesoris">Aksesoris</SelectItem><SelectItem value="Oli & Cairan">Oli & Cairan</SelectItem><SelectItem value="Jasa">Jasa</SelectItem><SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="costPrice" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Harga Modal (Rp)<span className="text-destructive">*</span></Label><Input id="costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Contoh: 50000" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="sellingPriceDefault" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Harga Jual Saja (Rp)<span className="text-destructive">*</span></Label><Input id="sellingPriceDefault" type="number" value={sellingPriceDefault} onChange={(e) => setSellingPriceDefault(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Contoh: 75000" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="sellingPricePartner" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Harga Jual Partner (Rp)</Label><Input id="sellingPricePartner" type="number" value={sellingPricePartner} onChange={(e) => setSellingPricePartner(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Opsional, contoh: 65000" /></div>
              {category !== 'Jasa' && (<div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="sellingPriceServicePackage" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Harga Jual + Pasang (Rp)</Label><Input id="sellingPriceServicePackage" type="number" value={sellingPriceServicePackage} onChange={(e) => setSellingPriceServicePackage(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Opsional, contoh: 90000" /></div>)}
              {category !== 'Jasa' && (<>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="stockQuantity" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Stok Saat Ini<span className="text-destructive">*</span></Label><Input id="stockQuantity" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Contoh: 100" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="lowStockThreshold" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Batas Stok Rendah<span className="text-destructive">*</span></Label><Input id="lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Contoh: 10" /></div>
              </>)}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-x-4 gap-y-1 sm:gap-y-2"><Label htmlFor="description" className="col-span-1 text-left sm:text-right sm:col-span-1 pt-2 sm:pr-3">Deskripsi</Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-1 sm:col-span-3" placeholder="Deskripsi singkat item (opsional)" rows={3}/></div>
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-x-4 gap-y-1 sm:gap-y-2">
                  <Label htmlFor="isActiveSwitch" className="col-span-1 text-left sm:text-right sm:col-span-1 sm:pr-3">Status Item</Label>
                  <div className="col-span-1 sm:col-span-3 flex items-center space-x-2"><Switch id="isActiveSwitch" checked={isActive} onCheckedChange={setIsActive} /><span className="text-xs text-muted-foreground">{isActive ? "Aktif (dapat dijual)" : "Nonaktif (tidak tampil di penjualan)"}</span></div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
              <Button type="button" onClick={handleSaveProduct} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


    

    