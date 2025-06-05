
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
import { useToast } from "@/hooks/use-toast";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { PlusCircle, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, ReceiptText } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const MOCK_EXPENSES: Expense[] = [
  { id: 'EXP-001', expenseDate: '2024-05-10', category: 'Operasional Bengkel', description: 'Beli sabun cuci motor', amount: 50000, notes: 'Stok 2 botol', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'EXP-002', expenseDate: '2024-05-15', category: 'Gaji & Komisi', description: 'Gaji Budi Mekanik (Mingguan)', amount: 750000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'EXP-003', expenseDate: '2024-05-20', category: 'Pembelian Alat & Aset', description: 'Beli kunci pas set baru', amount: 350000, notes: 'Merek Tekiro', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    'Operasional Bengkel', 
    'Gaji & Komisi', 
    'Pembelian Alat & Aset', 
    'Promosi & Marketing', 
    'Administrasi & Pajak', 
    'Biaya Tak Terduga', 
    'Lainnya'
];

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [category, setCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string | number>('');
  const [notes, setNotes] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | ExpenseCategory>('all');

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedExpenses = localStorage.getItem('expensesDataBengkelKu');
      const parsedExpenses = storedExpenses ? JSON.parse(storedExpenses) : MOCK_EXPENSES;
      if (Array.isArray(parsedExpenses)) {
        setExpenses(parsedExpenses);
      } else {
        setExpenses(MOCK_EXPENSES);
        toast({ variant: "destructive", title: "Data Pengeluaran Lokal Rusak", description: "Memuat data contoh." });
      }
    } catch (error) {
      console.error("Failed to parse expenses from localStorage:", error);
      setExpenses(MOCK_EXPENSES);
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Kesalahan parsing, memuat data contoh." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('expensesDataBengkelKu', JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  const resetFormFields = useCallback(() => {
    setEditingExpense(null);
    setExpenseDate(startOfDay(new Date()));
    setCategory(undefined);
    setDescription('');
    setAmount('');
    setNotes('');
  }, []);

  const handleOpenFormDialog = useCallback((expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseDate(expense.expenseDate && isValid(parseISO(expense.expenseDate)) ? parseISO(expense.expenseDate) : startOfDay(new Date()));
      setCategory(expense.category);
      setDescription(expense.description);
      setAmount(expense.amount);
      setNotes(expense.notes || '');
    } else {
      resetFormFields();
    }
    setIsFormOpen(true);
  }, [resetFormFields]);

  const handleSaveExpense = () => {
    if (!expenseDate || !category || !description.trim() || !amount) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Tanggal, Kategori, Deskripsi, dan Jumlah wajib diisi." });
      return;
    }
    const parsedAmount = parseFloat(String(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ variant: "destructive", title: "Jumlah Tidak Valid", description: "Jumlah pengeluaran harus angka positif." });
      return;
    }

    const now = new Date().toISOString();
    const expenseId = editingExpense ? editingExpense.id : `EXP-${Date.now()}`;
    
    const newExpenseData: Expense = {
      id: expenseId,
      expenseDate: format(expenseDate, 'yyyy-MM-dd'),
      category: category,
      description: description.trim(),
      amount: parsedAmount,
      notes: notes.trim() || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : now,
      updatedAt: now,
    };

    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? newExpenseData : exp));
      toast({ title: "Pengeluaran Diperbarui" });
    } else {
      setExpenses(prev => [newExpenseData, ...prev]);
      toast({ title: "Pengeluaran Ditambahkan" });
    }
    setIsFormOpen(false);
  };

  const handleDeleteExpense = useCallback((expenseId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) {
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      toast({ title: "Pengeluaran Dihapus" });
    }
  }, []);
  
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? 
        expense.description.toLowerCase().includes(searchTermLower) ||
        (expense.notes && expense.notes.toLowerCase().includes(searchTermLower)) ||
        expense.id.toLowerCase().includes(searchTermLower)
        : true;
      const matchesCategory = filterCategory === 'all' ? true : expense.category === filterCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
  }, [expenses, searchTerm, filterCategory]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data pengeluaran...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pencatatan Pengeluaran Bengkel"
        description="Catat semua biaya operasional, gaji, pembelian, dan pengeluaran lainnya."
        actions={
          <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        }
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filter Catatan Pengeluaran</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <Input
              type="text"
              placeholder="Cari ID, Deskripsi, Catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="sm:col-span-1"
            />
            <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as 'all' | ExpenseCategory)}>
              <SelectTrigger><SelectValue placeholder="Filter Kategori Pengeluaran..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {EXPENSE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length > 0 ? (
            <div className="overflow-x-auto max-h-[65vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[120px]">Tgl. Pengeluaran</TableHead>
                    <TableHead className="min-w-[180px]">Kategori</TableHead>
                    <TableHead className="min-w-[250px]">Deskripsi</TableHead>
                    <TableHead className="text-right min-w-[130px]">Jumlah (Rp)</TableHead>
                    <TableHead className="min-w-[200px]">Catatan</TableHead>
                    <TableHead className="text-center w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(parseISO(expense.expenseDate), "dd MMM yyyy", { locale: localeID })}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">Rp {expense.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{expense.notes || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1 flex-wrap">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenFormDialog(expense)} title="Edit Pengeluaran">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteExpense(expense.id)} title="Hapus Pengeluaran">
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
                  <ReceiptText className="w-16 h-16 text-muted-foreground mb-4" />
                  <CardTitle className="text-xl text-foreground">
                    {searchTerm || filterCategory !== 'all' ? "Pengeluaran Tidak Ditemukan" : "Belum Ada Catatan Pengeluaran"}
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">
                    {searchTerm || filterCategory !== 'all' ? 
                      "Tidak ada catatan pengeluaran yang cocok dengan kriteria pencarian atau filter Anda." :
                      "Saat ini tidak ada catatan pengeluaran. Klik 'Tambah Pengeluaran' untuk memulai."
                    }
                  </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Expense Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetFormFields(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingExpense ? 'Edit Catatan Pengeluaran' : 'Tambah Pengeluaran Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="expenseDate" className="text-right col-span-4 sm:col-span-1 pr-3">Tgl. Pengeluaran<span className="text-destructive">*</span></Label>
              <Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-4 sm:col-span-3 justify-start text-left font-normal ${!expenseDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{expenseDate ? format(expenseDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={expenseDate} onSelect={setExpenseDate} initialFocus /></PopoverContent></Popover>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="category" className="text-right col-span-4 sm:col-span-1 pr-3">Kategori<span className="text-destructive">*</span></Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue placeholder="Pilih kategori pengeluaran"/></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center">
              <Label htmlFor="amount" className="text-right col-span-4 sm:col-span-1 pr-3">Jumlah (Rp)<span className="text-destructive">*</span></Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 150000" />
            </div>
            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="description" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Deskripsi<span className="text-destructive">*</span></Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Deskripsi singkat pengeluaran" rows={2}/>
            </div>
            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="notes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Catatan</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Catatan tambahan (opsional)" rows={3}/>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
            <Button type="button" onClick={handleSaveExpense} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Pengeluaran</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
