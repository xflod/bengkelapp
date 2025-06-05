
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { SavingsGoal, SavingsTransaction } from "@/lib/types";
import { PlusCircle, Edit3, Trash2, Eye, DollarSign, CalendarIcon as CalendarDateIcon, Hourglass, PiggyBank, Info } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, differenceInDays, addDays, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
  { id: 'GOAL-001', name: 'Liburan ke Bali', targetAmount: 10000000, currentAmount: 2500000, startDate: '2024-01-01', status: 'Aktif', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'GOAL-002', name: 'Motor Baru', targetAmount: 25000000, currentAmount: 25000000, startDate: '2023-06-01', status: 'Tercapai', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
const MOCK_SAVINGS_TRANSACTIONS: SavingsTransaction[] = [
  { id: 'TRX-S-001', goalId: 'GOAL-001', transactionDate: '2024-01-15', amount: 1000000, notes: 'Setoran awal', createdAt: new Date().toISOString() },
  { id: 'TRX-S-002', goalId: 'GOAL-001', transactionDate: '2024-02-15', amount: 1500000, notes: 'Gaji bulan Feb', createdAt: new Date().toISOString() },
  { id: 'TRX-S-003', goalId: 'GOAL-002', transactionDate: '2023-07-01', amount: 25000000, notes: 'Lunas', createdAt: new Date().toISOString() },
];


export default function SavingsBookPage() {
  const { toast } = useToast();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states for Goal
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState<string | number>('');
  const [goalStartDate, setGoalStartDate] = useState<Date | undefined>(startOfDay(new Date()));

  // Dialog states for Transaction
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [selectedGoalForTransaction, setSelectedGoalForTransaction] = useState<SavingsGoal | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<string | number>('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [transactionNotes, setTransactionNotes] = useState('');

  // Dialog state for Transaction History
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedGoalsString = localStorage.getItem('savingsGoalsDataBengkelKu');
      let parsedGoals;
      if (storedGoalsString) {
        parsedGoals = JSON.parse(storedGoalsString);
      }
      
      if (Array.isArray(parsedGoals)) {
        setSavingsGoals(parsedGoals);
      } else {
        setSavingsGoals(MOCK_SAVINGS_GOALS); 
        if (storedGoalsString && !Array.isArray(parsedGoals)) {
          toast({ variant: "destructive", title: "Data Target Lokal Rusak", description: "Memuat data contoh." });
        }
      }

      const storedTransactionsString = localStorage.getItem('savingsTransactionsDataBengkelKu');
      let parsedTransactions;
      if (storedTransactionsString) {
        parsedTransactions = JSON.parse(storedTransactionsString);
      }

      if (Array.isArray(parsedTransactions)) {
        setSavingsTransactions(parsedTransactions);
      } else {
        setSavingsTransactions(MOCK_SAVINGS_TRANSACTIONS);
        if (storedTransactionsString && !Array.isArray(parsedTransactions)) {
          toast({ variant: "destructive", title: "Data Transaksi Lokal Rusak", description: "Memuat data contoh." });
        }
      }

    } catch (error) {
      console.error("Failed to parse data from localStorage:", error);
      setSavingsGoals(MOCK_SAVINGS_GOALS);
      setSavingsTransactions(MOCK_SAVINGS_TRANSACTIONS);
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Kesalahan parsing, memuat data contoh." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('savingsGoalsDataBengkelKu', JSON.stringify(savingsGoals));
    }
  }, [savingsGoals, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('savingsTransactionsDataBengkelKu', JSON.stringify(savingsTransactions));
    }
  }, [savingsTransactions, isLoading]);

  const resetGoalForm = useCallback(() => {
    setEditingGoal(null);
    setGoalName('');
    setGoalTargetAmount('');
    setGoalStartDate(startOfDay(new Date()));
  }, []);

  const handleOpenGoalForm = useCallback((goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalName(goal.name);
      setGoalTargetAmount(goal.targetAmount);
      setGoalStartDate(goal.startDate && isValid(parseISO(goal.startDate)) ? parseISO(goal.startDate) : startOfDay(new Date()));
    } else {
      resetGoalForm();
    }
    setIsGoalFormOpen(true);
  }, [resetGoalForm]);

  const handleSaveGoal = () => {
    if (!goalName.trim() || !goalTargetAmount || !goalStartDate) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Nama, Jumlah Target, dan Tanggal Mulai wajib diisi." });
      return;
    }
    const parsedTargetAmount = parseFloat(String(goalTargetAmount));
    if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
      toast({ variant: "destructive", title: "Jumlah Target Tidak Valid", description: "Jumlah target harus angka positif." });
      return;
    }
    const now = new Date().toISOString();

    if (editingGoal) {
      const updatedGoal: SavingsGoal = {
        ...editingGoal,
        name: goalName.trim(),
        targetAmount: parsedTargetAmount,
        startDate: format(goalStartDate, 'yyyy-MM-dd'),
        status: editingGoal.currentAmount >= parsedTargetAmount ? 'Tercapai' : 'Aktif',
        updatedAt: now,
      };
      setSavingsGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g));
      toast({ title: "Target Tabungan Diperbarui" });
    } else {
      const newGoal: SavingsGoal = {
        id: `GOAL-${Date.now()}`,
        name: goalName.trim(),
        targetAmount: parsedTargetAmount,
        currentAmount: 0,
        startDate: format(goalStartDate, 'yyyy-MM-dd'),
        status: 'Aktif',
        createdAt: now,
        updatedAt: now,
      };
      setSavingsGoals(prev => [newGoal, ...prev]);
      toast({ title: "Target Tabungan Ditambahkan" });
    }
    setIsGoalFormOpen(false);
  };
  
  const handleDeleteGoal = useCallback((goalId: string) => {
    if (window.confirm("Yakin ingin menghapus target tabungan ini? Semua transaksi terkait juga akan dihapus.")) {
        setSavingsGoals(prev => prev.filter(g => g.id !== goalId));
        setSavingsTransactions(prev => prev.filter(t => t.goalId !== goalId));
        toast({ title: "Target Tabungan Dihapus" });
    }
  }, []);

  const resetTransactionForm = useCallback(() => {
    setTransactionAmount('');
    setTransactionDate(startOfDay(new Date()));
    setTransactionNotes('');
  }, []);

  const handleOpenTransactionForm = useCallback((goal: SavingsGoal) => {
    setSelectedGoalForTransaction(goal);
    resetTransactionForm();
    setIsTransactionFormOpen(true);
  }, [resetTransactionForm]);

  const handleSaveTransaction = () => {
    if (!selectedGoalForTransaction || !transactionAmount || !transactionDate) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Jumlah dan Tanggal Setoran wajib diisi." });
      return;
    }
    const parsedAmount = parseFloat(String(transactionAmount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ variant: "destructive", title: "Jumlah Setoran Tidak Valid" });
      return;
    }
    const now = new Date().toISOString();
    const newTransaction: SavingsTransaction = {
      id: `TRX-S-${Date.now()}`,
      goalId: selectedGoalForTransaction.id,
      transactionDate: format(transactionDate, 'yyyy-MM-dd'),
      amount: parsedAmount,
      notes: transactionNotes.trim() || undefined,
      createdAt: now,
    };
    setSavingsTransactions(prev => [newTransaction, ...prev]);
    
    setSavingsGoals(prevGoals => prevGoals.map(g => {
      if (g.id === selectedGoalForTransaction.id) {
        const newCurrentAmount = g.currentAmount + parsedAmount;
        return {
          ...g,
          currentAmount: newCurrentAmount,
          status: newCurrentAmount >= g.targetAmount ? 'Tercapai' : 'Aktif',
          updatedAt: now,
        };
      }
      return g;
    }));
    toast({ title: "Setoran Ditambahkan" });
    setIsTransactionFormOpen(false);
  };

  const handleOpenHistoryDialog = (goal: SavingsGoal) => {
    setSelectedGoalForHistory(goal);
    setIsHistoryDialogOpen(true);
  };

  const calculateAverageDailySavings = useCallback((goal: SavingsGoal) => {
    const goalTransactions = savingsTransactions.filter(t => t.goalId === goal.id);
    if (goalTransactions.length === 0 || !goal.startDate || !isValid(parseISO(goal.startDate))) return 0;

    const totalSavedForGoal = goalTransactions.reduce((sum, t) => sum + t.amount, 0);
    const daysSinceStart = differenceInDays(new Date(), parseISO(goal.startDate)) + 1; // +1 to include start day
    
    return daysSinceStart > 0 ? totalSavedForGoal / daysSinceStart : 0;
  }, [savingsTransactions]);

  const calculateEstimatedDaysToGoal = useCallback((goal: SavingsGoal) => {
    if (goal.status === 'Tercapai' || goal.currentAmount >= goal.targetAmount) return "Tercapai!";
    
    const averageDailySaving = calculateAverageDailySavings(goal);
    if (averageDailySaving <= 0) {
        const goalTransactions = savingsTransactions.filter(t => t.goalId === goal.id);
        return goalTransactions.length > 0 ? "N/A (tidak ada progres positif)" : "Belum ada data setoran.";
    }
    
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    if (remainingAmount <= 0) return "Tercapai!";

    const estimatedDays = Math.ceil(remainingAmount / averageDailySaving);
    
    if (!isFinite(estimatedDays) || estimatedDays <= 0) return "Belum ada data setoran yang cukup untuk estimasi.";

    const futureDate = addDays(new Date(), estimatedDays);
    return `Sekitar ${estimatedDays} hari lagi (Estimasi: ${format(futureDate, "dd MMM yyyy", { locale: localeID })})`;
  }, [calculateAverageDailySavings, savingsTransactions]);

  const getGoalStatusBadge = (status: 'Aktif' | 'Tercapai') => {
    if (status === 'Tercapai') {
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Tercapai</Badge>;
    }
    return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Aktif</Badge>;
  };

  const sortedGoals = useMemo(() => {
    return [...savingsGoals].sort((a, b) => {
      if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
      if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [savingsGoals]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buku Tabungan & Target"
        description="Kelola target tabungan Anda dan catat setiap setoran."
        actions={
          <Button onClick={() => handleOpenGoalForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Target Baru
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Hourglass className="h-12 w-12 text-primary animate-spin" /></div>
      ) : savingsGoals.length === 0 ? (
        <Card className="w-full max-w-md mx-auto text-center shadow-lg border-dashed border-gray-300 py-10">
          <CardHeader className="items-center">
             <PiggyBank className="w-16 h-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl text-foreground">
              Belum Ada Target Tabungan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Saat ini belum ada target tabungan. <br/>Klik "Tambah Target Baru" untuk memulai.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedGoals.map(goal => (
            <Card key={goal.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl text-primary">{goal.name}</CardTitle>
                  {getGoalStatusBadge(goal.status)}
                </div>
                <CardDescription>Target: Rp {goal.targetAmount.toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Terkumpul:</span>
                    <span className="text-sm font-semibold text-foreground">Rp {goal.currentAmount.toLocaleString()}</span>
                  </div>
                  <Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-3" />
                   <p className="text-xs text-muted-foreground mt-1 text-right">
                    {(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1))}% dari target
                  </p>
                </div>
                <div className="p-2 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground">Estimasi Pencapaian:</p>
                  <p className="text-sm font-medium text-accent-foreground">
                    {goal.status === 'Tercapai' ? 'Sudah Tercapai!' : calculateEstimatedDaysToGoal(goal)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Mulai menabung: {format(parseISO(goal.startDate), "dd MMM yyyy", { locale: localeID })}</p>
              </CardContent>
              <CardFooter className="grid grid-cols-2 gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => handleOpenTransactionForm(goal)} disabled={goal.status === 'Tercapai'} className="col-span-2">
                  <DollarSign className="mr-2 h-4 w-4" /> Tambah Setoran
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpenHistoryDialog(goal)}>
                  <Eye className="mr-2 h-4 w-4" /> Riwayat
                </Button>
                 <Button variant="ghost" size="sm" onClick={() => handleOpenGoalForm(goal)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit Target
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteGoal(goal.id)} className="col-span-2 mt-1">
                  <Trash2 className="mr-2 h-4 w-4" /> Hapus Target
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={isGoalFormOpen} onOpenChange={(open) => { setIsGoalFormOpen(open); if (!open) resetGoalForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Target Tabungan' : 'Tambah Target Tabungan Baru'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalNameForm" className="text-right col-span-1">Nama Target<span className="text-destructive">*</span></Label>
              <Input id="goalNameForm" value={goalName} onChange={e => setGoalName(e.target.value)} className="col-span-3" placeholder="Mis: Dana Darurat, Beli Motor" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalTargetAmountForm" className="text-right col-span-1">Jumlah Target (Rp)<span className="text-destructive">*</span></Label>
              <Input id="goalTargetAmountForm" type="number" value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 5000000" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="goalStartDateForm" className="text-right col-span-1">Tgl. Mulai Nabung<span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!goalStartDate && "text-muted-foreground"}`}>
                    <CalendarDateIcon className="mr-2 h-4 w-4" />
                    {goalStartDate ? format(goalStartDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={goalStartDate} onSelect={setGoalStartDate} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
            <Button onClick={handleSaveGoal} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Target</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      {selectedGoalForTransaction && (
        <Dialog open={isTransactionFormOpen} onOpenChange={(open) => { setIsTransactionFormOpen(open); if (!open) setSelectedGoalForTransaction(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Setoran untuk: {selectedGoalForTransaction.name}</DialogTitle>
              <DialogDescription>Target: Rp {selectedGoalForTransaction.targetAmount.toLocaleString()} | Terkumpul: Rp {selectedGoalForTransaction.currentAmount.toLocaleString()}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionAmountForm" className="text-right col-span-1">Jumlah Setoran (Rp)<span className="text-destructive">*</span></Label>
                <Input id="transactionAmountForm" type="number" value={transactionAmount} onChange={e => setTransactionAmount(e.target.value)} className="col-span-3" placeholder="Contoh: 100000" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="transactionDateForm" className="text-right col-span-1">Tgl. Setoran<span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!transactionDate && "text-muted-foreground"}`}>
                      <CalendarDateIcon className="mr-2 h-4 w-4" />
                      {transactionDate ? format(transactionDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={transactionDate} onSelect={setTransactionDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="transactionNotesForm" className="text-right col-span-1 pt-2">Catatan</Label>
                <Textarea id="transactionNotesForm" value={transactionNotes} onChange={e => setTransactionNotes(e.target.value)} className="col-span-3" placeholder="Catatan setoran (opsional)" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
              <Button onClick={handleSaveTransaction} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Setoran</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Transaction History Dialog */}
      {selectedGoalForHistory && (
        <Dialog open={isHistoryDialogOpen} onOpenChange={(open) => { setIsHistoryDialogOpen(open); if (!open) setSelectedGoalForHistory(null); }}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Riwayat Setoran: {selectedGoalForHistory.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2">
              {savingsTransactions.filter(t => t.goalId === selectedGoalForHistory.id).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingsTransactions.filter(t => t.goalId === selectedGoalForHistory.id)
                      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                      .map(trx => (
                        <TableRow key={trx.id}>
                          <TableCell>{format(parseISO(trx.transactionDate), "dd MMM yyyy", { locale: localeID })}</TableCell>
                          <TableCell className="text-right">Rp {trx.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-xs">{trx.notes || '-'}</TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">Belum ada riwayat setoran untuk target ini.</p>
              )}
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


    