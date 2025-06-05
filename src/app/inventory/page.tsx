
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, SellingPriceTier, ProductCategory, PriceTierName } from "@/lib/types";
import { PackagePlus, Edit3, Trash2, Search, Filter, AlertTriangle, ArchiveRestore, CheckCircle2, XCircle } from "lucide-react";
import { Label } from '@/components/ui/label';

// Mock data with 'servicePackage' tier
const MOCK_PRODUCTS_INVENTORY_DETAILED: Product[] = [
  { id: 'PROD-1690000001', sku: 'SKU-OLI-001', name: 'Oli Mesin SuperX 1L', category: 'Oli & Cairan', costPrice: 50000, sellingPrices: [{ tierName: 'default', price: 75000 }, { tierName: 'partner', price: 65000 }, { tierName: 'servicePackage', price: 90000 }], stockQuantity: 50, lowStockThreshold: 10, description: "Oli berkualitas tinggi untuk performa maksimal.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000002', sku: 'SKU-PART-001', name: 'Kampas Rem Depan YMH', category: 'Suku Cadang', costPrice: 30000, sellingPrices: [{ tierName: 'default', price: 45000 }, { tierName: 'servicePackage', price: 60000 }], stockQuantity: 30, lowStockThreshold: 5, description: "Kampas rem original Yamaha.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000003', sku: 'SKU-PART-002', name: 'Busi Champion Z9', category: 'Suku Cadang', costPrice: 10000, sellingPrices: [{ tierName: 'default', price: 15000 }, { tierName: 'partner', price: 12000 }, { tierName: 'servicePackage', price: 25000 }], stockQuantity: 0, lowStockThreshold: 20, description: "Busi standar untuk berbagai jenis motor.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000004', sku: 'SKU-JASA-001', name: 'Servis Rutin Ringan', category: 'Jasa', costPrice: 0, sellingPrices: [{ tierName: 'default', price: 100000 }], stockQuantity: 999, lowStockThreshold: 0, description: "Pemeriksaan dan penyetelan ringan.", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'PROD-1690000005', sku: 'SKU-AKSES-001', name: 'Handle Grip Racing CNC', category: 'Aksesoris', costPrice: 75000, sellingPrices: [{ tierName: 'default', price: 120000 }, { tierName: 'partner', price: 100000 }, { tierName: 'servicePackage', price: 140000 }], stockQuantity: 5, lowStockThreshold: 3, description: "Handle grip CNC model racing, anti slip.", isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];


type ProductFilter = 'all' | 'lowStock' | 'outOfStock' | 'inactive' | 'allActive';


export default function InventoryPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
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

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('allActive');


 useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('inventoryProductsBengkelKu');
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed)) {
            setProducts(parsed);
        } else {
            console.warn("Stored inventory data is not an array, using mock data.");
            setProducts(MOCK_PRODUCTS_INVENTORY_DETAILED);
        }
      } else {
        setProducts(MOCK_PRODUCTS_INVENTORY_DETAILED);
      }
    } catch (error) {
      console.error("Failed to parse products from localStorage:", error);
      setProducts(MOCK_PRODUCTS_INVENTORY_DETAILED); 
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Memuat data contoh. Kesalahan: " + (error as Error).message });
    }
    setIsLoading(false);
  }, [toast]); // Corrected: Added toast to dependency array as it's used inside

  useEffect(() => {
    try {
      if (!isLoading) { 
        localStorage.setItem('inventoryProductsBengkelKu', JSON.stringify(products));
      }
    } catch (error) {
      console.error("Failed to save products to localStorage:", error);
      toast({ variant: "destructive", title: "Gagal Menyimpan Data Lokal", description: "Perubahan mungkin tidak tersimpan." });
    }
  }, [products, isLoading, toast]);


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

  const handleSaveProduct = () => {
    const currentProductName = productName.trim();
    const currentSku = sku.trim();
    const currentDescription = description.trim();

    if (!currentProductName) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Nama Produk wajib diisi." });
      return;
    }
    if (!currentSku) { 
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "SKU wajib diisi." });
      return;
    }
    if (!category) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Kategori wajib dipilih." });
      return;
    }

    let parsedCostPrice: number;
    let parsedSellingPriceDefault: number;
    let parsedSellingPricePartner: number | undefined = undefined;
    let parsedSellingPriceServicePackage: number | undefined = undefined;
    let parsedStockQuantity: number;
    let parsedLowStockThreshold: number;

    if (String(costPrice).trim() === '' || isNaN(parseFloat(String(costPrice)))) {
        toast({ variant: "destructive", title: "Data Tidak Valid", description: "Harga Modal wajib diisi dengan angka yang valid." });
        return;
    }
    parsedCostPrice = parseFloat(String(costPrice));

    if (String(sellingPriceDefault).trim() === '' || isNaN(parseFloat(String(sellingPriceDefault)))) {
        toast({ variant: "destructive", title: "Data Tidak Valid", description: "Harga Jual Saja wajib diisi dengan angka yang valid." });
        return;
    }
    parsedSellingPriceDefault = parseFloat(String(sellingPriceDefault));
    
    if (String(sellingPricePartner).trim() !== '') {
        if (isNaN(parseFloat(String(sellingPricePartner)))) {
            toast({ variant: "destructive", title: "Data Tidak Valid", description: "Harga Jual Partner, jika diisi, harus berupa angka yang valid." });
            return;
        }
        parsedSellingPricePartner = parseFloat(String(sellingPricePartner));
    }

    if (category !== 'Jasa' && String(sellingPriceServicePackage).trim() !== '') {
        if (isNaN(parseFloat(String(sellingPriceServicePackage)))) {
            toast({ variant: "destructive", title: "Data Tidak Valid", description: "Harga Jual + Jasa Pasang, jika diisi, harus berupa angka yang valid." });
            return;
        }
        parsedSellingPriceServicePackage = parseFloat(String(sellingPriceServicePackage));
    }
    
    if (category !== 'Jasa') {
      if (String(stockQuantity).trim() === '' || isNaN(parseInt(String(stockQuantity), 10))) {
        toast({ variant: "destructive", title: "Data Tidak Valid", description: "Stok Saat Ini wajib diisi dengan angka yang valid untuk item non-jasa." });
        return;
      }
      parsedStockQuantity = parseInt(String(stockQuantity), 10);

      if (String(lowStockThreshold).trim() === '' || isNaN(parseInt(String(lowStockThreshold), 10))) {
        toast({ variant: "destructive", title: "Data Tidak Valid", description: "Batas Stok Rendah wajib diisi dengan angka yang valid untuk item non-jasa." });
        return;
      }
      parsedLowStockThreshold = parseInt(String(lowStockThreshold), 10);
    } else {
      parsedStockQuantity = 999; 
      parsedLowStockThreshold = 0; 
    }

    if (parsedCostPrice < 0 || parsedSellingPriceDefault < 0 || (parsedSellingPricePartner !== undefined && parsedSellingPricePartner < 0) || (parsedSellingPriceServicePackage !== undefined && parsedSellingPriceServicePackage < 0)) {
        toast({ variant: "destructive", title: "Data Tidak Valid", description: "Harga tidak boleh negatif." });
        return;
    }
    if (category !== 'Jasa' && (parsedStockQuantity < 0 || parsedLowStockThreshold < 0)) {
        toast({ variant: "destructive", title: "Data Tidak Valid", description: "Stok dan Batas Stok Rendah tidak boleh negatif." });
        return;
    }

    const now = new Date().toISOString();
    const productToSaveId = editingProduct ? editingProduct.id : `PROD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const finalSkuForSave = editingProduct ? editingProduct.sku : currentSku;

    const sellingPricesArray: SellingPriceTier[] = [
      { tierName: 'default', price: parsedSellingPriceDefault },
    ];
    if (parsedSellingPricePartner !== undefined) {
      sellingPricesArray.push({ tierName: 'partner', price: parsedSellingPricePartner });
    }
    if (category !== 'Jasa' && parsedSellingPriceServicePackage !== undefined) {
      sellingPricesArray.push({ tierName: 'servicePackage', price: parsedSellingPriceServicePackage });
    }


    const newProductData: Product = {
      id: productToSaveId,
      sku: finalSkuForSave,
      name: currentProductName,
      category: category as ProductCategory, 
      costPrice: parsedCostPrice,
      sellingPrices: sellingPricesArray,
      stockQuantity: parsedStockQuantity,
      lowStockThreshold: parsedLowStockThreshold,
      description: currentDescription,
      isActive: isActive,
      createdAt: editingProduct ? editingProduct.createdAt : now,
      updatedAt: now,
    };

    if (editingProduct) {
      setProducts(prevProducts => prevProducts.map(p => p.id === editingProduct.id ? newProductData : p));
      toast({ title: "Produk Diperbarui", description: `${newProductData.name} telah diperbarui.` });
    } else {
      if (products.some(p => p.sku.toUpperCase() === finalSkuForSave.toUpperCase())) {
          toast({ variant: "destructive", title: "SKU Duplikat", description: `SKU ${finalSkuForSave} sudah ada. Mohon gunakan SKU yang unik.` });
          return;
      }
      setProducts(prevProducts => [newProductData, ...prevProducts]);
      toast({ title: "Produk Ditambahkan", description: `${newProductData.name} telah ditambahkan ke inventaris.` });
    }
    setIsFormDialogOpen(false);
    // resetFormFields(); // Called by onOpenChange
  };

  const handleDeleteProduct = useCallback((productId: string, productName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({ title: "Produk Dihapus", description: `${productName} telah dihapus.` });
    }
  }, [toast]);

  const handleToggleActive = useCallback((productId: string, currentIsActive: boolean) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, isActive: !currentIsActive, updatedAt: new Date().toISOString() } : p));
    toast({ title: "Status Produk Diubah", description: `Produk telah di${!currentIsActive ? 'aktifkan' : 'nonaktifkan'}.` });
  }, [toast]);

 const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    if (searchTerm) {
        tempProducts = tempProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    switch (activeFilter) {
        case 'lowStock':
            tempProducts = tempProducts.filter(p => p.category !== 'Jasa' && p.isActive && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold);
            break;
        case 'outOfStock':
            tempProducts = tempProducts.filter(p => p.category !== 'Jasa' && p.isActive && p.stockQuantity === 0);
            break;
        case 'inactive':
            tempProducts = tempProducts.filter(p => !p.isActive);
            break;
        case 'allActive':
             tempProducts = tempProducts.filter(p => p.isActive);
            break;
        case 'all': 
            break;
    }
    return tempProducts.sort((a, b) => {
        if (a.isActive === b.isActive) {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        return a.isActive ? -1 : 1; 
    });
}, [products, searchTerm, activeFilter]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data inventaris...</p></div>;
  }
  
  const getProductRowClass = (product: Product) => {
    if (!product.isActive) return "bg-muted/40 text-muted-foreground hover:bg-muted/50";
    if (product.category !== 'Jasa') {
        if (product.stockQuantity === 0) return "bg-red-100/70 dark:bg-red-900/30 hover:bg-red-200/70 dark:hover:bg-red-800/40";
        if (product.stockQuantity <= product.lowStockThreshold) return "bg-yellow-100/70 dark:bg-yellow-900/30 hover:bg-yellow-200/70 dark:hover:bg-yellow-800/40";
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
                  Filter ({ activeFilter === 'all' ? 'Semua Item' :
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
                <DropdownMenuItem onClick={() => setActiveFilter('all')}>Tampilkan Semua Item</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filteredAndSortedProducts.length > 0 ? (
            <div className="overflow-x-auto max-h-[60vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">SKU</TableHead>
                    <TableHead className="min-w-[200px]">Nama Item</TableHead>
                    <TableHead className="min-w-[120px]">Kategori</TableHead>
                    <TableHead className="text-right min-w-[120px]">Hrg. Modal</TableHead>
                    <TableHead className="text-right min-w-[120px]">Hrg. Jual Saja</TableHead>
                    <TableHead className="text-right min-w-[120px]">Hrg. Partner</TableHead>
                    <TableHead className="text-right min-w-[140px]">Hrg. Jual + Pasang</TableHead>
                    <TableHead className="text-center min-w-[80px]">Stok</TableHead>
                    <TableHead className="text-center min-w-[80px]">Stok Min.</TableHead>
                    <TableHead className="text-center w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.map((product) => (
                    <TableRow key={product.id} className={getProductRowClass(product)}>
                      <TableCell>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleActive(product.id, product.isActive)}
                          aria-label={product.isActive ? "Nonaktifkan" : "Aktifkan"}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                        {!product.isActive && <Badge variant="outline" className="ml-2 text-xs">Nonaktif</Badge>}
                        {product.category !== 'Jasa' && product.isActive && product.stockQuantity === 0 && <Badge variant="destructive" className="ml-2 text-xs">Habis</Badge>}
                        {product.category !== 'Jasa' && product.isActive && product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold && <Badge variant="outline" className="ml-2 text-xs border-yellow-500 text-yellow-700">Menipis</Badge>}
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">Rp {product.costPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">Rp {product.sellingPrices.find(p => p.tierName === 'default')?.price.toLocaleString() || '-'}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {product.sellingPrices.find(p => p.tierName === 'partner')?.price?.toLocaleString() ? `Rp ${product.sellingPrices.find(p => p.tierName === 'partner')?.price.toLocaleString()}` : '-'}
                      </TableCell>
                       <TableCell className="text-right whitespace-nowrap">
                        {product.category !== 'Jasa' && product.sellingPrices.find(p => p.tierName === 'servicePackage')?.price?.toLocaleString() ? `Rp ${product.sellingPrices.find(p => p.tierName === 'servicePackage')?.price.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">{product.category === 'Jasa' ? '-' : product.stockQuantity}</TableCell>
                      <TableCell className="text-center">{product.category === 'Jasa' ? '-' : product.lowStockThreshold}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => handleOpenFormDialog(product)} title="Edit Item">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProduct(product.id, product.name)} title="Hapus Item">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <Card className="w-full text-center shadow-none border-dashed border-gray-300 py-10">
                <CardHeader className="items-center">
                    {activeFilter === 'all' && !searchTerm ? 
                        <PackagePlus className="w-16 h-16 text-muted-foreground mb-4" /> :
                        <Search className="w-16 h-16 text-muted-foreground mb-4" />
                    }
                    <CardTitle className="text-xl text-foreground">
                    {activeFilter === 'all' && !searchTerm ? "Belum Ada Item" : "Item Tidak Ditemukan"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                    {activeFilter === 'all' && !searchTerm ? 
                        "Saat ini tidak ada item di inventaris. Klik 'Tambah Item Baru' untuk memulai." :
                        "Tidak ada item yang cocok dengan kriteria pencarian atau filter Anda."
                    }
                    </p>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) resetFormFields(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingProduct ? 'Edit Item Inventaris' : 'Tambah Item Baru ke Inventaris'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? `Mengedit detail untuk ${editingProduct.name}.` : 'Masukkan detail item baru.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
            
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="sku" className="text-right col-span-4 sm:col-span-1 pr-3">SKU<span className="text-destructive">*</span></Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} className="col-span-4 sm:col-span-3" placeholder="Contoh: SKU-PRD-001" disabled={!!editingProduct} />
            </div>

            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="productName" className="text-right col-span-4 sm:col-span-1 pr-3">Nama Item<span className="text-destructive">*</span></Label>
              <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Nama lengkap produk atau jasa" />
            </div>

            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="category" className="text-right col-span-4 sm:col-span-1 pr-3">Kategori<span className="text-destructive">*</span></Label>
              <Select value={category || undefined} onValueChange={(value) => setCategory(value as ProductCategory)}>
                <SelectTrigger className="col-span-4 sm:col-span-3">
                  <SelectValue placeholder="Pilih kategori produk/jasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Suku Cadang">Suku Cadang</SelectItem>
                  <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                  <SelectItem value="Oli & Cairan">Oli & Cairan</SelectItem>
                  <SelectItem value="Jasa">Jasa</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="costPrice" className="text-right col-span-4 sm:col-span-1 pr-3">Harga Modal (Rp)<span className="text-destructive">*</span></Label>
              <Input id="costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 50000" />
            </div>

            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="sellingPriceDefault" className="text-right col-span-4 sm:col-span-1 pr-3">Harga Jual Saja (Rp)<span className="text-destructive">*</span></Label>
              <Input id="sellingPriceDefault" type="number" value={sellingPriceDefault} onChange={(e) => setSellingPriceDefault(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 75000" />
            </div>

            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="sellingPricePartner" className="text-right col-span-4 sm:col-span-1 pr-3">Harga Jual Partner (Rp)</Label>
              <Input id="sellingPricePartner" type="number" value={sellingPricePartner} onChange={(e) => setSellingPricePartner(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Opsional, contoh: 65000" />
            </div>
            
            {category !== 'Jasa' && (
              <div className="grid grid-cols-4 items-center">
                <Label htmlFor="sellingPriceServicePackage" className="text-right col-span-4 sm:col-span-1 pr-3">Harga Jual + Pasang (Rp)</Label>
                <Input id="sellingPriceServicePackage" type="number" value={sellingPriceServicePackage} onChange={(e) => setSellingPriceServicePackage(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Opsional, contoh: 90000" />
              </div>
            )}
            
            {category !== 'Jasa' && (
              <>
                <div className="grid grid-cols-4 items-center">
                  <Label htmlFor="stockQuantity" className="text-right col-span-4 sm:col-span-1 pr-3">Stok Saat Ini<span className="text-destructive">*</span></Label>
                  <Input id="stockQuantity" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 100" />
                </div>

                <div className="grid grid-cols-4 items-center">
                  <Label htmlFor="lowStockThreshold" className="text-right col-span-4 sm:col-span-1 pr-3">Batas Stok Rendah<span className="text-destructive">*</span></Label>
                  <Input id="lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 10" />
                </div>
              </>
            )}

            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="description" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Deskripsi</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Deskripsi singkat item (opsional)" rows={3}/>
            </div>
            
            <div className="grid grid-cols-4 items-center">
                <Label htmlFor="isActiveSwitch" className="text-right col-span-4 sm:col-span-1 pr-3">Status Item</Label>
                <div className="col-span-4 sm:col-span-3 flex items-center space-x-2">
                    <Switch id="isActiveSwitch" checked={isActive} onCheckedChange={setIsActive} />
                    <span className="text-xs text-muted-foreground">{isActive ? "Aktif (dapat dijual)" : "Nonaktif (tidak tampil di penjualan)"}</span>
                </div>
            </div>


          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveProduct} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

