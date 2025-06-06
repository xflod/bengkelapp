
"use client";

import React, { useState, useEffect, useCallback, useMemo, useId } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { AccountEntry, AccountPayment, AccountEntryType, AccountEntryNature, AccountEntryStatus } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { PlusCircle, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, CircleDollarSign, BookOpenText } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });

export default function AccountsLedgerPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [payments, setPayments] = useState<AccountPayment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormEntryDialogOpen, setIsFormEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountEntry | null>(null);

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

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedEntryForPayment, setSelectedEntryForPayment] = useState<AccountEntry | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [amountPaid, setAmountPaid] = useState<string | number>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const entryFormDialogTitleId = useId();
  const paymentDialogTitleId = useId();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: entriesData, error: entriesError } = await supabase.from('account_ledger_entries').select('*').order('entry_date', { ascending: false });
      if (entriesError) throw entriesError;
      setEntries(entriesData.map(e => ({...e, id: String(e.id)})) as AccountEntry[]);

      const { data: paymentsData, error: paymentsError } = await supabase.from('account_ledger_payments').select('*').order('payment_date', { ascending: false });
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData.map(p => ({...p, id: String(p.id), accountEntryId: String(p.account_entry_id) })) as AccountPayment[]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Memuat Data Buku Besar", description: error.message });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetEntryFormFields = useCallback(() => { setEditingEntry(null); setEntityType(undefined); setEntityName(''); setEntryNature(undefined); setEntryDate(startOfDay(new Date())); setDueDate(undefined); setInitialAmount(''); setDescription(''); setEntryStatus('Belum Lunas'); }, []);
  const handleOpenEntryFormDialog = useCallback((entry?: AccountEntry) => { if (entry) { setEditingEntry(entry); setEntityType(entry.entityType); setEntityName(entry.entityName); setEntryNature(entry.entryNature); setEntryDate(entry.entryDate && isValid(parseISO(entry.entryDate)) ? parseISO(entry.entryDate) : startOfDay(new Date())); setDueDate(entry.dueDate && isValid(parseISO(entry.dueDate)) ? parseISO(entry.dueDate) : undefined); setInitialAmount(entry.initialAmount); setDescription(entry.description); setEntryStatus(entry.status); } else { resetEntryFormFields(); } setIsFormEntryDialogOpen(true); }, [resetEntryFormFields]);

  const handleSaveEntry = async () => {
    if (!entityType || !entityName.trim() || !entryNature || !entryDate || !initialAmount || !description.trim()) { toast({ variant: "destructive", title: "Data Tidak Lengkap" }); return; }
    const parsedInitialAmount = parseFloat(String(initialAmount));
    if (isNaN(parsedInitialAmount) || parsedInitialAmount <= 0) { toast({ variant: "destructive", title: "Jumlah Awal Tdk Valid" }); return; }

    const now = new Date().toISOString();
    const entryDataToSave = {
      entity_type: entityType, entity_name: entityName.trim(), entry_nature: entryNature, entry_date: format(entryDate, 'yyyy-MM-dd'),
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined, initial_amount: parsedInitialAmount,
      description: description.trim(), updated_at: now,
      remaining_amount: editingEntry ? editingEntry.remainingAmount : parsedInitialAmount,
      status: editingEntry ? entryStatus : 'Belum Lunas' as AccountEntryStatus,
    };

    if (editingEntry && editingEntry.id) {
      let updatedEntryData = { ...entryDataToSave };
      if (editingEntry.initialAmount !== parsedInitialAmount) { 
        const relatedPaymentsTotal = payments.filter(p => p.accountEntryId === editingEntry?.id).reduce((sum, p) => sum + p.amountPaid, 0);
        updatedEntryData.remaining_amount = parsedInitialAmount - relatedPaymentsTotal;
        if (updatedEntryData.remaining_amount < 0) updatedEntryData.remaining_amount = 0;
        if (updatedEntryData.remaining_amount === 0) updatedEntryData.status = 'Lunas';
        else if (updatedEntryData.remaining_amount < parsedInitialAmount) updatedEntryData.status = 'Sebagian Lunas';
        else updatedEntryData.status = 'Belum Lunas';
      }
      const { error } = await supabase.from('account_ledger_entries').update(updatedEntryData).match({ id: editingEntry.id });
      if (error) toast({ variant: "destructive", title: "Gagal Update Catatan", description: error.message });
      else { toast({ title: "Catatan Diperbarui" }); fetchData(); }
    } else {
      const { error } = await supabase.from('account_ledger_entries').insert([{ ...entryDataToSave, created_at: now }]);
      if (error) toast({ variant: "destructive", title: "Gagal Tambah Catatan", description: error.message });
      else { toast({ title: "Catatan Ditambahkan" }); fetchData(); }
    }
    setIsFormEntryDialogOpen(false);
  };

  const handleDeleteEntry = useCallback(async (entryId: string, entryDesc: string) => {
    if (window.confirm(`Yakin hapus catatan "${entryDesc}"? Semua pembayaran terkait juga akan dihapus.`)) {
      await supabase.from('account_ledger_payments').delete().match({ account_entry_id: entryId });
      const { error } = await supabase.from('account_ledger_entries').delete().match({ id: entryId });
      if (error) toast({ variant: "destructive", title: "Gagal Hapus Catatan", description: error.message });
      else { toast({ title: "Catatan Dihapus" }); fetchData(); }
    }
  }, [toast, fetchData]);
  
  const resetPaymentFormFields = useCallback(() => { setPaymentDate(startOfDay(new Date())); setAmountPaid(''); setPaymentMethod(''); setPaymentNotes(''); }, []);
  const openPaymentDialog = useCallback((entry: AccountEntry) => { setSelectedEntryForPayment(entry); resetPaymentFormFields(); setIsPaymentDialogOpen(true); }, [resetPaymentFormFields]);

  const handleSavePayment = async () => {
    if (!selectedEntryForPayment || !paymentDate || !amountPaid) { toast({ variant: "destructive", title: "Data Pembayaran Tdk Lengkap"}); return; }
    const parsedAmountPaid = parseFloat(String(amountPaid));
    if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) { toast({ variant: "destructive", title: "Jumlah Bayar Tdk Valid"}); return; }
    if (parsedAmountPaid > selectedEntryForPayment.remainingAmount) { toast({ variant: "destructive", title: "Jml Bayar Melebihi Sisa"}); return; }

    const now = new Date().toISOString();
    const newPaymentData = {
      account_entry_id: selectedEntryForPayment.id, payment_date: format(paymentDate, 'yyyy-MM-dd'),
      amount_paid: parsedAmountPaid, payment_method: paymentMethod.trim() || undefined,
      notes: paymentNotes.trim() || undefined, created_at: now,
    };
    const { error: paymentError } = await supabase.from('account_ledger_payments').insert([newPaymentData]);
    if (paymentError) { toast({ variant: "destructive", title: "Gagal Simpan Pembayaran", description: paymentError.message }); return; }

    const newRemaining = Math.max(0, selectedEntryForPayment.remainingAmount - parsedAmountPaid);
    let newStatus: AccountEntryStatus = 'Belum Lunas';
    if (newRemaining === 0) newStatus = 'Lunas';
    else if (newRemaining < selectedEntryForPayment.initialAmount) newStatus = 'Sebagian Lunas';
    
    const { error: entryUpdateError } = await supabase.from('account_ledger_entries')
      .update({ remaining_amount: newRemaining, status: newStatus, updated_at: now })
      .match({ id: selectedEntryForPayment.id });
    
    if (entryUpdateError) toast({ variant: "destructive", title: "Gagal Update Catatan Induk", description: entryUpdateError.message });
    else { toast({ title: "Pembayaran Dicatat"}); fetchData(); setSelectedEntryForPayment(prev => prev ? {...prev, remainingAmount: newRemaining, status: newStatus} : null); }
    resetPaymentFormFields();
  };

  const getStatusBadgeColor = (status: AccountEntryStatus) => { switch (status) { case 'Belum Lunas': return 'bg-red-500'; case 'Sebagian Lunas': return 'bg-yellow-500'; case 'Lunas': return 'bg-green-500'; case 'Dihapuskan': return 'bg-gray-500'; default: return 'bg-slate-500'; } };
  const filteredEntries = useMemo(() => { return entries.filter(entry => { const searchTermLower = searchTerm.toLowerCase(); const matchesSearch = searchTerm ? entry.entityName.toLowerCase().includes(searchTermLower) || entry.description.toLowerCase().includes(searchTermLower) || (typeof entry.id === 'string' && entry.id.toLowerCase().includes(searchTermLower)) : true; const matchesNature = filterNature === 'all' ? true : entry.entryNature === filterNature; const matchesStatus = filterStatus === 'all' ? true : entry.status === filterStatus; return matchesSearch && matchesNature && matchesStatus; }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()); }, [entries, searchTerm, filterNature, filterStatus]);

  if (isLoading && entries.length === 0) { return <div className="flex justify-center items-center h-screen"><p>Memuat data buku keuangan...</p></div>; }

  return (
    <div className="space-y-6">
      <PageHeader title="Buku Besar Hutang & Piutang" description="Catat dan kelola semua transaksi hutang dan piutang." actions={ <Button onClick={() => handleOpenEntryFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" />Tambah Catatan</Button>}/>
      <Card className="shadow-md"><CardHeader><CardTitle>Filter Catatan</CardTitle><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2"><Input type="text" placeholder="Cari ID, Nama, Deskripsi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:col-span-1"/><Select value={filterNature} onValueChange={(value) => setFilterNature(value as 'all' | AccountEntryNature)}><SelectTrigger><SelectValue placeholder="Filter Sifat..." /></SelectTrigger><SelectContent><SelectItem value="all">Semua Sifat</SelectItem><SelectItem value="Piutang Usaha">Piutang Usaha</SelectItem><SelectItem value="Hutang Usaha">Hutang Usaha</SelectItem><SelectItem value="Piutang Lainnya">Piutang Lainnya</SelectItem><SelectItem value="Hutang Lainnya">Hutang Lainnya</SelectItem></SelectContent></Select><Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as 'all' | AccountEntryStatus)}><SelectTrigger><SelectValue placeholder="Filter Status..." /></SelectTrigger><SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="Belum Lunas">Belum Lunas</SelectItem><SelectItem value="Sebagian Lunas">Sebagian Lunas</SelectItem><SelectItem value="Lunas">Lunas</SelectItem><SelectItem value="Dihapuskan">Dihapuskan</SelectItem></SelectContent></Select></div></CardHeader>
        <CardContent>{filteredEntries.length > 0 ? (<div className="overflow-x-auto max-h-[65vh]"><Table><TableHeader className="sticky top-0 bg-card z-10"><TableRow><TableHead className="min-w-[150px]">Entitas</TableHead><TableHead className="min-w-[130px]">Sifat</TableHead><TableHead className="min-w-[200px]">Deskripsi</TableHead><TableHead className="text-right min-w-[120px]">Jumlah Awal</TableHead><TableHead className="text-right min-w-[120px]">Sisa</TableHead><TableHead className="text-center min-w-[120px]">Status</TableHead><TableHead className="text-center min-w-[120px]">Tgl. Trans</TableHead><TableHead className="text-center w-[180px]">Aksi</TableHead></TableRow></TableHeader><TableBody>
          {filteredEntries.map((entry) => (<TableRow key={entry.id} className={entry.status === 'Dihapuskan' ? 'opacity-50' : ''}><TableCell className="font-medium">{entry.entityName} <br/><span className="text-xs text-muted-foreground">({entry.entityType})</span></TableCell><TableCell>{entry.entryNature}</TableCell><TableCell className="text-xs">{entry.description}</TableCell><TableCell className="text-right whitespace-nowrap">Rp {entry.initialAmount.toLocaleString()}</TableCell><TableCell className="text-right whitespace-nowrap font-semibold">Rp {entry.remainingAmount.toLocaleString()}</TableCell><TableCell className="text-center"><Badge className={`${getStatusBadgeColor(entry.status)} text-white hover:${getStatusBadgeColor(entry.status)}`}>{entry.status}</Badge></TableCell><TableCell className="text-center">{format(parseISO(entry.entryDate), "dd MMM yyyy", { locale: localeID })}</TableCell><TableCell className="text-center"><div className="flex justify-center items-center gap-1 flex-wrap"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenEntryFormDialog(entry)} title="Edit"><Edit3 className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openPaymentDialog(entry)} title="Pembayaran" disabled={entry.status === 'Lunas' || entry.status === 'Dihapuskan'}><CircleDollarSign className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEntry(entry.id, entry.description)} title="Hapus"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}
        </TableBody></Table></div>) : (<Card className="w-full text-center shadow-none border-dashed py-10"><CardHeader className="items-center"><BookOpenText className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">{searchTerm || filterNature !== 'all' || filterStatus !== 'all' ? "Catatan Tdk Ditemukan" : "Belum Ada Catatan"}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{searchTerm || filterNature !== 'all' || filterStatus !== 'all' ? "Tidak ada catatan cocok." : "Klik 'Tambah Catatan'."}</p></CardContent></Card>)}</CardContent>
      </Card>
      {isFormEntryDialogOpen && (
        <DynamicDialog open={isFormEntryDialogOpen} onOpenChange={(open) => { setIsFormEntryDialogOpen(open); if (!open) resetEntryFormFields(); }}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" aria-labelledby={entryFormDialogTitleId}>
            <DynamicDialogHeader className="flex-shrink-0">
              <DynamicDialogTitle id={entryFormDialogTitleId}>{editingEntry ? 'Edit Catatan' : 'Tambah Catatan Baru'}</DynamicDialogTitle>
            </DynamicDialogHeader>
            <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
              <div className="grid grid-cols-4 items-center"><Label htmlFor="entityType" className="text-right col-span-1 pr-3">Tipe<span className="text-destructive">*</span></Label><Select value={entityType} onValueChange={(v) => setEntityType(v as AccountEntryType)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih tipe"/></SelectTrigger><SelectContent><SelectItem value="Pelanggan">Pelanggan</SelectItem><SelectItem value="Partner Bengkel">Partner Bengkel</SelectItem><SelectItem value="Supplier">Supplier</SelectItem><SelectItem value="Operasional & Lainnya">Operasional & Lainnya</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="entityName" className="text-right col-span-1 pr-3">Nama<span className="text-destructive">*</span></Label><Input id="entityName" value={entityName} onChange={(e) => setEntityName(e.target.value)} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="entryNature" className="text-right col-span-1 pr-3">Sifat<span className="text-destructive">*</span></Label><Select value={entryNature} onValueChange={(v) => setEntryNature(v as AccountEntryNature)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Pilih sifat"/></SelectTrigger><SelectContent><SelectItem value="Piutang Usaha">Piutang Usaha</SelectItem><SelectItem value="Hutang Usaha">Hutang Usaha</SelectItem><SelectItem value="Piutang Lainnya">Piutang Lainnya</SelectItem><SelectItem value="Hutang Lainnya">Hutang Lainnya</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="entryDate" className="text-right col-span-1 pr-3">Tgl. Trans<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!entryDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{entryDate ? format(entryDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={entryDate} onSelect={setEntryDate} initialFocus /></PopoverContent></Popover></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="dueDate" className="text-right col-span-1 pr-3">Jatuh Tempo</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP", { locale: localeID }) : <span>Pilih (opsional)</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} /></PopoverContent></Popover></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="initialAmount" className="text-right col-span-1 pr-3">Jml Awal (Rp)<span className="text-destructive">*</span></Label><Input id="initialAmount" type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} className="col-span-3" disabled={!!editingEntry && payments.some(p => p.accountEntryId === editingEntry?.id)} title={editingEntry && payments.some(p => p.accountEntryId === editingEntry?.id) ? "Tdk bisa diubah jika ada pembayaran." : ""} /></div>
              <div className="grid grid-cols-4 items-start"><Label htmlFor="description" className="text-right col-span-1 pt-2 pr-3">Deskripsi<span className="text-destructive">*</span></Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={3}/></div>
              {editingEntry && (<div className="grid grid-cols-4 items-center"><Label htmlFor="entryStatus" className="text-right col-span-1 pr-3">Status<span className="text-destructive">*</span></Label><Select value={entryStatus} onValueChange={(v) => setEntryStatus(v as AccountEntryStatus)}><SelectTrigger className="col-span-3"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Belum Lunas">Belum Lunas</SelectItem><SelectItem value="Sebagian Lunas">Sebagian Lunas</SelectItem><SelectItem value="Lunas">Lunas</SelectItem><SelectItem value="Dihapuskan">Dihapuskan</SelectItem></SelectContent></Select></div>)}
            </div>
            <DynamicDialogFooter className="flex-shrink-0 pt-4 border-t">
              <DynamicDialogClose asChild><Button type="button" variant="outline">Batal</Button></DynamicDialogClose>
              <Button type="button" onClick={handleSaveEntry} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
      {selectedEntryForPayment && (
        <DynamicDialog open={isPaymentDialogOpen} onOpenChange={(open) => { setIsPaymentDialogOpen(open); if(!open) setSelectedEntryForPayment(null); }}>
          <DynamicDialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" aria-labelledby={paymentDialogTitleId}>
            <DynamicDialogHeader>
              <DynamicDialogTitle id={paymentDialogTitleId}>Kelola Pembayaran: {selectedEntryForPayment.entityName}</DynamicDialogTitle>
              <DynamicDialogDescription>Transaksi: {selectedEntryForPayment.description} <br/>Jml Awal: Rp {selectedEntryForPayment.initialAmount.toLocaleString()} | Sisa: Rp <span className="font-bold text-destructive">{selectedEntryForPayment.remainingAmount.toLocaleString()}</span> | Status: <Badge className={`${getStatusBadgeColor(selectedEntryForPayment.status)} text-white`}>{selectedEntryForPayment.status}</Badge></DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="flex-grow grid md:grid-cols-2 gap-6 overflow-y-auto p-1">
              <div className="space-y-4 border-r-0 md:border-r md:pr-6">
                <h3 className="text-md font-semibold">Tambah Pembayaran</h3>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="paymentDateForm" className="text-right col-span-1">Tgl Bayar<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!paymentDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{paymentDate ? format(paymentDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} initialFocus /></PopoverContent></Popover></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amountPaidForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label><Input id="amountPaidForm" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className="col-span-3"/></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="paymentMethodForm" className="text-right col-span-1">Metode</Label><Input id="paymentMethodForm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="col-span-3" placeholder="Tunai, Transfer (Opsional)"/></div>
                <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="paymentNotesForm" className="text-right col-span-1 pt-2">Catatan</Label><Textarea id="paymentNotesForm" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="col-span-3" rows={2}/></div>
                <Button onClick={handleSavePayment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={selectedEntryForPayment.status === 'Lunas' || selectedEntryForPayment.status === 'Dihapuskan'}><PlusCircle className="mr-2 h-4 w-4"/> Simpan</Button>
                {(selectedEntryForPayment.status === 'Lunas' || selectedEntryForPayment.status === 'Dihapuskan') && <p className="text-xs text-center text-muted-foreground">Transaksi sudah lunas/dihapus.</p>}
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-semibold">Riwayat Pembayaran</h3>
                {payments.filter(p => p.accountEntryId === selectedEntryForPayment.id).length > 0 ? (
                  <div className="max-h-72 overflow-y-auto">
                    <Table><TableHeader><TableRow><TableHead>Tgl Bayar</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead>Metode</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader><TableBody>
                      {payments.filter(p => p.accountEntryId === selectedEntryForPayment.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(p => (<TableRow key={p.id}><TableCell className="text-xs">{format(parseISO(p.paymentDate), "dd MMM yy", { locale: localeID })}</TableCell><TableCell className="text-right text-xs">Rp {p.amountPaid.toLocaleString()}</TableCell><TableCell className="text-xs">{p.paymentMethod || '-'}</TableCell><TableCell className="text-xs">{p.notes || '-'}</TableCell></TableRow>))}
                    </TableBody></Table>
                  </div>
                ) : (<p className="text-muted-foreground text-center text-sm py-4">Belum ada pembayaran.</p>)}
              </div>
            </div>
            <DynamicDialogFooter className="mt-4 pt-4 border-t">
              <DynamicDialogClose asChild><Button variant="outline">Tutup</Button></DynamicDialogClose>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}
