
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker"; 
import { useToast } from "@/hooks/use-toast";
import type { SaleTransactionForReport, AccountEntry, SupplierOrder, Expense } from "@/lib/types"; // Product type removed as it's not directly used in this report page's calculations after data fetch.
import { supabase } from '@/lib/supabase';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertTriangle, FileSliders, CalendarOff, Coins, ArrowRightLeft } from "lucide-react";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReportData {
  totalRevenue: number; totalCOGS: number; grossProfit: number; totalTransactions: number;
  averageProfitPerTransaction: number; totalReceivables: number; totalPayables: number;
  goodsReceivedValue: number; goodsReceivedQty: number;
  topSellingItems: { name: string; quantity: number; profit: number; }[];
  totalExpenses: number; netProfit: number; expensesForPeriod: Expense[];
}

export default function ProfitReportPage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHoliday, setIsHoliday] = useState(false);

  const [salesTransactions, setSalesTransactions] = useState<SaleTransactionForReport[]>([]);
  const [accountEntries, setAccountEntries] = useState<AccountEntry[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const fetchDataForReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase.from('salesTransactions').select('*');
      if (salesError) throw salesError;
      setSalesTransactions(salesData.map(s => ({...s, items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items })) as SaleTransactionForReport[]);

      const { data: ledgerData, error: ledgerError } = await supabase.from('accountLedgerEntries').select('*');
      if (ledgerError) throw ledgerError;
      setAccountEntries(ledgerData as AccountEntry[]);
      
      const { data: soData, error: soError } = await supabase.from('supplierOrders').select('*');
      if (soError) throw soError;
      setSupplierOrders(soData.map(s => ({...s, items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items })) as SupplierOrder[]);
      
      const { data: expData, error: expError } = await supabase.from('expensesData').select('*');
      if (expError) throw expError;
      setExpenses(expData as Expense[]);

    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal memuat data laporan", description: e.message });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchDataForReport(); }, [fetchDataForReport]);

  const calculateReport = useCallback(() => {
    if (!selectedDate) return;
    setIsLoading(true);
    const startDate = startOfDay(selectedDate); const endDate = endOfDay(selectedDate);

    const filteredSales = salesTransactions.filter(sale => isWithinInterval(parseISO(sale.date), { start: startDate, end: endDate }));
    const filteredExpenses = expenses.filter(exp => isWithinInterval(parseISO(exp.expenseDate), { start: startDate, end: endDate }));
    const totalExpensesToday = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (filteredSales.length === 0 && isHoliday) {
      setReportData({ totalRevenue: 0, totalCOGS: 0, grossProfit: 0, totalTransactions: 0, averageProfitPerTransaction: 0, totalReceivables: 0, totalPayables: 0, goodsReceivedValue: 0, goodsReceivedQty: 0, topSellingItems: [], totalExpenses: totalExpensesToday, netProfit: 0 - totalExpensesToday, expensesForPeriod: filteredExpenses });
      setIsLoading(false); return;
    }

    let totalRevenue = 0, totalCOGS = 0, grossProfit = 0;
    const itemSalesMap = new Map<string, { quantity: number; profit: number; name: string }>();
    filteredSales.forEach(sale => { totalRevenue += sale.finalAmount; totalCOGS += sale.totalCOGS; grossProfit += sale.totalProfit; (sale.items || []).forEach(item => { const current = itemSalesMap.get(String(item.productId)) || { quantity: 0, profit: 0, name: item.productName }; current.quantity += item.quantity; current.profit += item.profit; itemSalesMap.set(String(item.productId), current); }); });
    
    const topSellingItems = Array.from(itemSalesMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);
    const totalTransactions = filteredSales.length;
    const averageProfitPerTransaction = totalTransactions > 0 ? grossProfit / totalTransactions : 0;
    const netProfit = grossProfit - totalExpensesToday;

    const totalReceivables = accountEntries.filter(e => e.entryNature.includes('Piutang') && e.status !== 'Lunas' && e.status !== 'Dihapuskan').reduce((s, e) => s + e.remainingAmount, 0);
    const totalPayables = accountEntries.filter(e => e.entryNature.includes('Hutang') && e.status !== 'Lunas' && e.status !== 'Dihapuskan').reduce((s, e) => s + e.remainingAmount, 0);

    let goodsReceivedValue = 0, goodsReceivedQty = 0;
    supplierOrders.forEach(order => { if ((order.status === 'Diterima Lengkap' || order.status === 'Sebagian Diterima') && order.receivedDate && isWithinInterval(parseISO(order.receivedDate), { start: startDate, end: endDate })) { (order.items || []).forEach(item => { const qtyActual = item.quantityReceived || 0; goodsReceivedQty += qtyActual; goodsReceivedValue += (item.actualCostPrice || 0) * qtyActual; }); } });
    
    setReportData({ totalRevenue, totalCOGS, grossProfit, totalTransactions, averageProfitPerTransaction, totalReceivables, totalPayables, goodsReceivedValue, goodsReceivedQty, topSellingItems, totalExpenses: totalExpensesToday, netProfit, expensesForPeriod: filteredExpenses });
    setIsLoading(false);
  }, [selectedDate, salesTransactions, accountEntries, supplierOrders, expenses, isHoliday]);

  useEffect(() => { calculateReport(); }, [selectedDate, calculateReport, isHoliday, expenses]);

  // UI classes and display logic remain the same
  const holidayCardClass = isHoliday && reportData?.totalTransactions === 0 ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700" : "";
  const holidayTextClass = isHoliday && reportData?.totalTransactions === 0 ? "text-red-600 dark:text-red-400" : "text-foreground";
  const holidayMutedTextClass = isHoliday && reportData?.totalTransactions === 0 ? "text-red-500 dark:text-red-500" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Keuangan & Operasional" description="Analisis keuntungan, hutang/piutang, pengeluaran, dan aktivitas bengkel Anda." actions={ <div className="flex items-center space-x-2"><Label htmlFor="holiday-mode" className="text-sm font-medium whitespace-nowrap">Mode Libur/Tutup:</Label><Switch id="holiday-mode" checked={isHoliday} onCheckedChange={setIsHoliday} /><DatePicker date={selectedDate} setDate={setSelectedDate} /><Button onClick={calculateReport} disabled={isLoading}><FileSliders className="mr-2 h-4 w-4" />{isLoading ? "Memuat..." : "Terapkan Filter"}</Button></div>}/>
      {isLoading && !reportData && <div className="text-center py-10"><Hourglass className="h-12 w-12 text-primary animate-spin mx-auto mb-4" /><p>Memuat laporan...</p></div>}
      {isHoliday && reportData?.totalTransactions === 0 && (<Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-lg"><CardHeader className="items-center text-center"><CalendarOff className="h-12 w-12 mb-2" /><CardTitle className="text-2xl">Bengkel Libur/Tutup</CardTitle><CardDescription className="text-destructive-foreground/80">Tidak ada transaksi penjualan. Laporan pengeluaran tetap dihitung.</CardDescription></CardHeader></Card>)}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`shadow-md ${holidayCardClass}`}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`text-sm font-medium ${holidayMutedTextClass}`}>Total Pendapatan ({selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle><DollarSign className={`h-5 w-5 ${holidayTextClass}`} /></CardHeader><CardContent><div className={`text-2xl font-bold ${holidayTextClass}`}>Rp {reportData?.totalRevenue.toLocaleString() || '0'}</div><p className={`text-xs ${holidayMutedTextClass}`}>Dari {reportData?.totalTransactions || '0'} transaksi</p></CardContent></Card>
        <Card className={`shadow-md ${holidayCardClass}`}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`text-sm font-medium ${holidayMutedTextClass}`}>Total HPP (Modal)</CardTitle><TrendingDown className={`h-5 w-5 ${holidayTextClass}`} /></CardHeader><CardContent><div className={`text-2xl font-bold ${holidayTextClass}`}>Rp {reportData?.totalCOGS.toLocaleString() || '0'}</div><p className={`text-xs ${holidayMutedTextClass}`}>Harga pokok penjualan</p></CardContent></Card>
        <Card className={`shadow-md ${holidayCardClass}`}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`text-sm font-medium ${holidayMutedTextClass}`}>Laba Kotor (Penjualan)</CardTitle><TrendingUp className={`h-5 w-5 ${reportData?.grossProfit && reportData.grossProfit < 0 && !isHoliday ? 'text-red-500' : holidayTextClass}`} /></CardHeader><CardContent><div className={`text-2xl font-bold ${reportData?.grossProfit && reportData.grossProfit < 0 && !isHoliday ? 'text-red-600 dark:text-red-400' : holidayTextClass}`}>Rp {reportData?.grossProfit.toLocaleString() || '0'}</div><p className={`text-xs ${holidayMutedTextClass}`}>Rata-rata Laba/Transaksi: Rp {reportData?.averageProfitPerTransaction.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits:0}) || '0'}</p></CardContent></Card>
        <Card className={`shadow-md ${reportData?.netProfit && reportData.netProfit < 0 ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700" : holidayCardClass}`}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className={`text-sm font-medium ${reportData?.netProfit && reportData.netProfit < 0 ? "text-red-500 dark:text-red-500" : holidayMutedTextClass}`}>Laba Bersih</CardTitle><ArrowRightLeft className={`h-5 w-5 ${reportData?.netProfit && reportData.netProfit < 0 ? 'text-red-500' : holidayTextClass}`} /></CardHeader><CardContent><div className={`text-2xl font-bold ${reportData?.netProfit && reportData.netProfit < 0 ? 'text-red-600 dark:text-red-400' : holidayTextClass}`}>Rp {reportData?.netProfit.toLocaleString() || '0'}</div><p className={`text-xs ${reportData?.netProfit && reportData.netProfit < 0 ? "text-red-500 dark:text-red-500" : holidayMutedTextClass}`}>Laba Kotor - Total Pengeluaran</p></CardContent></Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Piutang (Belum Lunas)</CardTitle><TrendingUp className="h-5 w-5 text-yellow-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">Rp {reportData?.totalReceivables.toLocaleString() || '0'}</div><p className="text-xs text-muted-foreground">Uang akan diterima.</p></CardContent></Card>
        <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Hutang (Belum Lunas)</CardTitle><TrendingDown className="h-5 w-5 text-red-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-700 dark:text-red-500">Rp {reportData?.totalPayables.toLocaleString() || '0'}</div><p className="text-xs text-muted-foreground">Uang harus dibayar.</p></CardContent></Card>
        <Card className="shadow-md"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Penerimaan Barang ({selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle><Package className="h-5 w-5 text-blue-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-700 dark:text-blue-500">Rp {reportData?.goodsReceivedValue.toLocaleString() || '0'}</div><p className="text-xs text-muted-foreground">Dari {reportData?.goodsReceivedQty || '0'} item diterima.</p></CardContent></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={`shadow-md ${holidayCardClass}`}><CardHeader><CardTitle className={`text-lg ${holidayTextClass}`}>Item Terlaris (Profit - {selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle></CardHeader><CardContent>{reportData && reportData.topSellingItems.length > 0 ? (<Table><TableHeader><TableRow><TableHead className={holidayMutedTextClass}>Nama Item</TableHead><TableHead className={`text-center ${holidayMutedTextClass}`}>Qty</TableHead><TableHead className={`text-right ${holidayMutedTextClass}`}>Total Profit</TableHead></TableRow></TableHeader><TableBody>{reportData.topSellingItems.map(item => (<TableRow key={item.name}><TableCell className={`font-medium ${holidayTextClass}`}>{item.name}</TableCell><TableCell className={`text-center ${holidayTextClass}`}>{item.quantity}</TableCell><TableCell className={`text-right ${holidayTextClass}`}>Rp {item.profit.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table>) : (<p className={holidayMutedTextClass}>Tidak ada data penjualan item.</p>)}</CardContent></Card>
        <Card className="shadow-md"><CardHeader><CardTitle className="text-lg text-foreground">Ringkasan Pengeluaran ({selectedDate ? format(selectedDate, "dd MMM", { locale: localeID }) : ''})</CardTitle><CardDescription>Total Pengeluaran: <span className="font-semibold text-destructive">Rp {reportData?.totalExpenses.toLocaleString() || '0'}</span></CardDescription></CardHeader><CardContent className="min-h-[150px]">{reportData && reportData.expensesForPeriod.length > 0 ? (<div className="max-h-60 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead>Deskripsi</TableHead><TableHead className="text-right">Jumlah</TableHead></TableRow></TableHeader><TableBody>{reportData.expensesForPeriod.map(exp => (<TableRow key={exp.id}><TableCell className="text-xs">{exp.category}</TableCell><TableCell className="text-xs">{exp.description}</TableCell><TableCell className="text-right text-xs">Rp {exp.amount.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></div>) : (<div className="flex flex-col items-center justify-center h-full"><Coins className="w-12 h-12 text-muted-foreground mb-3" /><p className="text-muted-foreground text-center">Tidak ada pengeluaran.</p></div>)}</CardContent></Card>
      </div>
    </div>
  );
}
