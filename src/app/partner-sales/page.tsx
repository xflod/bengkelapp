
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
import { Search, Camera, PlusCircle, MinusCircle, Trash2, CreditCard, ShoppingCart, XCircle, HandCoins, Landmark, Download, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import * as HTML2Canvas from 'html2canvas';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';


// Mock Product Data for Partner Sales - with partner pricing tier
const MOCK_PRODUCTS: Product[] = [
  { id: 'SKU001', name: 'Oli Mesin SuperX Extra Long Name For Testing Wrap Behavior In Tables', category: 'part', costPrice: 50000, sellingPrices: [{ tier: 'default', price: 75000 }, { tier: 'partner', price: 65000 }], stockQuantity: 50, lowStockThreshold: 10, description: "Oli berkualitas tinggi untuk performa maksimal." },
  { id: 'SKU002', name: 'Kampas Rem Depan YMH', category: 'part', costPrice: 30000, sellingPrices: [{ tier: 'default', price: 45000 }, { tier: 'partner', price: 38000 }], stockQuantity: 30, lowStockThreshold: 5, description: "Kampas rem original Yamaha." },
  { id: 'SKU003', name: 'Busi Champion Z9', category: 'part', costPrice: 10000, sellingPrices: [{ tier: 'default', price: 15000 }, { tier: 'partner', price: 12000 }], stockQuantity: 100, lowStockThreshold: 20, description: "Busi standar untuk berbagai jenis motor." },
  { id: 'SKU004', name: 'Servis Rutin Ringan Partner', category: 'service', costPrice: 0, sellingPrices: [{ tier: 'default', price: 100000 }, { tier: 'partner', price: 80000 }], stockQuantity: 999, lowStockThreshold: 0, description: "Pemeriksaan dan penyetelan ringan untuk partner." },
  { id: 'BARCODE123', name: 'Item Scan Barcode Test Partner', category: 'part', costPrice: 20000, sellingPrices: [{ tier: 'default', price: 35000 }, { tier: 'partner', price: 28000 }], stockQuantity: 20, lowStockThreshold: 5, description: "Produk untuk tes barcode scanner (harga partner)." },
  { id: 'SKU005', name: 'Air Filter Racing Performance High Flow', category: 'part', costPrice: 80000, sellingPrices: [{ tier: 'default', price: 120000 }, { tier: 'partner', price: 100000 }], stockQuantity: 15, lowStockThreshold: 3, description: "Filter udara untuk peningkatan performa." },
  { id: 'SKU006', name: 'Ban Dalam Swallow 17" Premium Quality', category: 'part', costPrice: 15000, sellingPrices: [{ tier: 'default', price: 25000 }, { tier: 'partner', price: 20000 }], stockQuantity: 60, lowStockThreshold: 10, description: "Ban dalam ukuran 17 inch." },
];

interface ReceiptDetails {
  transactionId: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  paymentMethod: 'Tunai' | 'Transfer';
  cashReceived?: number;
  changeCalculated?: number;
  customerName?: string; 
  receiptTitle?: string;
}

export default function PartnerSalesPage() {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  
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

  const [receiptDetails, setReceiptDetails] = React.useState<ReceiptDetails | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);

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
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast]);

  const handleAddToCart = (product: Product) => {
    const partnerPriceInfo = product.sellingPrices.find(p => p.tier === 'partner');
    if (!partnerPriceInfo) {
      toast({ variant: "destructive", title: "Harga Partner Tidak Tersedia", description: `Produk ${product.name} tidak memiliki harga partner.` });
      return;
    }
    const price = partnerPriceInfo.price;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stockQuantity || product.category === 'service') {
          return prevCart.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } : item
          );
        } else {
          toast({ variant: "destructive", title: "Stok Tidak Cukup", description: `Stok ${product.name} hanya tersisa ${product.stockQuantity}.` });
          return prevCart;
        }
      } else {
         if (1 <= product.stockQuantity || product.category === 'service') {
          return [...prevCart, { productId: product.id, productName: product.name, quantity: 1, unitPrice: price, totalPrice: price }];
        } else {
          toast({ variant: "destructive", title: "Stok Habis", description: `Stok ${product.name} telah habis.` });
          return prevCart;
        }
      }
    });
    toast({ title: "Ditambahkan ke Keranjang (Partner)", description: `${product.name} telah ditambahkan.` });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const productInCart = MOCK_PRODUCTS.find(p => p.id === productId);
    if (!productInCart) return;
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    if (productInCart.category !== 'service' && newQuantity > productInCart.stockQuantity) {
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
    if (isCameraOpen && searchTerm.toUpperCase().startsWith("BARCODE")) { 
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
      setChangeCalculated(0); 
    }
  }, [cashReceived, paymentMethodTab, calculateSubtotal]);

  const handlePresetCash = (amount: number) => {
    setCashReceived(String(amount));
  };

  const completeTransaction = (paymentType: 'Tunai' | 'Transfer', details: string) => {
    const currentSubtotal = calculateSubtotal();
    const currentCashReceived = parseFloat(cashReceived) || 0;
    const currentChangeCalculated = paymentType === 'Tunai' ? Math.max(0, currentCashReceived - currentSubtotal) : 0;

    const newReceipt: ReceiptDetails = {
      transactionId: `INV-PARTNER-${Date.now()}`,
      date: format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeID }),
      items: [...cart],
      subtotal: currentSubtotal,
      paymentMethod: paymentType,
      cashReceived: paymentType === 'Tunai' ? currentCashReceived : undefined,
      changeCalculated: paymentType === 'Tunai' ? currentChangeCalculated : undefined,
      customerName: "Bengkel Mitra", 
      receiptTitle: "Nota Transaksi Mitra"
    };
    setReceiptDetails(newReceipt);

    toast({ title: "Transaksi Partner Berhasil", description: `${details}. Nota tersedia.` });
    setCart([]);
    setSearchTerm("");
    setIsPaymentDialogOpen(false);
    setCashReceived("");
    setChangeCalculated(0);
    setIsReceiptModalOpen(true);
  }

  const confirmCashPayment = () => {
    const subtotal = calculateSubtotal();
    const received = parseFloat(cashReceived) || 0;
    if (received < subtotal) {
      toast({ variant: "destructive", title: "Uang Kurang", description: "Jumlah uang yang diterima kurang dari total belanja." });
      return;
    }
    completeTransaction("Tunai", `Kembalian: Rp ${changeCalculated.toLocaleString()}`);
  };

  const confirmTransferPayment = () => {
    completeTransaction("Transfer", "Menunggu konfirmasi transfer.");
  };

  const handleDownloadReceipt = () => {
    if (receiptRef.current && HTML2Canvas) {
      HTML2Canvas.default(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
        const image = canvas.toDataURL("image/png", 0.8);
        const link = document.createElement('a');
        link.href = image;
        link.download = `nota_partner_${receiptDetails?.transactionId || 'transaksi'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Nota Partner Diunduh", description: "Nota transaksi partner telah berhasil diunduh." });
      }).catch(err => {
        console.error("Error generating receipt image:", err);
        toast({ variant: "destructive", title: "Gagal Unduh Nota", description: "Terjadi kesalahan saat membuat gambar nota." });
      });
    }
  };

  const handleShareToWhatsApp = () => {
    if (!receiptDetails) return;

    let message = `*${receiptDetails.receiptTitle || 'Nota Transaksi BengkelKu'}*\n\n`;
    message += `ID Transaksi: ${receiptDetails.transactionId}\n`;
    message += `Tanggal: ${receiptDetails.date}\n`;
    if (receiptDetails.customerName) {
      message += `Partner: ${receiptDetails.customerName}\n`;
    }
    message += `------------------------------------\n`;
    receiptDetails.items.forEach(item => {
      message += `${item.productName} (x${item.quantity})\n`;
      message += `  Rp ${item.unitPrice.toLocaleString()} x ${item.quantity} = Rp ${item.totalPrice.toLocaleString()}\n`;
    });
    message += `------------------------------------\n`;
    message += `*Total Belanja: Rp ${receiptDetails.subtotal.toLocaleString()}*\n`;
    message += `Metode Pembayaran: ${receiptDetails.paymentMethod}\n`;
    if (receiptDetails.paymentMethod === 'Tunai') {
      message += `Uang Diterima: Rp ${receiptDetails.cashReceived?.toLocaleString() || 0}\n`;
      message += `Kembalian: Rp ${receiptDetails.changeCalculated?.toLocaleString() || 0}\n`;
    }
    message += `------------------------------------\n`;
    message += `Terima kasih atas kerjasamanya!\n\n`;
    message += `_Nota ini juga dapat diunduh dalam format PNG._`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast({ title: "Bagikan ke WhatsApp", description: "Siapkan pesan untuk WhatsApp. Anda dapat melampirkan nota yang sudah diunduh." });
  };


  const subtotal = calculateSubtotal();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penjualan Partner Bengkel"
        description="Catat transaksi penjualan ke bengkel mitra dengan harga khusus."
        actions={
          <Button 
            onClick={openPaymentDialog} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-normal text-center md:text-left md:whitespace-nowrap px-3 sm:px-4 py-2 text-sm sm:text-base" 
            disabled={cart.length === 0}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Bayar (Rp {subtotal.toLocaleString()})
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Cari Produk (Harga Partner)</CardTitle>
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
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted border" autoPlay muted playsInline />
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
                        <TableHead className="text-right">Harga Partner</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const partnerPriceInfo = product.sellingPrices.find(p => p.tier === 'partner');
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium break-words max-w-[150px] sm:max-w-xs">
                              {product.name} <br/> <span className="text-xs text-muted-foreground">({product.id})</span>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">Rp {partnerPriceInfo?.price.toLocaleString() || 'N/A'}</TableCell>
                            <TableCell className="text-center">{product.category === 'service' ? '-' : product.stockQuantity}</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="icon" 
                                onClick={() => handleAddToCart(product)}
                                disabled={(product.category !== 'service' && product.stockQuantity <= 0) || !partnerPriceInfo}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8"
                                title="Tambah ke Keranjang"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
          <Card className="shadow-md md:sticky md:top-20">
            <CardHeader>
              <CardTitle>Keranjang Belanja Partner</CardTitle>
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
                          <TableCell className="font-medium text-sm break-words max-w-[100px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-xs">{item.productName}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}>
                                <MinusCircle className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm">{item.quantity}</span>
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}>
                                <PlusCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm whitespace-nowrap">Rp {item.totalPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.productId)} className="text-destructive hover:text-destructive/80 h-7 w-7">
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
                  <span>Total Akhir (Partner):</span>
                  <span className="whitespace-nowrap">Rp {subtotal.toLocaleString()}</span>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Proses Pembayaran Partner</DialogTitle>
            <DialogDescription>
              Total Belanja: <span className="font-semibold whitespace-nowrap">Rp {subtotal.toLocaleString()}</span>
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
                  className="text-base w-full"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handlePresetCash(subtotal)} className="flex-1 text-xs min-w-[80px]">Uang Pas</Button>
                <Button variant="outline" onClick={() => handlePresetCash(50000)} className="flex-1 text-xs min-w-[80px]">Rp 50rb</Button>
                <Button variant="outline" onClick={() => handlePresetCash(100000)} className="flex-1 text-xs min-w-[80px]">Rp 100rb</Button>
              </div>
               <div className="space-y-1 text-right">
                 <p className="text-sm whitespace-nowrap">Total: Rp {subtotal.toLocaleString()}</p>
                 <p className="text-sm whitespace-nowrap">Dibayar: Rp {(parseFloat(cashReceived) || 0).toLocaleString()}</p>
                <p className="text-lg font-semibold whitespace-nowrap">
                  Kembali: Rp {changeCalculated >= 0 ? changeCalculated.toLocaleString() : '0'}
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
                Silakan lakukan transfer sejumlah <span className="font-semibold text-foreground whitespace-nowrap">Rp {subtotal.toLocaleString()}</span> ke rekening berikut:
              </p>
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium">Bank XYZ</p>
                <p>No. Rekening: <span className="font-semibold">123-456-7890</span></p>
                <p>Atas Nama: <span className="font-semibold">BengkelKu Jaya (Partner)</span></p>
              </div>
              <Button onClick={confirmTransferPayment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Sudah Transfer & Konfirmasi
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="sm:justify-start mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Batal
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-sm w-[90vw]">
          <DialogHeader>
            <DialogTitle>{receiptDetails?.receiptTitle || "Nota Transaksi"}</DialogTitle>
            <DialogDescription>
              ID: {receiptDetails?.transactionId}
            </DialogDescription>
          </DialogHeader>
          
          <div ref={receiptRef} id="receipt-content" className="p-4 border rounded-md bg-white text-black text-xs">
            <div className="text-center mb-2">
              <h3 className="font-bold text-sm">BengkelKu App (Partner)</h3>
              <p>Jl. Otomotif No. 1, Kota Maju</p>
              <p>Telp: 0812-3456-7890</p>
            </div>
            <hr className="my-1 border-dashed border-gray-400"/>
            <p>No: {receiptDetails?.transactionId}</p>
            <p>Tgl: {receiptDetails?.date}</p>
            {receiptDetails?.customerName && <p>Partner: {receiptDetails.customerName}</p>}
            <hr className="my-1 border-dashed border-gray-400"/>
            <table className="w-full my-1 table-fixed">
              <thead>
                <tr>
                  <th className="text-left font-normal w-[40%]">Item</th>
                  <th className="text-center font-normal w-[15%]">Qty</th>
                  <th className="text-right font-normal w-[22.5%]">Harga</th>
                  <th className="text-right font-normal w-[22.5%]">Total</th>
                </tr>
              </thead>
              <tbody>
                {receiptDetails?.items.map(item => (
                  <tr key={item.productId}>
                    <td className="py-0.5 break-words">{item.productName}</td>
                    <td className="text-center py-0.5">{item.quantity}</td>
                    <td className="text-right py-0.5 break-words">{item.unitPrice.toLocaleString()}</td>
                    <td className="text-right py-0.5 break-words">{item.totalPrice.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="my-1 border-dashed border-gray-400"/>
            <div className="text-right">
              <p className="whitespace-nowrap">Subtotal: <span className="font-semibold">Rp {receiptDetails?.subtotal.toLocaleString()}</span></p>
              {receiptDetails?.paymentMethod === 'Tunai' && (
                <>
                  <p className="whitespace-nowrap">Tunai: Rp {receiptDetails?.cashReceived?.toLocaleString()}</p>
                  <p className="whitespace-nowrap">Kembali: Rp {receiptDetails?.changeCalculated?.toLocaleString()}</p>
                </>
              )}
               <p>Metode: {receiptDetails?.paymentMethod}</p>
            </div>
            <hr className="my-1 border-dashed border-gray-400"/>
            <p className="text-center mt-2">Terima Kasih atas Kerjasamanya!</p>
            <p className="text-center text-[0.6rem]">Layanan & Suku Cadang Motor (Mitra)</p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <Button onClick={handleDownloadReceipt} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Unduh Nota (PNG)
            </Button>
            <Button onClick={handleShareToWhatsApp} variant="outline" className="w-full sm:w-auto">
              <Share2 className="mr-2 h-4 w-4" /> Bagikan ke WhatsApp
            </Button>
            <DialogClose asChild>
              <Button type="button" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
                Tutup
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
