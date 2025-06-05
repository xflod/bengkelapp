
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { AccountEntry, AccountPayment, AccountEntryType, AccountEntryNature, AccountEntryStatus } from "@/lib/types";
import { PlusCircle, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, CircleDollarSign, BookOpenText } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const MOCK_ACCOUNT_ENTRIES: AccountEntry[] = [
  { id: 'AE-001', entityType: 'Supplier', entityName: 'PT Sparepart Jaya', entryNature: 'Hutang Usaha', entryDate: '2024-05-01', initialAmount: 5000000, remainingAmount: 2000000, description: 'Pembelian oli batch Mei', status: 'Sebagian Lunas', dueDate: '2024-06-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'AE-002', entityType: 'Pelanggan', entityName: 'Bapak Budi S.', entryNature: 'Piutang Usaha', entryDate: '2024-05-15', initialAmount: 750000, remainingAmount: 750000, description: 'Servis besar belum lunas', status: 'Belum Lunas', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'AE-003', entityType: 'Operasional & Lainnya', entityName: 'Angsuran Bank XYZ', entryNature: 'Hutang Lainnya', entryDate: '2024-05-25', initialAmount: 1200000, remainingAmount: 0, description: 'Cicilan pinjaman usaha bulan Mei', status: 'Lunas', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_ACCOUNT_PAYMENTS: AccountPayment[] = [
  { id: 'PAY-001', accountEntryId: 'AE-001', paymentDate: '2024-05-10', amountPaid: 1500000, notes: 'Pembayaran pertama', createdAt: new Date().toISOString() },
  { id: 'PAY-002', accountEntryId: 'AE-001', paymentDate: '2024-05-20', amountPaid: 1500000, notes: 'Pembayaran kedua', createdAt: new Date().toISOString() },
  { id: 'PAY-003', accountEntryId: 'AE-003', paymentDate: '2024-05-25', amountPaid: 1200000, notes: 'Lunas', createdAt: new Date().toISOString() },
];

export default function AccountsLedgerPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [payments, setPayments] = useState<AccountPayment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormEntryDialogOpen, setIsFormEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountEntry | null>(null);

  // Entry Form states
  const [entityType, setEntityType] = useState<AccountEntryType | undefined>(undefined);
  const [entityName, setEntityName] = useState('');
  const [entryNature, setEntryNature] = useState<AccountEntryNature | undefined>(undefined);
  const [entryDate, setEntryDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [initialAmount, setInitialAmount] = useState<string | number>('');
  const [description, setDescription] = useState('');
  const [entryStatus, setEntryStatus] = useState<AccountEntryStatus>('Belum Lunas');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterNature, setFilterNature] = useState<'all' | AccountEntryNature>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | AccountEntryStatus>('all');

  // Payment Dialog States
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedEntryForPayment, setSelectedEntryForPayment] = useState<AccountEntry | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [amountPaid, setAmountPaid] = useState<string | number>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');


  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('accountLedgerEntriesBengkelKu');
      setEntries(storedEntries ? JSON.parse(storedEntries) : MOCK_ACCOUNT_ENTRIES);

      const storedPayments = localStorage.getItem('accountLedgerPaymentsBengkelKu');
      setPayments(storedPayments ? JSON.parse(storedPayments) : MOCK_ACCOUNT_PAYMENTS);
    } catch (error) {
      console.error("Failed to parse data from localStorage:", error);
      setEntries(MOCK_ACCOUNT_ENTRIES);
      setPayments(MOCK_ACCOUNT_PAYMENTS);
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Memuat data contoh." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('accountLedgerEntriesBengkelKu', JSON.stringify(entries));
  }, [entries, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('accountLedgerPaymentsBengkelKu', JSON.stringify(payments));
  }, [payments, isLoading]);

  const resetEntryFormFields = useCallback(() => {
    setEditingEntry(null);
    setEntityType(undefined);
    setEntityName('');
    setEntryNature(undefined);
    setEntryDate(startOfDay(new Date()));
    setDueDate(undefined);
    setInitialAmount('');
    setDescription('');
    setEntryStatus('Belum Lunas');
  }, []);

  const handleOpenEntryFormDialog = useCallback((entry?: AccountEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setEntityType(entry.entityType);
      setEntityName(entry.entityName);
      setEntryNature(entry.entryNature);
      setEntryDate(entry.entryDate && isValid(parseISO(entry.entryDate)) ? parseISO(entry.entryDate) : startOfDay(new Date()));
      setDueDate(entry.dueDate && isValid(parseISO(entry.dueDate)) ? parseISO(entry.dueDate) : undefined);
      setInitialAmount(entry.initialAmount);
      setDescription(entry.description);
      setEntryStatus(entry.status);
    } else {
      resetEntryFormFields();
    }
    setIsFormEntryDialogOpen(true);
  }, [resetEntryFormFields]);

  const handleSaveEntry = () => {
    if (!entityType || !entityName.trim() || !entryNature || !entryDate || !initialAmount || !description.trim()) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Tipe, Nama Entitas, Sifat, Tgl. Transaksi, Jumlah, dan Deskripsi wajib diisi." });
      return;
    }
    const parsedInitialAmount = parseFloat(String(initialAmount));
    if (isNaN(parsedInitialAmount) || parsedInitialAmount <= 0) {
      toast({ variant: "destructive", title: "Jumlah Awal Tidak Valid", description: "Jumlah harus angka positif." });
      return;
    }

    const now = new Date().toISOString();
    const entryId = editingEntry ? editingEntry.id : `AE-${Date.now()}`;
    
    const newEntryData: AccountEntry = {
      id: entryId,
      entityType: entityType,
      entityName: entityName.trim(),
      entryNature: entryNature,
      entryDate: format(entryDate, 'yyyy-MM-dd'),
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      initialAmount: parsedInitialAmount,
      remainingAmount: editingEntry ? editingEntry.remainingAmount : parsedInitialAmount, 
      description: description.trim(),
      status: editingEntry ? entryStatus : 'Belum Lunas', 
      createdAt: editingEntry ? editingEntry.createdAt : now,
      updatedAt: now,
    };

    if (editingEntry) {
      if (editingEntry.initialAmount !== newEntryData.initialAmount) {
          const relatedPaymentsTotal = payments
              .filter(p => p.accountEntryId === editingEntry.id)
              .reduce((sum, p) => sum + p.amountPaid, 0);
          newEntryData.remainingAmount = newEntryData.initialAmount - relatedPaymentsTotal;
          if (newEntryData.remainingAmount < 0) newEntryData.remainingAmount = 0;
          
          if (newEntryData.remainingAmount === 0) newEntryData.status = 'Lunas';
          else if (newEntryData.remainingAmount < newEntryData.initialAmount) newEntryData.status = 'Sebagian Lunas';
          else newEntryData.status = 'Belum Lunas';
      } else {
          newEntryData.remainingAmount = editingEntry.remainingAmount; 
          newEntryData.status = entryStatus;
      }

      setEntries(prev => prev.map(e => e.id === editingEntry.id ? newEntryData : e));
      toast({ title: "Catatan Keuangan Diperbarui" });
    } else {
      setEntries(prev => [newEntryData, ...prev]);
      toast({ title: "Catatan Keuangan Ditambahkan" });
    }
    setIsFormEntryDialogOpen(false);
  };

  const handleDeleteEntry = useCallback((entryId: string, entryDesc: string) => {
    if (window.confirm(`Yakin ingin menghapus catatan "${entryDesc}"? Ini juga akan menghapus semua pembayaran terkait.`)) {
      setEntries(prev => prev.filter(e => e.id !== entryId));
      setPayments(prev => prev.filter(p => p.accountEntryId !== entryId));
      toast({ title: "Catatan Keuangan Dihapus" });
    }
  }, [toast, setEntries, setPayments]);
  
  const resetPaymentFormFields = useCallback(() => {
    setPaymentDate(startOfDay(new Date()));
    setAmountPaid('');
    setPaymentMethod('');
    setPaymentNotes('');
  }, []);

  const openPaymentDialog = useCallback((entry: AccountEntry) => {
    setSelectedEntryForPayment(entry);
    resetPaymentFormFields();
    setIsPaymentDialogOpen(true);
  }, [resetPaymentFormFields]);

  const handleSavePayment = () => {
    if (!selectedEntryForPayment || !paymentDate || !amountPaid) {
        toast({ variant: "destructive", title: "Data Pembayaran Tidak Lengkap", description: "Tanggal dan Jumlah Bayar wajib diisi."});
        return;
    }
    const parsedAmountPaid = parseFloat(String(amountPaid));
    if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) {
        toast({ variant: "destructive", title: "Jumlah Bayar Tidak Valid", description: "Jumlah Bayar harus positif."});
        return;
    }
    if (parsedAmountPaid > selectedEntryForPayment.remainingAmount) {
        toast({ variant: "destructive", title: "Jumlah Bayar Melebihi Sisa", description: `Maksimal pembayaran Rp ${selectedEntryForPayment.remainingAmount.toLocaleString()}. Pertimbangkan untuk menghapus catatan ini dan membuat yang baru jika ada kesalahan jumlah awal.`});
        return;
    }

    const now = new Date().toISOString();
    const newPayment: AccountPayment = {
        id: `PAY-${Date.now()}`,
        accountEntryId: selectedEntryForPayment.id,
        paymentDate: format(paymentDate, 'yyyy-MM-dd'),
        amountPaid: parsedAmountPaid,
        paymentMethod: paymentMethod.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        createdAt: now,
    };
    setPayments(prev => [newPayment, ...prev]);

    setEntries(prevEntries => prevEntries.map(e => {
        if (e.id === selectedEntryForPayment.id) {
            const newRemaining = Math.max(0, e.remainingAmount - parsedAmountPaid);
            let newStatus: AccountEntryStatus = 'Belum Lunas';
            if (newRemaining === 0) newStatus = 'Lunas';
            else if (newRemaining < e.initialAmount) newStatus = 'Sebagian Lunas';
            
            const updatedEntry = { ...e, remainingAmount: newRemaining, status: newStatus, updatedAt: now };
            setSelectedEntryForPayment(updatedEntry); 
            return updatedEntry;
        }
        return e;
    }));
    toast({ title: "Pembayaran Dicatat"});
    resetPaymentFormFields(); 
  };

  const getStatusBadgeColor = (status: AccountEntryStatus) => {
    switch (status) {
      case 'Belum Lunas': return 'bg-red-500';
      case 'Sebagian Lunas': return 'bg-yellow-500';
      case 'Lunas': return 'bg-green-500';
      case 'Dihapuskan': return 'bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? 
        entry.entityName.toLowerCase().includes(searchTermLower) || 
        entry.description.toLowerCase().includes(searchTermLower) ||
        entry.id.toLowerCase().includes(searchTermLower)
        : true;
      const matchesNature = filterNature === 'all' ? true : entry.entryNature === filterNature;
      const matchesStatus = filterStatus === 'all' ? true : entry.status === filterStatus;
      return matchesSearch && matchesNature && matchesStatus;
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [entries, searchTerm, filterNature, filterStatus]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data buku keuangan...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Buku Besar Hutang & Piutang"
        description="Catat dan kelola semua transaksi hutang dan piutang usaha maupun lainnya."
        actions={
          <Button onClick={() => handleOpenEntryFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Catatan Baru
          </Button>
        }
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filter Catatan Keuangan</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <Input
              type="text"
              placeholder="Cari ID, Nama Entitas, Deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-1"
            />
            <Select value={filterNature} onValueChange={(value) => setFilterNature(value as 'all' | AccountEntryNature)}>
              <SelectTrigger><SelectValue placeholder="Filter Sifat Transaksi..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sifat</SelectItem>
                <SelectItem value="Piutang Usaha">Piutang Usaha</SelectItem>
                <SelectItem value="Hutang Usaha">Hutang Usaha</SelectItem>
                <SelectItem value="Piutang Lainnya">Piutang Lainnya</SelectItem>
                <SelectItem value="Hutang Lainnya">Hutang Lainnya</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | AccountEntryStatus)}>
              <SelectTrigger><SelectValue placeholder="Filter Status..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
                <SelectItem value="Sebagian Lunas">Sebagian Lunas</SelectItem>
                <SelectItem value="Lunas">Lunas</SelectItem>
                <SelectItem value="Dihapuskan">Dihapuskan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEntries.length > 0 ? (
            <div className="overflow-x-auto max-h-[65vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[150px]">Entitas</TableHead>
                    <TableHead className="min-w-[130px]">Sifat</TableHead>
                    <TableHead className="min-w-[200px]">Deskripsi</TableHead>
                    <TableHead className="text-right min-w-[120px]">Jumlah Awal</TableHead>
                    <TableHead className="text-right min-w-[120px]">Sisa</TableHead>
                    <TableHead className="text-center min-w-[120px]">Status</TableHead>
                    <TableHead className="text-center min-w-[120px]">Tgl. Transaksi</TableHead>
                    <TableHead className="text-center w-[180px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id} className={entry.status === 'Dihapuskan' ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">{entry.entityName} <br/><span className="text-xs text-muted-foreground">({entry.entityType})</span></TableCell>
                      <TableCell>{entry.entryNature}</TableCell>
                      <TableCell className="text-xs">{entry.description}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">Rp {entry.initialAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-semibold">Rp {entry.remainingAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={`${getStatusBadgeColor(entry.status)} text-white hover:${getStatusBadgeColor(entry.status)}`}>{entry.status}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{format(parseISO(entry.entryDate), "dd MMM yyyy", { locale: localeID })}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1 flex-wrap">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenEntryFormDialog(entry)} title="Edit Catatan">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                           <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openPaymentDialog(entry)} title="Kelola Pembayaran" disabled={entry.status === 'Lunas' || entry.status === 'Dihapuskan'}>
                            <CircleDollarSign className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEntry(entry.id, entry.description)} title="Hapus Catatan">
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
                  <BookOpenText className="w-16 h-16 text-muted-foreground mb-4" />
                  <CardTitle className="text-xl text-foreground">
                    {searchTerm || filterNature !== 'all' || filterStatus !== 'all' ? "Catatan Tidak Ditemukan" : "Belum Ada Catatan Keuangan"}
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">
                    {searchTerm || filterNature !== 'all' || filterStatus !== 'all' ? 
                      "Tidak ada catatan keuangan yang cocok dengan kriteria pencarian atau filter Anda." :
                      "Saat ini tidak ada catatan hutang/piutang. Klik 'Tambah Catatan Baru' untuk memulai."
                    }
                  </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Entry Add/Edit Dialog */}
      <Dialog open={isFormEntryDialogOpen} onOpenChange={(open) => { setIsFormEntryDialogOpen(open); if (!open) resetEntryFormFields(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingEntry ? 'Edit Catatan Keuangan' : 'Tambah Catatan Keuangan Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="entityType" className="text-right col-span-4 sm:col-span-1 pr-3">Tipe Entitas<span className="text-destructive">*</span></Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as AccountEntryType)}>
                <SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue placeholder="Pilih tipe entitas"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pelanggan">Pelanggan</SelectItem>
                  <SelectItem value="Partner Bengkel">Partner Bengkel</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                  <SelectItem value="Operasional & Lainnya">Operasional & Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="entityName" className="text-right col-span-4 sm:col-span-1 pr-3">Nama Entitas<span className="text-destructive">*</span></Label>
              <Input id="entityName" value={entityName} onChange={(e) => setEntityName(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Nama Pelanggan/Supplier/Bank/dll." />
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="entryNature" className="text-right col-span-4 sm:col-span-1 pr-3">Sifat Transaksi<span className="text-destructive">*</span></Label>
              <Select value={entryNature} onValueChange={(v) => setEntryNature(v as AccountEntryNature)}>
                <SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue placeholder="Pilih sifat transaksi"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Piutang Usaha">Piutang Usaha (Kita akan menerima)</SelectItem>
                  <SelectItem value="Hutang Usaha">Hutang Usaha (Kita akan membayar)</SelectItem>
                  <SelectItem value="Piutang Lainnya">Piutang Lainnya</SelectItem>
                  <SelectItem value="Hutang Lainnya">Hutang Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="entryDate" className="text-right col-span-4 sm:col-span-1 pr-3">Tgl. Transaksi<span className="text-destructive">*</span></Label>
              <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-4 sm:col-span-3 justify-start text-left font-normal ${!entryDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{entryDate ? format(entryDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={entryDate} onSelect={setEntryDate} initialFocus /></PopoverContent></Popover>
            </div>
             <div className="grid grid-cols-4 items-center">
              <Label htmlFor="dueDate" className="text-right col-span-4 sm:col-span-1 pr-3">Tgl. Jatuh Tempo</Label>
              <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-4 sm:col-span-3 justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP", { locale: localeID }) : <span>Pilih tanggal (opsional)</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="initialAmount" className="text-right col-span-4 sm:col-span-1 pr-3">Jumlah Awal (Rp)<span className="text-destructive">*</span></Label>
              <Input id="initialAmount" type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 1000000" disabled={!!editingEntry && payments.some(p => p.accountEntryId === editingEntry?.id)} title={editingEntry && payments.some(p => p.accountEntryId === editingEntry?.id) ? "Jumlah awal tidak dapat diubah jika sudah ada pembayaran." : ""} />
            </div>
            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="description" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Deskripsi<span className="text-destructive">*</span></Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Deskripsi singkat transaksi" rows={3}/>
            </div>
            {editingEntry && (
              <div className="grid grid-cols-4 items-center">
                <Label htmlFor="entryStatus" className="text-right col-span-4 sm:col-span-1 pr-3">Status<span className="text-destructive">*</span></Label>
                <Select value={entryStatus} onValueChange={(v) => setEntryStatus(v as AccountEntryStatus)}>
                  <SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue placeholder="Pilih status"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Belum Lunas">Belum Lunas</SelectItem>
                    <SelectItem value="Sebagian Lunas">Sebagian Lunas</SelectItem>
                    <SelectItem value="Lunas">Lunas</SelectItem>
                    <SelectItem value="Dihapuskan">Dihapuskan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
            <Button type="button" onClick={handleSaveEntry} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Catatan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Management Dialog */}
      {selectedEntryForPayment && (
        <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { setIsPaymentDialogOpen(open); if(!open) setSelectedEntryForPayment(null); }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Kelola Pembayaran untuk: {selectedEntryForPayment.entityName}</DialogTitle>
                    <DialogDescription>
                        Transaksi: {selectedEntryForPayment.description} <br/>
                        Jumlah Awal: Rp {selectedEntryForPayment.initialAmount.toLocaleString()} | Sisa: Rp <span className="font-bold text-destructive">{selectedEntryForPayment.remainingAmount.toLocaleString()}</span> | Status: <Badge className={`${getStatusBadgeColor(selectedEntryForPayment.status)} text-white`}>{selectedEntryForPayment.status}</Badge>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow grid md:grid-cols-2 gap-6 overflow-y-auto p-1">
                    <div className="space-y-4 border-r-0 md:border-r md:pr-6">
                        <h3 className="text-md font-semibold">Tambah Pembayaran Baru</h3>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentDateForm" className="text-right col-span-1">Tgl Bayar<span className="text-destructive">*</span></Label>
                            <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!paymentDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{paymentDate ? format(paymentDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus /></PopoverContent></Popover>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amountPaidForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label>
                            <Input id="amountPaidForm" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="col-span-3" placeholder="e.g. 100000" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="paymentMethodForm" className="text-right col-span-1">Metode Bayar</Label>
                            <Input id="paymentMethodForm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="col-span-3" placeholder="Tunai, Transfer BCA (Opsional)" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="paymentNotesForm" className="text-right col-span-1 pt-2">Catatan</Label>
                            <Textarea id="paymentNotesForm" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="col-span-3" placeholder="Catatan pembayaran (opsional)" rows={2}/>
                        </div>
                        <Button onClick={handleSavePayment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={selectedEntryForPayment.status === 'Lunas' || selectedEntryForPayment.status === 'Dihapuskan'}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Simpan Pembayaran
                        </Button>
                        {(selectedEntryForPayment.status === 'Lunas' || selectedEntryForPayment.status === 'Dihapuskan') && <p className="text-xs text-center text-muted-foreground">Transaksi ini sudah lunas atau dihapuskan, tidak dapat menambah pembayaran.</p>}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-md font-semibold">Riwayat Pembayaran</h3>
                        {payments.filter(p => p.accountEntryId === selectedEntryForPayment.id).length > 0 ? (
                             <div className="max-h-72 overflow-y-auto">
                                <Table>
                                    <TableHeader><TableRow><TableHead>Tgl Bayar</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead>Metode</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {payments.filter(p => p.accountEntryId === selectedEntryForPayment.id)
                                        .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                        .map(p => (
                                            <TableRow key={p.id}>
                                                <TableCell className="text-xs">{format(parseISO(p.paymentDate), "dd MMM yy", { locale: localeID })}</TableCell>
                                                <TableCell className="text-right text-xs">Rp {p.amountPaid.toLocaleString()}</TableCell>
                                                <TableCell className="text-xs">{p.paymentMethod || '-'}</TableCell>
                                                <TableCell className="text-xs">{p.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center text-sm py-4">Belum ada pembayaran untuk catatan ini.</p>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-4 pt-4 border-t">
                    <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    