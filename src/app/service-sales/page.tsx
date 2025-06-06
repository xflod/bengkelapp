
"use client";

import * as React from "react";
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { Product, SaleItem, SaleTransactionForReport, ReportSaleItem, PriceTierName, SellingPriceTier, ShopSettings } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { Search, Camera, PlusCircle, MinusCircle, Trash2, CreditCard, ShoppingCart, XCircle, HandCoins, Landmark, Download, Share2, Percent } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import * as HTML2Canvas from 'html2canvas';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });


interface ReceiptDetails {
  transactionId: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  finalTotal: number;
  paymentMethod: 'Tunai' | 'Transfer';
  cashReceived?: number;
  changeCalculated?: number;
  customerName?: string;
  serviceNotes?: string;
  receiptTitle?: string;
  shopName?: string;
  shopAddress?: string;
  shopWhatsapp?: string;
}

export default function ServiceSalesPage() {
  const { toast } = useToast();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);
  
  const [inventoryProducts, setInventoryProducts] = React.useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [cart, setCart] = React.useState<SaleItem[]>([]);
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  const [serviceNotes, setServiceNotes] = React.useState("");
  
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
  const [paymentMethodTab, setPaymentMethodTab] = React.useState<'cash' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = React.useState("");
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [changeCalculated, setChangeCalculated] = React.useState(0);

  const [receiptDetails, setReceiptDetails] = React.useState<ReceiptDetails | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = React.useState(false);
  const [customerName, setCustomerName] = React.useState("Pelanggan Servis");
  const [shopSettings, setShopSettings] = React.useState<ShopSettings | null>(null);

  const paymentDialogTitleId = React.useId();
  const receiptDialogTitleId = React.useId();

  React.useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .filter('selling_prices', 'cs', '[{"tierName":"default"}]');
      
      if (productsError) {
        console.error("Error fetching products for service page (raw):", JSON.stringify(productsError, null, 2));
        let detailedMessage = "Gagal memuat item servis dari server.";
        // ... (existing error handling)
        toast({variant: "destructive", title: "Gagal Memuat Item Servis", description: detailedMessage});
        setInventoryProducts([]);
      } else {
        const transformedData = productsData.map(p => ({
          ...p,
          id: String(p.id),
          sellingPrices: typeof p.selling_prices === 'string' ? JSON.parse(p.selling_prices) : p.selling_prices,
          costPrice: p.cost_price,
          stockQuantity: p.stock_quantity,
          lowStockThreshold: p.low_stock_threshold,
          isActive: p.is_active,
        }));
        setInventoryProducts(transformedData as Product[]);
        setFilteredProducts(transformedData as Product[]);
      }
      // Fetch Shop Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('shop_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        toast({ variant: "destructive", title: "Gagal memuat pengaturan bengkel untuk nota" });
      } else if (settingsData) {
        setShopSettings(settingsData as ShopSettings);
      }
    };
    fetchInitialData();
  }, [toast]);

  React.useEffect(() => { const results = inventoryProducts.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase())); setFilteredProducts(results); }, [searchTerm, inventoryProducts]);
  React.useEffect(() => { if (isCameraOpen) { const getCameraPermission = async () => { try { const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); setHasCameraPermission(true); setStream(mediaStream); if (videoRef.current) videoRef.current.srcObject = mediaStream; } catch (error) { setHasCameraPermission(false); toast({ variant: 'destructive', title: 'Akses Kamera Ditolak' }); setIsCameraOpen(false); } }; getCameraPermission(); } else { if (stream) stream.getTracks().forEach(track => track.stop()); if (videoRef.current) videoRef.current.srcObject = null; } return () => { if (stream) stream.getTracks().forEach(track => track.stop()); }; }, [isCameraOpen, toast, stream]);
  
  const getApplicablePriceInfo = (product: Product): { price: number; tier: PriceTierName } | null => {
    const servicePackagePriceInfo = product.sellingPrices.find(p => p.tierName === 'servicePackage');
    const defaultPriceInfo = product.sellingPrices.find(p => p.tierName === 'default');

    if (product.category !== 'Jasa' && servicePackagePriceInfo) {
      return { price: servicePackagePriceInfo.price, tier: 'servicePackage' };
    }
    if (defaultPriceInfo) {
      return { price: defaultPriceInfo.price, tier: 'default' };
    }
    return null;
  };

  const handleAddToCart = React.useCallback((product: Product) => { 
    const applicablePrice = getApplicablePriceInfo(product);

    if (!applicablePrice) {
      toast({ variant: "destructive", title: "Harga Tidak Tersedia", description: `Produk ${product.name} tidak memiliki harga jual yang sesuai.` });
      return;
    }
    const { price, tier } = applicablePrice;

    setCart(prevCart => { 
        const existingItem = prevCart.find(item => item.productId === product.id);
        if (existingItem) { 
            if (product.category === 'Jasa' || existingItem.quantity < product.stockQuantity) { 
                return prevCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice, priceTierUsed: tier } : item); 
            } else { 
                toast({ variant: "destructive", title: "Stok Tidak Cukup", description: `Stok ${product.name} hanya tersisa ${product.stockQuantity}.` }); 
                return prevCart; 
            } 
        } else { 
            if (product.category === 'Jasa' || 1 <= product.stockQuantity) { 
                return [...prevCart, { productId: product.id, productName: product.name, quantity: 1, unitPrice: price, totalPrice: price, category: product.category, priceTierUsed: tier }]; 
            } else { 
                toast({ variant: "destructive", title: "Stok Habis", description: `Stok ${product.name} telah habis.` }); 
                return prevCart; 
            } 
        } 
    }); 
    toast({ title: "Ditambahkan ke Keranjang", description: `${product.name}${tier === 'servicePackage' ? ' (Paket Servis)' : ''} telah ditambahkan.` }); 
  }, [toast, setCart]);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => { const productInCart = inventoryProducts.find(p => p.id === productId); if (!productInCart) return; const cartItem = cart.find(item => item.productId === productId); if (!cartItem) return; if (newQuantity <= 0) { handleRemoveFromCart(productId); return; } if (productInCart.category !== 'Jasa' && newQuantity > productInCart.stockQuantity) { toast({ variant: "destructive", title: "Stok Tidak Cukup", description: `Stok ${productInCart.name} hanya tersisa ${productInCart.stockQuantity}.` }); setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, quantity: productInCart.stockQuantity, totalPrice: productInCart.stockQuantity * item.unitPrice } : item)); return; } setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice } : item)); };
  const handleRemoveFromCart = (productId: string) => { setCart(prevCart => prevCart.filter(item => item.productId !== productId)); toast({ title: "Dihapus dari Keranjang" }); };
  const calculateSubtotal = React.useCallback(() => cart.reduce((total, item) => total + item.totalPrice, 0), [cart]);
  const parsedDiscount = React.useMemo(() => { const discount = parseFloat(discountAmount); return isNaN(discount) || discount < 0 ? 0 : discount; }, [discountAmount]);
  const calculateFinalTotal = React.useCallback(() => { const subtotal = calculateSubtotal(); const actualDiscount = Math.min(parsedDiscount, subtotal); return Math.max(0, subtotal - actualDiscount); }, [calculateSubtotal, parsedDiscount]);
  const openPaymentDialog = () => { if (cart.length === 0) { toast({ variant: "destructive", title: "Keranjang Kosong" }); return; } setCashReceived(""); setChangeCalculated(0); setPaymentMethodTab('cash'); setIsPaymentDialogOpen(true); };
  
  const handleBarcodeScanned = React.useCallback((barcode: string) => { 
    const product = inventoryProducts.find(p => p.sku.toLowerCase() === barcode.toLowerCase()); 
    if (product) { 
      handleAddToCart(product); 
      setSearchTerm(""); 
      setIsCameraOpen(false); 
    } else { 
      toast({ variant: "destructive", title: "Produk Tidak Ditemukan" }); 
    } 
  }, [inventoryProducts, handleAddToCart, toast, setSearchTerm, setIsCameraOpen]);

  React.useEffect(() => { if (isCameraOpen && searchTerm.toUpperCase().startsWith("BARCODE")) { handleBarcodeScanned(searchTerm.toUpperCase()); } }, [searchTerm, isCameraOpen, handleBarcodeScanned]);
  React.useEffect(() => { const finalTotal = calculateFinalTotal(); const received = parseFloat(cashReceived) || 0; if (paymentMethodTab === 'cash' && received >= finalTotal) { setChangeCalculated(received - finalTotal); } else if (paymentMethodTab === 'cash') { setChangeCalculated(0); } }, [cashReceived, paymentMethodTab, calculateFinalTotal]);
  const handlePresetCash = (amount: number) => { setCashReceived(String(amount)); };

  const completeTransaction = async (paymentType: 'Tunai' | 'Transfer', details: string) => {
    const transactionDate = new Date();
    const transactionId = `INV-SVC-${transactionDate.getTime()}`;
    const currentSubtotal = calculateSubtotal();
    const currentFinalTotal = calculateFinalTotal();
    const currentCashReceived = parseFloat(cashReceived) || 0;
    const currentChangeCalculated = paymentType === 'Tunai' ? Math.max(0, currentCashReceived - currentFinalTotal) : 0;
    const actualDiscount = Math.min(parsedDiscount, currentSubtotal);

    const reportItems: ReportSaleItem[] = cart.map(cartItem => { const productDetails = inventoryProducts.find(p => p.id === cartItem.productId); const costPrice = productDetails?.costPrice || 0; return { productId: cartItem.productId, productName: cartItem.productName, sku: productDetails?.sku || 'N/A', category: cartItem.category || 'Lainnya', quantity: cartItem.quantity, unitPrice: cartItem.unitPrice, costPrice: costPrice, totalRevenue: cartItem.totalPrice, totalCOGS: costPrice * cartItem.quantity, profit: cartItem.totalPrice - (costPrice * cartItem.quantity), }; });

    const transactionForReportSupabase = {
      transaction_id_client: transactionId, date: transactionDate.toISOString(), items: reportItems, subtotal: currentSubtotal,
      discount_applied: actualDiscount, final_amount: currentFinalTotal,
      total_cogs: reportItems.reduce((sum, item) => sum + item.totalCOGS, 0),
      total_profit: currentFinalTotal - reportItems.reduce((sum, item) => sum + item.totalCOGS, 0),
      payment_method: paymentType, customer_name: customerName || "Pelanggan Servis", service_notes: serviceNotes,
      type: 'Service' as 'Service', created_at: transactionDate.toISOString(),
    };

    const { error: saleError } = await supabase.from('sales_transactions').insert([transactionForReportSupabase]);
    if (saleError) { toast({ variant: "destructive", title: "Gagal Menyimpan Transaksi Servis", description: saleError.message }); return; }

    for (const cartItem of cart) { if (cartItem.category !== 'Jasa') { const product = inventoryProducts.find(p => p.id === cartItem.productId); if (product) { const newStock = product.stockQuantity - cartItem.quantity; const { error: stockError } = await supabase.from('products').update({ stock_quantity: newStock, updated_at: new Date().toISOString() }).match({ id: cartItem.productId }); if (stockError) console.error(`Gagal update stok (servis) ${cartItem.productName}:`, stockError); } } }
    
    const { data: updatedProds, error: fetchError } = await supabase.from('products').select('*').eq('is_active', true);
    if (!fetchError && updatedProds) {
        const transformedData = updatedProds.map(p => ({ 
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

    const newReceipt: ReceiptDetails = { 
      transactionId, date: format(transactionDate, "dd MMMM yyyy, HH:mm", { locale: localeID }), 
      items: [...cart], subtotal: currentSubtotal, discount: actualDiscount, finalTotal: currentFinalTotal, 
      paymentMethod: paymentType, cashReceived: paymentType === 'Tunai' ? currentCashReceived : undefined, 
      changeCalculated: paymentType === 'Tunai' ? currentChangeCalculated : undefined, 
      customerName: customerName || "Pelanggan Servis", serviceNotes: serviceNotes, 
      receiptTitle: "Nota Jasa & Servis",
      shopName: shopSettings?.shop_name,
      shopAddress: shopSettings?.shop_address,
      shopWhatsapp: shopSettings?.shop_whatsapp_number,
    };
    setReceiptDetails(newReceipt);

    toast({ title: "Transaksi Servis Berhasil", description: `${details}. Nota tersedia.` });
    setCart([]); setSearchTerm(""); setServiceNotes(""); setDiscountAmount(""); setIsPaymentDialogOpen(false); setCashReceived(""); setChangeCalculated(0);
    setIsReceiptModalOpen(true);
  }

  const confirmCashPayment = () => { const finalTotal = calculateFinalTotal(); const received = parseFloat(cashReceived) || 0; if (received < finalTotal) { toast({ variant: "destructive", title: "Uang Kurang" }); return; } completeTransaction("Tunai", `Kembalian: Rp ${changeCalculated.toLocaleString()}`); };
  const confirmTransferPayment = () => { completeTransaction("Transfer", "Menunggu konfirmasi transfer."); };
  const handleDownloadReceipt = () => { if (receiptRef.current && HTML2Canvas) { HTML2Canvas.default(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => { const image = canvas.toDataURL("image/png", 0.8); const link = document.createElement('a'); link.href = image; link.download = `nota_servis_${receiptDetails?.transactionId || 'transaksi'}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); toast({ title: "Nota Servis Diunduh" }); }).catch(err => { toast({ variant: "destructive", title: "Gagal Unduh Nota Servis" }); }); } };
  const handleShareToWhatsApp = () => { if (!receiptDetails) return; let message = `*${receiptDetails.shopName || 'Bengkel Anda'}*\n`; if(receiptDetails.shopAddress) message += `${receiptDetails.shopAddress}\n`; if(receiptDetails.shopWhatsapp) message += `WA: ${receiptDetails.shopWhatsapp}\n`; message += `\n*Nota Jasa & Servis*\nID: ${receiptDetails.transactionId}\nTgl: ${receiptDetails.date}\n`; if (receiptDetails.customerName) message += `Plgn: ${receiptDetails.customerName}\n`; message += `------------------------------------\n`; receiptDetails.items.forEach(item => { message += `${item.productName}${item.priceTierUsed === 'servicePackage' ? ' (Paket)' : ''} (x${item.quantity})\n  Rp ${item.unitPrice.toLocaleString()} x ${item.quantity} = Rp ${item.totalPrice.toLocaleString()}\n`; }); message += `------------------------------------\nSubtotal: Rp ${receiptDetails.subtotal.toLocaleString()}\n`; if (receiptDetails.discount > 0) message += `Diskon: Rp ${receiptDetails.discount.toLocaleString()}\n`; message += `*Total Bayar: Rp ${receiptDetails.finalTotal.toLocaleString()}*\nMetode: ${receiptDetails.paymentMethod}\n`; if (receiptDetails.paymentMethod === 'Tunai') { message += `Tunai: Rp ${receiptDetails.cashReceived?.toLocaleString() || 0}\nKembali: Rp ${receiptDetails.changeCalculated?.toLocaleString() || 0}\n`; } if (receiptDetails.serviceNotes) { message += `------------------------------------\n*Catatan Servis Untuk Anda:*\n${receiptDetails.serviceNotes}\n`; } message += `------------------------------------\n${shopSettings?.receipt_footer_text || 'Terima kasih atas kunjungan Anda!'}\n\n_Nota ini juga dapat diunduh._`; const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`; window.open(whatsappUrl, '_blank'); toast({ title: "Bagikan ke WhatsApp" }); };

  const subtotalForCart = calculateSubtotal();
  const finalTotalForPayment = calculateFinalTotal();
  const actualDiscountApplied = Math.min(parsedDiscount, subtotalForCart);

  return (
    <div className="space-y-6">
      <PageHeader title="Penjualan Jasa & Servis" description="Catat transaksi penjualan barang, jasa, dan servis." actions={ <Button onClick={openPaymentDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-normal text-center md:text-left md:whitespace-nowrap px-3 sm:px-4 py-2 text-sm sm:text-base" disabled={cart.length === 0}><CreditCard className="mr-2 h-4 w-4" />Bayar (Rp {finalTotalForPayment.toLocaleString()})</Button> }/>
      <Card className="shadow-md"><CardHeader><CardTitle>Informasi Pelanggan (Opsional)</CardTitle></CardHeader><CardContent><Label htmlFor="customerNameService">Nama Pelanggan</Label><Input id="customerNameService" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Masukkan nama pelanggan (jika ada)" className="mt-1"/></CardContent></Card>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 space-y-4">
          <Card className="shadow-md"><CardHeader><CardTitle>Cari Produk atau Jasa</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="text" placeholder="Ketik kode, nama, atau scan barcode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div><Button variant="outline" size="icon" onClick={() => setIsCameraOpen(!isCameraOpen)} title={isCameraOpen ? "Tutup Scanner" : "Buka Scanner"}>{isCameraOpen ? <XCircle className="h-5 w-5" /> : <Camera className="h-5 w-5" />}</Button></div>{isCameraOpen && (<div className="space-y-2"><video ref={videoRef} className="w-full aspect-video rounded-md bg-muted border" autoPlay muted playsInline />{hasCameraPermission === false && (<Alert variant="destructive"><AlertTitle>Kamera Dibutuhkan</AlertTitle><AlertDescription>Izinkan akses kamera. <i>(Simulasi: 'BARCODE123SVC')</i></AlertDescription></Alert>)}{hasCameraPermission === true && (<Alert><AlertTitle>Pemindai Aktif</AlertTitle><AlertDescription>Arahkan ke barcode. <i>(Simulasi: 'BARCODE123SVC')</i></AlertDescription></Alert>)}</div>)}</CardContent></Card>
          <Card className="shadow-md"><CardHeader><CardTitle>Hasil Pencarian ({filteredProducts.length})</CardTitle></CardHeader><CardContent>{filteredProducts.length > 0 ? (<div className="max-h-[400px] overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Nama Item</TableHead><TableHead className="text-right">Harga</TableHead><TableHead className="text-center">Stok/Tipe</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{filteredProducts.map((product) => { const applicablePrice = getApplicablePriceInfo(product); return (<TableRow key={product.id}><TableCell className="font-medium break-words max-w-[150px] sm:max-w-xs">{product.name} <br/> <span className="text-xs text-muted-foreground">({product.sku} - {product.category})</span></TableCell><TableCell className="text-right whitespace-nowrap">{applicablePrice ? <>Rp {applicablePrice.price.toLocaleString()}{applicablePrice.tier === 'servicePackage' && <Badge variant="outline" className="ml-1 text-xs py-0.5 px-1 border-accent text-accent">Paket</Badge>}</> : 'N/A'}</TableCell><TableCell className="text-center">{product.category === 'Jasa' ? 'Jasa' : product.stockQuantity}</TableCell><TableCell className="text-right"><Button size="icon" onClick={() => handleAddToCart(product)} disabled={(product.category !== 'Jasa' && product.stockQuantity <= 0) || !applicablePrice} className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8" title="Tambah"><ShoppingCart className="h-4 w-4" /></Button></TableCell></TableRow>);})}</TableBody></Table></div>) : (<p className="text-muted-foreground text-center py-4">Tidak ada item yang cocok.</p>)}</CardContent></Card>
        </div>
        <div className="md:w-1/3 space-y-4">
          <Card className="shadow-md md:sticky md:top-20"><CardHeader><CardTitle>Keranjang Belanja</CardTitle><CardDescription>Total Item: {cart.reduce((sum, item) => sum + item.quantity, 0)}</CardDescription></CardHeader><CardContent className="space-y-4">{cart.length > 0 ? (<div className="max-h-[300px] md:max-h-[350px] overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Produk/Jasa</TableHead><TableHead className="text-center">Qty</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{cart.map(item => (<TableRow key={item.productId}><TableCell className="font-medium text-sm break-words max-w-[100px] sm:max-w-[80px] md:max-w-[100px] lg:max-w-xs">{item.productName}{item.priceTierUsed === 'servicePackage' && <Badge variant="outline" className="ml-1 text-xs py-0.5 px-1 border-accent text-accent">Paket</Badge>}</TableCell><TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}><MinusCircle className="h-3 w-3" /></Button><span className="w-6 text-center text-sm">{item.quantity}</span><Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}><PlusCircle className="h-3 w-3" /></Button></div></TableCell><TableCell className="text-right text-sm whitespace-nowrap">Rp {item.totalPrice.toLocaleString()}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(item.productId)} className="text-destructive hover:text-destructive/80 h-7 w-7"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></div>) : (<p className="text-muted-foreground text-center py-4">Keranjang kosong.</p>)}</CardContent>{cart.length > 0 && (<CardFooter className="flex flex-col space-y-2 pt-4 border-t"><div className="flex justify-between w-full text-md"><span>Subtotal:</span><span className="whitespace-nowrap">Rp {subtotalForCart.toLocaleString()}</span></div>{parsedDiscount > 0 && (<div className="flex justify-between w-full text-md text-green-600"><span>Diskon:</span><span className="whitespace-nowrap">- Rp {actualDiscountApplied.toLocaleString()}</span></div>)}<div className="flex justify-between w-full font-semibold text-lg"><span>Total Akhir:</span><span className="whitespace-nowrap">Rp {finalTotalForPayment.toLocaleString()}</span></div></CardFooter>)}</Card>
          <Card className="shadow-md"><CardHeader><CardTitle>Catatan Servis Pelanggan</CardTitle><CardDescription>Pengingat untuk pelanggan setelah servis.</CardDescription></CardHeader><CardContent><Textarea placeholder="Contoh: Ganti oli berikutnya KM 15000 atau 3 bln lagi." value={serviceNotes} onChange={(e) => setServiceNotes(e.target.value)} rows={3} className="text-sm"/></CardContent></Card>
        </div>
      </div>
      {isPaymentDialogOpen && (
        <DynamicDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DynamicDialogContent className="sm:max-w-md" aria-labelledby={paymentDialogTitleId}>
            <DynamicDialogHeader><DynamicDialogTitle id={paymentDialogTitleId}>Pembayaran Servis</DynamicDialogTitle><DynamicDialogDescription>Subtotal: <span className="font-semibold">Rp {subtotalForCart.toLocaleString()}</span>{parsedDiscount > 0 && (<><br/>Diskon: <span className="font-semibold text-green-600">- Rp {actualDiscountApplied.toLocaleString()}</span></>)}<br/>Total: <span className="font-bold text-lg">Rp {finalTotalForPayment.toLocaleString()}</span></DynamicDialogDescription></DynamicDialogHeader>
            <div className="space-y-2 pt-2"><Label htmlFor="discountAmountService">Diskon (Rp)</Label><div className="relative"><Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input id="discountAmountService" type="number" value={discountAmount} onChange={(e) => { const v = e.target.value; const nV = parseFloat(v); if (v === "" || (nV >= 0 && nV <= subtotalForCart) ) { setDiscountAmount(v); } else if (nV > subtotalForCart) { setDiscountAmount(subtotalForCart.toString()); toast({title: "Info", description: "Diskon maks. subtotal."}); } }} placeholder="e.g. 5000" className="pl-10 text-base w-full"/></div></div>
            <Tabs value={paymentMethodTab} onValueChange={(value) => setPaymentMethodTab(value as 'cash' | 'transfer')} className="w-full pt-2">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="cash"><HandCoins className="mr-2 h-4 w-4" />Tunai</TabsTrigger><TabsTrigger value="transfer"><Landmark className="mr-2 h-4 w-4" />Transfer</TabsTrigger></TabsList>
              <TabsContent value="cash" className="space-y-4 pt-4"><div className="space-y-2"><Label htmlFor="cashReceivedService">Uang Diterima (Rp)</Label><Input id="cashReceivedService" type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="e.g. 150000" className="text-base w-full"/></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => handlePresetCash(finalTotalForPayment)} className="flex-1 text-xs min-w-[80px]">Uang Pas</Button><Button variant="outline" onClick={() => handlePresetCash(50000)} className="flex-1 text-xs min-w-[80px]">Rp 50rb</Button><Button variant="outline" onClick={() => handlePresetCash(100000)} className="flex-1 text-xs min-w-[80px]">Rp 100rb</Button></div><div className="space-y-1 text-right"><p className="text-sm">Total: Rp {finalTotalForPayment.toLocaleString()}</p><p className="text-sm">Diterima: Rp {(parseFloat(cashReceived) || 0).toLocaleString()}</p><p className="text-lg font-semibold">Kembali: Rp {changeCalculated >= 0 ? changeCalculated.toLocaleString() : '0'}</p>{(parseFloat(cashReceived) || 0) < finalTotalForPayment && cashReceived !== "" && (<p className="text-sm text-destructive">Uang kurang.</p>)}</div><Button onClick={confirmCashPayment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={(parseFloat(cashReceived) || 0) < finalTotalForPayment}>Konfirmasi Tunai</Button></TabsContent>
              <TabsContent value="transfer" className="space-y-4 pt-4"><p className="text-sm text-muted-foreground">Transfer <span className="font-semibold text-foreground">Rp {finalTotalForPayment.toLocaleString()}</span> ke:</p><div className="p-3 bg-muted rounded-md text-sm"><p className="font-medium">Bank XYZ</p><p>No. Rek: <span className="font-semibold">123-456-7890</span> A/N: <span className="font-semibold">{shopSettings?.shop_name || 'Bengkel Anda'} (Servis)</span></p></div><Button onClick={confirmTransferPayment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Sudah Transfer</Button></TabsContent>
            </Tabs>
            <DynamicDialogFooter className="sm:justify-start mt-4"><DynamicDialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Batal</Button></DynamicDialogClose></DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
      {isReceiptModalOpen && receiptDetails && (
        <DynamicDialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
          <DynamicDialogContent className="sm:max-w-sm w-[90vw]" aria-labelledby={receiptDialogTitleId}>
            <DynamicDialogHeader><DynamicDialogTitle id={receiptDialogTitleId}>{receiptDetails?.receiptTitle || "Nota Jasa & Servis"}</DynamicDialogTitle><DynamicDialogDescription>ID: {receiptDetails?.transactionId}</DynamicDialogDescription></DynamicDialogHeader>
            <div ref={receiptRef} id="receipt-content" className="p-4 border rounded-md bg-white text-black text-xs">
              <div className="text-center mb-2">
                <h3 className="font-bold text-base">{receiptDetails?.shopName || 'Bengkel Anda'}</h3>
                {receiptDetails?.shopAddress && <p className="text-xs">{receiptDetails.shopAddress}</p>}
                {receiptDetails?.shopWhatsapp && <p className="text-xs">Telp/WA: {receiptDetails.shopWhatsapp}</p>}
              </div>
              <hr className="my-1 border-dashed border-gray-400"/>
              <p>No: {receiptDetails?.transactionId}</p><p>Tgl: {receiptDetails?.date}</p>{receiptDetails?.customerName && <p>Plgn: {receiptDetails.customerName}</p>}<hr className="my-1 border-dashed border-gray-400"/><table className="w-full my-1 table-fixed"><thead><tr><th className="text-left font-normal w-[40%]">Item/Jasa</th><th className="text-center font-normal w-[15%]">Qty</th><th className="text-right font-normal w-[22.5%]">Harga</th><th className="text-right font-normal w-[22.5%]">Total</th></tr></thead><tbody>{receiptDetails?.items.map(item => (<tr key={item.productId}><td className="py-0.5 break-words">{item.productName}{item.priceTierUsed === 'servicePackage' ? ' (Paket)' : ''}</td><td className="text-center py-0.5">{item.quantity}</td><td className="text-right py-0.5 break-words">{item.unitPrice.toLocaleString()}</td><td className="text-right py-0.5 break-words">{item.totalPrice.toLocaleString()}</td></tr>))}</tbody></table><hr className="my-1 border-dashed border-gray-400"/><div className="text-right"><p>Subtotal: <span className="font-semibold">Rp {receiptDetails?.subtotal.toLocaleString()}</span></p>{receiptDetails && receiptDetails.discount > 0 && (<p>Diskon: <span className="font-semibold">Rp {receiptDetails.discount.toLocaleString()}</span></p>)}<p className="font-bold">Total Bayar: <span className="font-bold">Rp {receiptDetails?.finalTotal.toLocaleString()}</span></p>{receiptDetails?.paymentMethod === 'Tunai' && (<><p>Tunai: Rp {receiptDetails?.cashReceived?.toLocaleString()}</p><p>Kembali: Rp {receiptDetails?.changeCalculated?.toLocaleString()}</p></>)}<p>Metode: {receiptDetails?.paymentMethod}</p></div>{receiptDetails?.serviceNotes && (<><hr className="my-1 border-dashed border-gray-400"/><div className="my-1 text-left"><p className="font-semibold">Catatan Servis:</p><p className="text-xs whitespace-pre-wrap">{receiptDetails.serviceNotes}</p></div></>)}<hr className="my-1 border-dashed border-gray-400"/><p className="text-center mt-2">{shopSettings?.receipt_footer_text || 'Terima Kasih!'}</p>{shopSettings?.shop_slogan && <p className="text-center text-[0.6rem]">{shopSettings.shop_slogan}</p>}</div>
            <DynamicDialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4"><Button onClick={handleDownloadReceipt} variant="outline" className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" /> Unduh (PNG)</Button><Button onClick={handleShareToWhatsApp} variant="outline" className="w-full sm:w-auto"><Share2 className="mr-2 h-4 w-4" /> WA</Button><DynamicDialogClose asChild><Button type="button" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">Tutup</Button></DynamicDialogClose></DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}
