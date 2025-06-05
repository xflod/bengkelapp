
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker"; 
import { useToast } from "@/hooks/use-toast";
import type { SaleTransactionForReport, AccountEntry, SupplierOrder, Product } from "@/lib/types";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle, FileSliders, PiggyBank, ShoppingBag, ReceiptText, CalendarOff } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface ReportData {
  totalRevenue: number;
  totalCOGS: number;
  totalProfit: number;
  totalTransactions: number;
  averageProfitPerTransaction: number;
  totalReceivables: number;
  totalPayables: number;
  goodsReceivedValue: number;
  goodsReceivedQty: number;
  topSellingItems: { name: string; quantity: number; profit: number; }[];
}

export default function ProfitReportPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false); // For simulating holiday/closed day

  const [salesTransactions, setSalesTransactions] = useState<SaleTransactionForReport[]>([]);
  const [accountEntries, setAccountEntries] = useState<AccountEntry[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>([]);

  // Load data from localStorage
  useEffect(() => {
    try {
      const storedSales = localStorage.getItem('allSalesTransactionsBengkelKu');
      setSalesTransactions(storedSales ? JSON.parse(storedSales) : []);

      const storedLedger = localStorage.getItem('accountLedgerEntriesBengkelKu');
      setAccountEntries(storedLedger ? JSON.parse(storedLedger) : []);
      
      const storedSupplierOrders = localStorage.getItem('supplierOrdersDataBengkelKu');
      setSupplierOrders(storedSupplierOrders ? JSON.parse(storedSupplierOrders) : []);

      const storedInventory = localStorage.getItem('inventoryProductsBengkelKu');
      setInventoryProducts(storedInventory ? JSON.parse(storedInventory) : []);

    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memuat data laporan", description: "Beberapa data mungkin tidak terbaru." });
    }
  }, [toast]);


  const calculateReport = useCallback(() => {
    if (!selectedDate) return;
    setIsLoading(true);

    const startDate = startOfDay(selectedDate);
    const endDate = endOfDay(selectedDate);

    const filteredSales = salesTransactions.filter(sale => 
      isWithinInterval(parseISO(sale.date), { start: startDate, end: endDate })
    );

    if (filteredSales.length === 0 && isHoliday) {
         setReportData({
            totalRevenue: 0, totalCOGS: 0, totalProfit: 0, totalTransactions: 0,
            averageProfitPerTransaction: 0, totalReceivables: 0, totalPayables: 0,
            goodsReceivedValue: 0, goodsReceivedQty: 0, topSellingItems: []
        });
        setIsLoading(false);
        return;
    }


    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalProfit = 0;
    const itemSalesMap = new Map<string, { quantity: number; profit: number; name: string }>();

    filteredSales.forEach(sale => {
      totalRevenue += sale.finalAmount;
      totalCOGS += sale.totalCOGS;
      totalProfit += sale.totalProfit;
      sale.items.forEach(item => {
        const current = itemSalesMap.get(item.productId) || { quantity: 0, profit: 0, name: item.productName };
        current.quantity += item.quantity;
        current.profit += item.profit;
        itemSalesMap.set(item.productId, current);
      });
    });
    
    const topSellingItems = Array.from(itemSalesMap.values())
      .sort((a, b) => b.profit - a.profit) // Sort by profit
      .slice(0, 5);


    const totalTransactions = filteredSales.length;
    const averageProfitPerTransaction = totalTransactions > 0 ? totalProfit / totalTransactions : 0;

    // Hutang/Piutang
    const totalReceivables = accountEntries
      .filter(entry => entry.entryNature.includes('Piutang') && entry.status !== 'Lunas' && entry.status !== 'Dihapuskan')
      .reduce((sum, entry) => sum + entry.remainingAmount, 0);
    const totalPayables = accountEntries
      .filter(entry => entry.entryNature.includes('Hutang') && entry.status !== 'Lunas' && entry.status !== 'Dihapuskan')
      .reduce((sum, entry) => sum + entry.remainingAmount, 0);

    // Penerimaan Barang
    let goodsReceivedValue = 0;
    let goodsReceivedQty = 0;
    supplierOrders.forEach(order => {
      if ((order.status === 'Diterima Lengkap' || order.status === 'Sebagian Diterima') && order.receivedDate && isWithinInterval(parseISO(order.receivedDate), { start: startDate, end: endDate })) {
        order.items.forEach(item => {
          const qtyActuallyReceivedInPeriod = item.quantityReceived || 0; // Assuming quantityReceived is cumulative
          // This part needs more sophisticated logic if receipts can span periods or if quantityReceived is per-session
          // For simplicity now, take all received items if receivedDate is in period.
          goodsReceivedQty += qtyActuallyReceivedInPeriod;
          goodsReceivedValue += (item.actualCostPrice || 0) * qtyActuallyReceivedInPeriod;
        });
      }
    });
    
    setReportData({
      totalRevenue,
      totalCOGS,
      totalProfit,
      totalTransactions,
      averageProfitPerTransaction,
      totalReceivables,
      totalPayables,
      goodsReceivedValue,
      goodsReceivedQty,
      topSellingItems
    });
    setIsLoading(false);
  }, [selectedDate, salesTransactions, accountEntries, supplierOrders, inventoryProducts, isHoliday]);

  useEffect(() => {
    calculateReport();
  }, [selectedDate, calculateReport, isHoliday]);

  const holidayCardClass = isHoliday ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700" : "";
  const holidayTextClass = isHoliday ? "text-red-600 dark:text-red-400" : "text-foreground";
  const holidayMutedTextClass = isHoliday ? "text-red-500 dark:text-red-500" : "text-muted-foreground";


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Laporan Keuangan & Operasional"
        description="Analisis keuntungan, hutang/piutang, dan aktivitas bengkel Anda."
        actions={
            <div className="flex items-center space-x-2">
                 <Label htmlFor="holiday-mode" className="text-sm font-medium whitespace-nowrap">Mode Libur/Tutup:</Label>
                 <Switch
                    id="holiday-mode"
                    checked={isHoliday}
                    onCheckedChange={setIsHoliday}
                 />
                 <DatePicker date={selectedDate} setDate={setSelectedDate} />
                 <Button onClick={calculateReport} disabled={isLoading}>
                    <FileSliders className="mr-2 h-4 w-4" />
                    {isLoading ? "Memuat..." : "Terapkan Filter"}
                 </Button>
            </div>
        }
      />

    {isHoliday && reportData?.totalTransactions === 0 && (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-lg">
            <CardHeader className="items-center text-center">
                <CalendarOff className="h-12 w-12 mb-2" />
                <CardTitle className="text-2xl">Bengkel Libur/Tutup</CardTitle>
                <CardDescription className="text-destructive-foreground/80">Tidak ada transaksi atau aktivitas operasional tercatat untuk tanggal {selectedDate ? format(selectedDate, "PPP", { locale: localeID }) : ""} karena mode libur/tutup diaktifkan.</CardDescription>
            </CardHeader>
        </Card>
    )}


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className={`shadow-md ${holidayCardClass}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${holidayMutedTextClass}`}>Total Pendapatan ({selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle>
            <DollarSign className={`h-5 w-5 ${holidayTextClass}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${holidayTextClass}`}>Rp {reportData?.totalRevenue.toLocaleString() || '0'}</div>
            <p className={`text-xs ${holidayMutedTextClass}`}>Dari {reportData?.totalTransactions || '0'} transaksi</p>
          </CardContent>
        </Card>
        <Card className={`shadow-md ${holidayCardClass}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${holidayMutedTextClass}`}>Total HPP (Modal)</CardTitle>
            <TrendingDown className={`h-5 w-5 ${holidayTextClass}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${holidayTextClass}`}>Rp {reportData?.totalCOGS.toLocaleString() || '0'}</div>
             <p className={`text-xs ${holidayMutedTextClass}`}>Harga pokok penjualan</p>
          </CardContent>
        </Card>
        <Card className={`shadow-md ${holidayCardClass}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${holidayMutedTextClass}`}>Total Laba Kotor</CardTitle>
            <TrendingUp className={`h-5 w-5 ${reportData?.totalProfit && reportData.totalProfit < 0 && !isHoliday ? 'text-red-500' : holidayTextClass}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData?.totalProfit && reportData.totalProfit < 0 && !isHoliday ? 'text-red-600 dark:text-red-400' : holidayTextClass}`}>
                Rp {reportData?.totalProfit.toLocaleString() || '0'}
            </div>
            <p className={`text-xs ${holidayMutedTextClass}`}>
                Rata-rata Laba/Transaksi: Rp {reportData?.averageProfitPerTransaction.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0}) || '0'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang Usaha (Belum Lunas)</CardTitle>
            <TrendingUp className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">Rp {reportData?.totalReceivables.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Uang yang akan diterima dari pelanggan/lainnya.</p>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hutang Usaha (Belum Lunas)</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-500">Rp {reportData?.totalPayables.toLocaleString() || '0'}</div>
            <p className="text-xs text-muted-foreground">Uang yang harus dibayarkan ke supplier/lainnya.</p>
          </CardContent>
        </Card>
         <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Penerimaan Barang ({selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle>
                <ShoppingBag className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-500">Rp {reportData?.goodsReceivedValue.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Dari {reportData?.goodsReceivedQty || '0'} item diterima.</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={`shadow-md ${holidayCardClass}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${holidayTextClass}`}>Item Terlaris (Berdasarkan Profit - {selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData && reportData.topSellingItems.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead className={holidayMutedTextClass}>Nama Item</TableHead><TableHead className={`text-center ${holidayMutedTextClass}`}>Qty</TableHead><TableHead className={`text-right ${holidayMutedTextClass}`}>Total Profit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reportData.topSellingItems.map(item => (
                    <TableRow key={item.name}>
                      <TableCell className={`font-medium ${holidayTextClass}`}>{item.name}</TableCell>
                      <TableCell className={`text-center ${holidayTextClass}`}>{item.quantity}</TableCell>
                      <TableCell className={`text-right ${holidayTextClass}`}>Rp {item.profit.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className={holidayMutedTextClass}>Tidak ada data penjualan item untuk ditampilkan pada tanggal ini.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Pengeluaran Operasional</CardTitle>
             <CardDescription>Catatan pengeluaran bengkel (Gaji, Listrik, Sewa, dll.).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[150px]">
            <PiggyBank className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">Fitur pencatatan pengeluaran detail akan dikembangkan pada tahap berikutnya.</p>
            <Button variant="outline" className="mt-4" disabled>Tambah Catatan Pengeluaran</Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
