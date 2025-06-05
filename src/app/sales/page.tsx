
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { Product, SaleItem } from "@/lib/types";
import { Search, Camera, PlusCircle, MinusCircle, Trash2, CreditCard, ShoppingCart, XCircle, HandCoins, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// Mock Product Data - In a real app, this would come from a database/API
const MOCK_PRODUCTS: Product[] = [
  { id: 'SKU001', name: 'Oli Mesin SuperX', category: 'part', costPrice: 50000, sellingPrices: [{ tier: 'default', price: 75000 }], stockQuantity: 50, lowStockThreshold: 10, description: "Oli berkualitas tinggi untuk performa maksimal." },
  { id: 'SKU002', name: 'Kampas Rem Depan YMH', category: 'part', costPrice: 30000, sellingPrices: [{ tier: 'default', price: 45000 }], stockQuantity: 30, lowStockThreshold: 5, description: "Kampas rem original Yamaha." },
  { id: 'SKU003', name: 'Busi Champion Z9', category: 'part', costPrice: 10000, sellingPrices: [{ tier: 'default', price: 15000 }], stockQuantity: 100, lowStockThreshold: 20, description: "Busi standar untuk berbagai jenis motor." },
  { id: 'SKU004', name: 'Servis Rutin Ringan', category: 'service', costPrice: 0, sellingPrices: [{ tier: 'default', price: 100000 }], stockQuantity: 999, lowStockThreshold: 0, description: "Pemeriksaan dan penyetelan ringan." },
  { id: 'BARCODE123', name: 'Item Scan Barcode Test', category: 'part', costPrice: 20000, sellingPrices: [{ tier: 'default', price: 35000 }], stockQuantity: 20, lowStockThreshold: 5, description: "Produk untuk tes barcode scanner." },
  { id: 'SKU005', name: 'Air Filter Racing', category: 'part', costPrice: 80000, sellingPrices: [{ tier: 'default', price: 120000 }], stockQuantity: 15, lowStockThreshold: 3, description: "Filter udara untuk peningkatan performa." },
  { id: 'SKU006', name: 'Ban Dalam Swallow 17"', category: 'part', costPrice: 15000, sellingPrices: [{ tier: 'default', price: 25000 }], stockQuantity: 60, lowStockThreshold: 10, description: "Ban dalam ukuran 17 inch." },
];

export default function SalesPage() {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [cart, setCart] = React.useState<SaleItem[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>(MOCK_PRODUCTS);
  
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [paymentMethodTab, setPaymentMethodTab] = React.useState<'cash' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = React.useState("");
  const [changeCalculated, setChangeCalculated] = React.useState(0);

  React.useEffect(() => {
    const results = MOCK_PRODUCTS.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(results);
  }, [searchTerm]);

  React.useEffect(() => {
    if (isCameraOpen) {
      const getCameraPermission = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setHasCameraPermission(true);
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Akses Kamera Ditolak',
            description: 'Mohon izinkan akses kamera di pengaturan browser Anda untuk menggunakan fitur ini.',
          });
          setIsCameraOpen(false);
        }
      };
      getCameraPermission();
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setHasCameraPermission(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast]);

  const handleAddToCart = (product: Product) => {
    if (product.sellingPrices.length === 0) {
      toast({ variant: "destructive", title: "Harga Tidak Tersedia", description: `Produk ${product.name} tidak memiliki harga jual.` });
      return;
    }
    const price = product.sellingPrices[0].price;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stockQuantity) {
          return prevCart.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } : item
          );
        } else {
          toast({ variant: "destructive", title: "Stok Tidak Cukup", description: `Stok ${product.name} hanya tersisa ${product.stockQuantity}.` });
          return prevCart;
        }
      } else {
        if (1 <= product.stockQuantity) {
          return [...prevCart, { productId: product.id, productName: product.name, quantity: 1, unitPrice: price, totalPrice: price }];
        } else {
          toast({ variant: "destructive", title: "Stok Habis", description: `Stok ${product.name} telah habis.` });
          return prevCart;
        }
      }
    });
    toast({ title: "Ditambahkan ke Keranjang", description: `${product.name} telah ditambahkan.` });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const productInCart = MOCK_PRODUCTS.find(p => p.id === productId);
    if (!productInCart) return;
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (newQuantity > productInCart.stockQuantity) {
      toast({ variant: "destructive", title: "Stok Tidak Cukup", description: `Stok ${productInCart.name} hanya tersisa ${productInCart.stockQuantity}.` });
      setCart(prevCart =>
        prevCart.map(item =>
          item.productId === productId ? { ...item, quantity: productInCart.stockQuantity, totalPrice: productInCart.stockQuantity * item.unitPrice } : item
        )
      );
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
    toast({ title: "Dihapus dari Keranjang", description: `Item telah dihapus.` });
  };

  const calculateSubtotal = React.useCallback(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  const openPaymentDialog = () => {
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Keranjang Kosong", description: "Tambahkan item ke keranjang sebelum melanjutkan." });
      return;
    }
    setCashReceived("");
    setChangeCalculated(0);
    setPaymentMethodTab('cash');
    setIsPaymentDialogOpen(true);
  };
  
  const handleBarcodeScanned = (barcode: string) => {
    const product = MOCK_PRODUCTS.find(p => p.id.toLowerCase() === barcode.toLowerCase());
    if (product) {
      handleAddToCart(product);
      setSearchTerm(""); 
      setIsCameraOpen(false); 
    } else {
      toast({ variant: "destructive", title: "Produk Tidak Ditemukan", description: `Barcode ${barcode} tidak cocok dengan produk manapun.` });
    }
  };
  
  React.useEffect(() => {
    if (isCameraOpen && searchTerm.length > 3 && searchTerm.startsWith("BAR")) { 
      toast({ title: "Barcode Terdeteksi (Simulasi)", description: `Mencari produk dengan barcode: ${searchTerm}` });
      handleBarcodeScanned(searchTerm);
    }
  }, [searchTerm, isCameraOpen]);

  React.useEffect(() => {
    const subtotal = calculateSubtotal();
    const received = parseFloat(cashReceived) || 0;
    if (paymentMethodTab === 'cash' && received >= subtotal) {
      setChangeCalculated(received - subtotal);
    } else if (paymentMethodTab === 'cash') {
      setChangeCalculated(0); // Or handle as negative if you want to show deficit
    }
  }, [cashReceived, paymentMethodTab, calculateSubtotal]);

  const handlePresetCash = (amount: number) => {
    setCashReceived(String(amount));
  };

  const completeTransaction = (paymentType: string, details: string) => {
    toast({ title: "Transaksi Berhasil", description: `${paymentType}. ${details}` });
    setCart([]);
    setSearchTerm("");
    setIsPaymentDialogOpen(false);
    setCashReceived("");
    setChangeCalculated(0);
  }

  const confirmCashPayment = () => {
    const subtotal = calculateSubtotal();
    const received = parseFloat(cashReceived) || 0;
    if (received < subtotal) {
      toast({ variant: "destructive", title: "Uang Kurang", description: "Jumlah uang yang diterima kurang dari total belanja." });
      return;
    }
    completeTransaction("Pembayaran Tunai", `Kembalian: Rp ${changeCalculated.toLocaleString()}`);
  };

  const confirmTransferPayment = () => {
    completeTransaction("Pembayaran Transfer", "Menunggu konfirmasi transfer dari admin.");
  };

  const subtotal = calculateSubtotal();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Penjualan (POS)"
        description="Catat transaksi penjualan jasa dan barang."
        actions={
          <Button onClick={openPaymentDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={cart.length === 0}>
            <CreditCard className="mr-2 h-4 w-4" />
            Bayar (Rp {subtotal.toLocaleString()})
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Cari Produk</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ketik kode, nama produk, atau scan barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => setIsCameraOpen(!isCameraOpen)} title={isCameraOpen ? "Tutup Scanner" : "Buka Scanner Barcode"}>
                  {isCameraOpen ? <XCircle className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                </Button>
              </div>
              
              {isCameraOpen && (
                <div className="space-y-2">
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                  {hasCameraPermission === false && (
                    <Alert variant="destructive">
                      <AlertTitle>Akses Kamera Dibutuhkan</AlertTitle>
                      <AlertDescription>
                        Izinkan akses kamera untuk menggunakan pemindai barcode. Jika sudah, coba tutup dan buka kembali scanner.
                        <br/><i>(Simulasi: Ketik 'BARCODE123' di pencarian untuk tes)</i>
                      </AlertDescription>
                    </Alert>
                  )}
                  {hasCameraPermission === true && (
                     <Alert>
                      <AlertTitle>Pemindai Aktif</AlertTitle>
                      <AlertDescription>
                        Arahkan kamera ke barcode. <i>(Simulasi: Ketik 'BARCODE123' di pencarian untuk tes)</i>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Hasil Pencarian ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Produk</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name} <br/> <span className="text-xs text-muted-foreground">({product.id})</span></TableCell>
                          <TableCell className="text-right">Rp {product.sellingPrices[0]?.price.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell className="text-center">{product.stockQuantity}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              size="sm" 
                              onClick={() => handleAddToCart(product)}
                              disabled={product.stockQuantity <= 0 || product.sellingPrices.length === 0}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Tidak ada produk yang cocok dengan pencarian Anda.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-1/3 space-y-4">
          <Card className="shadow-md sticky top-20">
            <CardHeader>
              <CardTitle>Keranjang Belanja</CardTitle>
              <CardDescription>Total Item: {cart.reduce((sum, item) => sum + item.quantity, 0)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length > 0 ? (
                <div className="max-h-[450px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map(item => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium text-sm">{item.productName}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}>
                                <MinusCircle className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">Rp {item.totalPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.productId)} className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Keranjang belanja kosong.</p>
              )}
            </CardContent>
            {cart.length > 0 && (
              <CardFooter className="flex flex-col space-y-2 pt-4 border-t">
                <div className="flex justify-between w-full font-semibold text-lg">
                  <span>Total Akhir:</span>
                  <span>Rp {subtotal.toLocaleString()}</span>
                </div>
                {/* Button "Lanjutkan ke Pembayaran" dihapus dari sini, karena PageHeader button yang dipakai */}
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
            <DialogDescription>
              Total Belanja: <span className="font-semibold">Rp {subtotal.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={paymentMethodTab} onValueChange={(value) => setPaymentMethodTab(value as 'cash' | 'transfer')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cash"><HandCoins className="mr-2 h-4 w-4" />Tunai</TabsTrigger>
              <TabsTrigger value="transfer"><Landmark className="mr-2 h-4 w-4" />Transfer</TabsTrigger>
            </TabsList>
            <TabsContent value="cash" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cashReceived">Jumlah Uang Diterima (Rp)</Label>
                <Input 
                  id="cashReceived" 
                  type="number" 
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="e.g. 150000"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handlePresetCash(50000)} className="flex-1">Rp 50.000</Button>
                <Button variant="outline" onClick={() => handlePresetCash(100000)} className="flex-1">Rp 100.000</Button>
              </div>
               <div className="space-y-1">
                 <p className="text-sm font-medium">Total Belanja: Rp {subtotal.toLocaleString()}</p>
                 <p className="text-sm">Uang Diterima: Rp {(parseFloat(cashReceived) || 0).toLocaleString()}</p>
                <p className="text-lg font-semibold">
                  Kembalian: Rp {changeCalculated >= 0 ? changeCalculated.toLocaleString() : '0'}
                </p>
                {(parseFloat(cashReceived) || 0) < subtotal && cashReceived !== "" && (
                  <p className="text-sm text-destructive">Uang tunai yang dimasukkan kurang.</p>
                )}
              </div>
              <Button 
                onClick={confirmCashPayment} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={(parseFloat(cashReceived) || 0) < subtotal}
              >
                Konfirmasi Pembayaran Tunai
              </Button>
            </TabsContent>
            <TabsContent value="transfer" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Silakan lakukan transfer sejumlah <span className="font-semibold text-foreground">Rp {subtotal.toLocaleString()}</span> ke rekening berikut:
              </p>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">Bank XYZ</p>
                <p>No. Rekening: <span className="font-semibold">123-456-7890</span></p>
                <p>Atas Nama: <span className="font-semibold">BengkelKu Jaya</span></p>
              </div>
              <Button onClick={confirmTransferPayment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Sudah Transfer & Konfirmasi
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-start mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Batal
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

