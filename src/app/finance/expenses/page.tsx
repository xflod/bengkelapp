
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { PlusCircle, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, ReceiptText } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });


const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Operasional Bengkel', 'Gaji & Komisi', 'Pembelian Alat & Aset', 'Promosi & Marketing', 'Administrasi & Pajak', 'Biaya Tak Terduga', 'Lainnya'];

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [expenseDate, setExpenseDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [category, setCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string | number>('');
  const [notes, setNotes] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | ExpenseCategory>('all');

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('expenses_data').select('*').order('expense_date', { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Gagal Memuat Pengeluaran", description: error.message });
      setExpenses([]);
    } else {
      setExpenses(data as Expense[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const resetFormFields = useCallback(() => { setEditingExpense(null); setExpenseDate(startOfDay(new Date())); setCategory(undefined); setDescription(''); setAmount(''); setNotes(''); }, []);
  const handleOpenFormDialog = useCallback((expense?: Expense) => { if (expense) { setEditingExpense(expense); setExpenseDate(expense.expenseDate && isValid(parseISO(expense.expenseDate)) ? parseISO(expense.expenseDate) : startOfDay(new Date())); setCategory(expense.category); setDescription(expense.description); setAmount(expense.amount); setNotes(expense.notes || ''); } else { resetFormFields(); } setIsFormOpen(true); }, [resetFormFields]);

  const handleSaveExpense = async () => {
    if (!expenseDate || !category || !description.trim() || !amount) { toast({ variant: "destructive", title: "Data Tidak Lengkap" }); return; }
    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast({ variant: "destructive", title: "Jumlah Tidak Valid" }); return; }

    const now = new Date().toISOString();
    const expenseDataToSave = {
      expense_date: format(expenseDate, 'yyyy-MM-dd'), category, description: description.trim(),
      amount: parsedAmount, notes: notes.trim() || undefined, updated_at: now,
    };

    if (editingExpense && editingExpense.id) {
      const { error } = await supabase.from('expenses_data').update(expenseDataToSave).match({ id: editingExpense.id });
      if (error) toast({ variant: "destructive", title: "Gagal Update Pengeluaran", description: error.message });
      else { toast({ title: "Pengeluaran Diperbarui" }); fetchExpenses(); }
    } else {
      const { error } = await supabase.from('expenses_data').insert([{ ...expenseDataToSave, created_at: now }]);
      if (error) toast({ variant: "destructive", title: "Gagal Tambah Pengeluaran", description: error.message });
      else { toast({ title: "Pengeluaran Ditambahkan" }); fetchExpenses(); }
    }
    setIsFormOpen(false);
  };

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    if (window.confirm("Yakin ingin menghapus catatan pengeluaran ini?")) {
      const { error } = await supabase.from('expenses_data').delete().match({ id: expenseId });
      if (error) toast({ variant: "destructive", title: "Gagal Hapus Pengeluaran", description: error.message });
      else { toast({ title: "Pengeluaran Dihapus" }); fetchExpenses(); }
    }
  }, [toast, fetchExpenses]);
  
  const filteredExpenses = useMemo(() => { return expenses.filter(expense => { const searchTermLower = searchTerm.toLowerCase(); const matchesSearch = searchTerm ? expense.description.toLowerCase().includes(searchTermLower) || (expense.notes && expense.notes.toLowerCase().includes(searchTermLower)) || (typeof expense.id === 'string' && expense.id.toLowerCase().includes(searchTermLower)) : true; const matchesCategory = filterCategory === 'all' ? true : expense.category === filterCategory; return matchesSearch && matchesCategory; }).sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()); }, [expenses, searchTerm, filterCategory]);

  if (isLoading && expenses.length === 0) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data pengeluaran...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pencatatan Pengeluaran Bengkel" description="Catat semua biaya operasional, gaji, pembelian, dan pengeluaran lainnya." actions={ <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" />Tambah Pengeluaran</Button>}/>
      <Card className="shadow-md">
        <CardHeader><CardTitle>Filter Catatan Pengeluaran</CardTitle><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2"><Input type="text" placeholder="Cari ID, Deskripsi, Catatan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="sm:col-span-1"/><Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as 'all' | ExpenseCategory)}><SelectTrigger><SelectValue placeholder="Filter Kategori..." /></SelectTrigger><SelectContent><SelectItem value="all">Semua Kategori</SelectItem>{EXPENSE_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div></CardHeader>
        <CardContent>{filteredExpenses.length > 0 ? (<div className="overflow-x-auto max-h-[65vh]"><Table><TableHeader className="sticky top-0 bg-card z-10"><TableRow><TableHead className="min-w-[120px]">Tgl. Pengeluaran</TableHead><TableHead className="min-w-[180px]">Kategori</TableHead><TableHead className="min-w-[250px]">Deskripsi</TableHead><TableHead className="text-right min-w-[130px]">Jumlah (Rp)</TableHead><TableHead className="min-w-[200px]">Catatan</TableHead><TableHead className="text-center w-[120px]">Aksi</TableHead></TableRow></TableHeader><TableBody>
          {filteredExpenses.map((expense) => (<TableRow key={expense.id}><TableCell>{format(parseISO(expense.expenseDate), "dd MMM yyyy", { locale: localeID })}</TableCell><TableCell>{expense.category}</TableCell><TableCell className="font-medium">{expense.description}</TableCell><TableCell className="text-right whitespace-nowrap">Rp {expense.amount.toLocaleString()}</TableCell><TableCell className="text-xs">{expense.notes || '-'}</TableCell><TableCell className="text-center"><div className="flex justify-center items-center gap-1 flex-wrap"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenFormDialog(expense)} title="Edit"><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExpense(expense.id)} title="Hapus"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}
        </TableBody></Table></div>) : (<Card className="w-full text-center shadow-none border-dashed py-10"><CardHeader className="items-center"><ReceiptText className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">{searchTerm || filterCategory !== 'all' ? "Pengeluaran Tdk Ditemukan" : "Belum Ada Pengeluaran"}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{searchTerm || filterCategory !== 'all' ? "Tidak ada pengeluaran cocok." : "Klik 'Tambah Pengeluaran'."}</p></CardContent></Card>)}</CardContent>
      </Card>
      {isFormOpen && (
        <DynamicDialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetFormFields(); }}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DynamicDialogHeader className="flex-shrink-0">
              <DynamicDialogTitle>{editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}</DynamicDialogTitle>
            </DynamicDialogHeader>
            <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
              <div className="grid grid-cols-4 items-center"><Label htmlFor="expenseDate" className="text-right col-span-4 sm:col-span-1 pr-3">Tgl.<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-4 sm:col-span-3 justify-start text-left font-normal ${!expenseDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{expenseDate ? format(expenseDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus /></PopoverContent></Popover></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="category" className="text-right col-span-4 sm:col-span-1 pr-3">Kategori<span className="text-destructive">*</span></Label><Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}><SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue placeholder="Pilih kategori"/></SelectTrigger><SelectContent>{EXPENSE_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="amount" className="text-right col-span-4 sm:col-span-1 pr-3">Jumlah (Rp)<span className="text-destructive">*</span></Label><Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-4 sm:col-span-3"/></div>
              <div className="grid grid-cols-4 items-start"><Label htmlFor="description" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Deskripsi<span className="text-destructive">*</span></Label><Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-4 sm:col-span-3" rows={2}/></div>
              <div className="grid grid-cols-4 items-start"><Label htmlFor="notes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Catatan</Label><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-4 sm:col-span-3" rows={3}/></div>
            </div>
            <DynamicDialogFooter className="flex-shrink-0 pt-4 border-t">
              <DynamicDialogClose asChild><Button type="button" variant="outline">Batal</Button></DynamicDialogClose>
              <Button type="button" onClick={handleSaveExpense} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}
