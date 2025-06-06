
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
import type { SavingsGoal, SavingsTransaction, SavingsGoalStatus } from "@/lib/types"; 
import { supabase } from '@/lib/supabase';
import { PlusCircle, Edit3, Trash2, Eye, DollarSign, CalendarIcon as CalendarDateIcon, Hourglass, PiggyBank, Info } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid, differenceInDays, addDays, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export default function SavingsBookPage() {
  const { toast } = useToast();
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState<string | number>('');
  const [goalStartDate, setGoalStartDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [goalTargetDate, setGoalTargetDate] = useState<Date | undefined>(undefined); 
  const [goalNotes, setGoalNotes] = useState(''); 

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [selectedGoalForTransaction, setSelectedGoalForTransaction] = useState<SavingsGoal | null>(null);
  const [transactionAmount, setTransactionAmount] = useState<string | number>('');
  const [transactionDate, setTransactionDate] = useState<Date | undefined>(startOfDay(new Date()));
  const [transactionNotes, setTransactionNotes] = useState('');
  const [transactionType, setTransactionType] = useState<'Setoran' | 'Penarikan'>('Setoran'); 

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<SavingsGoal | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: goalsData, error: goalsError } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: false }); // Fixed: createdAt to created_at
      if (goalsError) throw goalsError;
      setSavingsGoals(goalsData.map(g => ({...g, id: String(g.id)})) as SavingsGoal[]);

      const { data: trxData, error: trxError } = await supabase.from('savings_transactions').select('*').order('transaction_date', { ascending: false });
      if (trxError) throw trxError;
      setSavingsTransactions(trxData.map(t => ({...t, id: String(t.id), goalId: String(t.goal_id)})) as SavingsTransaction[]);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Memuat Data Tabungan", description: error.message });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetGoalForm = useCallback(() => { setEditingGoal(null); setGoalName(''); setGoalTargetAmount(''); setGoalStartDate(startOfDay(new Date())); setGoalTargetDate(undefined); setGoalNotes(''); }, []);
  const handleOpenGoalForm = useCallback((goal?: SavingsGoal) => { if (goal) { setEditingGoal(goal); setGoalName(goal.name); setGoalTargetAmount(goal.targetAmount); setGoalStartDate(goal.startDate && isValid(parseISO(goal.startDate)) ? parseISO(goal.startDate) : startOfDay(new Date())); setGoalTargetDate(goal.targetDate && isValid(parseISO(goal.targetDate)) ? parseISO(goal.targetDate) : undefined); setGoalNotes(goal.notes || ''); } else { resetGoalForm(); } setIsGoalFormOpen(true); }, [resetGoalForm]);

  const handleSaveGoal = async () => {
    if (!goalName.trim() || !goalTargetAmount || !goalStartDate) { toast({ variant: "destructive", title: "Data Tidak Lengkap" }); return; }
    const parsedTargetAmount = parseFloat(String(goalTargetAmount));
    if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) { toast({ variant: "destructive", title: "Jumlah Target Tdk Valid" }); return; }
    const now = new Date().toISOString();

    const goalDataToSave = {
      name: goalName.trim(), target_amount: parsedTargetAmount, start_date: format(goalStartDate, 'yyyy-MM-dd'),
      target_date: goalTargetDate ? format(goalTargetDate, 'yyyy-MM-dd') : undefined,
      notes: goalNotes.trim() || undefined, updated_at: now,
    };

    if (editingGoal && editingGoal.id) {
      const currentAmount = editingGoal.currentAmount; 
      const status = currentAmount >= parsedTargetAmount ? 'Tercapai' : 'Aktif';
      const { error } = await supabase.from('savings_goals').update({ ...goalDataToSave, status: status as SavingsGoalStatus }).match({ id: editingGoal.id });
      if (error) toast({ variant: "destructive", title: "Gagal Update Target", description: error.message });
      else { toast({ title: "Target Diperbarui" }); fetchData(); }
    } else {
      const { error } = await supabase.from('savings_goals').insert([{ ...goalDataToSave, current_amount: 0, status: 'Aktif' as SavingsGoalStatus, created_at: now }]);
      if (error) toast({ variant: "destructive", title: "Gagal Tambah Target", description: error.message });
      else { toast({ title: "Target Ditambahkan" }); fetchData(); }
    }
    setIsGoalFormOpen(false);
  };
  
  const handleDeleteGoal = useCallback(async (goalId: string) => {
    if (window.confirm("Yakin hapus target ini? Semua transaksi terkait juga akan dihapus.")) {
      await supabase.from('savings_transactions').delete().match({ goal_id: goalId });
      const { error } = await supabase.from('savings_goals').delete().match({ id: goalId });
      if (error) toast({ variant: "destructive", title: "Gagal Hapus Target", description: error.message });
      else { toast({ title: "Target Dihapus" }); fetchData(); }
    }
  }, [toast, fetchData]);

  const resetTransactionForm = useCallback(() => { setTransactionAmount(''); setTransactionDate(startOfDay(new Date())); setTransactionNotes(''); setTransactionType('Setoran'); }, []);
  const handleOpenTransactionForm = useCallback((goal: SavingsGoal) => { setSelectedGoalForTransaction(goal); resetTransactionForm(); setIsTransactionFormOpen(true); }, [resetTransactionForm]);

  const handleSaveTransaction = async () => {
    if (!selectedGoalForTransaction || !transactionAmount || !transactionDate) { toast({ variant: "destructive", title: "Data Tdk Lengkap" }); return; }
    let parsedAmount = parseFloat(String(transactionAmount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) { toast({ variant: "destructive", title: "Jumlah Tdk Valid" }); return; }
    if (transactionType === 'Penarikan' && parsedAmount > selectedGoalForTransaction.currentAmount) { toast({ variant: "destructive", title: "Penarikan Melebihi Saldo" }); return; }
    
    const now = new Date().toISOString();
    const amountToChange = transactionType === 'Setoran' ? parsedAmount : -parsedAmount;

    const transactionData = {
      goal_id: selectedGoalForTransaction.id, transaction_date: format(transactionDate, 'yyyy-MM-dd'),
      amount: parsedAmount, 
      type: transactionType, notes: transactionNotes.trim() || undefined, created_at: now,
    };
    const { error: trxError } = await supabase.from('savings_transactions').insert([transactionData]);
    if (trxError) { toast({ variant: "destructive", title: "Gagal Simpan Transaksi", description: trxError.message }); return; }

    const newCurrentAmount = selectedGoalForTransaction.currentAmount + amountToChange;
    const newStatus = newCurrentAmount >= selectedGoalForTransaction.targetAmount ? 'Tercapai' : 'Aktif';

    const { error: goalUpdateError } = await supabase.from('savings_goals')
      .update({ current_amount: newCurrentAmount, status: newStatus as SavingsGoalStatus, updated_at: now })
      .match({ id: selectedGoalForTransaction.id });

    if (goalUpdateError) toast({ variant: "destructive", title: "Gagal Update Saldo Target", description: goalUpdateError.message });
    else { toast({ title: "Transaksi Disimpan" }); fetchData(); }
    
    setIsTransactionFormOpen(false);
  };

  const handleOpenHistoryDialog = (goal: SavingsGoal) => { setSelectedGoalForHistory(goal); setIsHistoryDialogOpen(true); };
  const calculateAverageDailySavings = useCallback((goal: SavingsGoal) => { const goalTransactions = savingsTransactions.filter(t => t.goalId === goal.id && t.type === 'Setoran'); if (goalTransactions.length === 0 || !goal.startDate || !isValid(parseISO(goal.startDate))) return 0; const totalSavedForGoal = goalTransactions.reduce((sum, t) => sum + t.amount, 0); const daysSinceStart = differenceInDays(new Date(), parseISO(goal.startDate)) + 1; return daysSinceStart > 0 ? totalSavedForGoal / daysSinceStart : 0; }, [savingsTransactions]);
  const calculateEstimatedDaysToGoal = useCallback((goal: SavingsGoal) => { if (goal.status === 'Tercapai' || goal.currentAmount >= goal.targetAmount) return "Tercapai!"; const averageDailySaving = calculateAverageDailySavings(goal); if (averageDailySaving <= 0) { const goalTransactions = savingsTransactions.filter(t => t.goalId === goal.id && t.type === 'Setoran'); return goalTransactions.length > 0 ? "N/A (progres tdk positif)" : "Belum ada setoran."; } const remainingAmount = goal.targetAmount - goal.currentAmount; if (remainingAmount <= 0) return "Tercapai!"; const estimatedDays = Math.ceil(remainingAmount / averageDailySaving); if (!isFinite(estimatedDays) || estimatedDays <= 0) return "Data tdk cukup."; const futureDate = addDays(new Date(), estimatedDays); return `~${estimatedDays} hari (Estimasi: ${format(futureDate, "dd MMM yyyy", { locale: localeID })})`; }, [calculateAverageDailySavings, savingsTransactions]);
  const getGoalStatusBadge = (status: SavingsGoalStatus) => { if (status === 'Tercapai') return <Badge className="bg-green-500 hover:bg-green-600 text-white">Tercapai</Badge>; if (status === 'Dibatalkan') return <Badge variant="destructive">Dibatalkan</Badge>; return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Aktif</Badge>; };
  const sortedGoals = useMemo(() => [...savingsGoals].sort((a, b) => { if (a.status === 'Aktif' && b.status !== 'Aktif') return -1; if (a.status !== 'Aktif' && b.status === 'Aktif') return 1; return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); }), [savingsGoals]);

  if (isLoading && savingsGoals.length === 0) { return <div className="flex justify-center items-center h-64"><Hourglass className="h-12 w-12 text-primary animate-spin" /></div>; }
  return (
    <div className="space-y-6">
      <PageHeader title="Buku Tabungan & Target" description="Kelola target tabungan Anda dan catat setiap transaksi." actions={ <Button onClick={() => handleOpenGoalForm()} className="bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" />Tambah Target</Button>}/>
      {isLoading && savingsGoals.length > 0 && <div className="text-center text-muted-foreground p-4">Memperbarui data...</div>}
      {!isLoading && savingsGoals.length === 0 ? (<Card className="w-full max-w-md mx-auto text-center shadow-lg border-dashed py-10"><CardHeader className="items-center"><PiggyBank className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">Belum Ada Target</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Klik "Tambah Target Baru".</p></CardContent></Card>) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedGoals.map(goal => (<Card key={goal.id} className="shadow-lg hover:shadow-xl flex flex-col"><CardHeader><div className="flex justify-between items-start"><CardTitle className="text-xl text-primary">{goal.name}</CardTitle>{getGoalStatusBadge(goal.status)}</div><CardDescription>Target: Rp {goal.targetAmount.toLocaleString()}</CardDescription></CardHeader><CardContent className="flex-grow space-y-3"><div><div className="flex justify-between items-center mb-1"><span className="text-sm text-muted-foreground">Terkumpul:</span><span className="text-sm font-semibold text-foreground">Rp {goal.currentAmount.toLocaleString()}</span></div><Progress value={(goal.currentAmount / goal.targetAmount) * 100} className="h-3" /><p className="text-xs text-muted-foreground mt-1 text-right">{(((goal.currentAmount / goal.targetAmount) * 100).toFixed(1))}%</p></div><div className="p-2 bg-muted/50 rounded-md"><p className="text-xs text-muted-foreground">Estimasi Capai:</p><p className="text-sm font-medium text-accent-foreground">{goal.status === 'Tercapai' ? 'Tercapai!' : calculateEstimatedDaysToGoal(goal)}</p></div><p className="text-xs text-muted-foreground">Mulai: {format(parseISO(goal.startDate), "dd MMM yyyy", { locale: localeID })}</p>{goal.targetDate && <p className="text-xs text-muted-foreground">Target Selesai: {format(parseISO(goal.targetDate), "dd MMM yyyy", { locale: localeID })}</p>}</CardContent><CardFooter className="grid grid-cols-2 gap-2 border-t pt-4"><Button variant="outline" onClick={() => handleOpenTransactionForm(goal)} disabled={goal.status === 'Tercapai' || goal.status === 'Dibatalkan'} className="col-span-2"><DollarSign className="mr-2 h-4 w-4" /> Transaksi</Button><Button variant="ghost" size="sm" onClick={() => handleOpenHistoryDialog(goal)}><Eye className="mr-2 h-4 w-4" /> Riwayat</Button><Button variant="ghost" size="sm" onClick={() => handleOpenGoalForm(goal)}><Edit3 className="mr-2 h-4 w-4" /> Edit</Button><Button variant="destructive" size="sm" onClick={() => handleDeleteGoal(goal.id)} className="col-span-2 mt-1"><Trash2 className="mr-2 h-4 w-4" /> Hapus</Button></CardFooter></Card>))}
        </div>
      )}
      <Dialog open={isGoalFormOpen} onOpenChange={(open) => { setIsGoalFormOpen(open); if (!open) resetGoalForm(); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingGoal ? 'Edit Target' : 'Tambah Target Baru'}</DialogTitle></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalNameForm" className="text-right col-span-1">Nama<span className="text-destructive">*</span></Label><Input id="goalNameForm" value={goalName} onChange={e => setGoalName(e.target.value)} className="col-span-3"/></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalTargetAmountForm" className="text-right col-span-1">Target (Rp)<span className="text-destructive">*</span></Label><Input id="goalTargetAmountForm" type="number" value={goalTargetAmount} onChange={e => setGoalTargetAmount(e.target.value)} className="col-span-3"/></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalStartDateForm" className="text-right col-span-1">Tgl. Mulai<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!goalStartDate && "text-muted-foreground"}`}><CalendarDateIcon className="mr-2 h-4 w-4" />{goalStartDate ? format(goalStartDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={goalStartDate} onSelect={setGoalStartDate} initialFocus /></PopoverContent></Popover></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="goalTargetDateForm" className="text-right col-span-1">Tgl. Target</Label><Popover><PopoverTrigger asChild><Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!goalTargetDate && "text-muted-foreground"}`}><CalendarDateIcon className="mr-2 h-4 w-4" />{goalTargetDate ? format(goalTargetDate, "PPP", { locale: localeID }) : <span>Pilih (Opsional)</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={goalTargetDate} onSelect={setGoalTargetDate} /></PopoverContent></Popover></div>
        <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="goalNotesForm" className="text-right col-span-1 pt-2">Catatan</Label><Textarea id="goalNotesForm" value={goalNotes} onChange={e => setGoalNotes(e.target.value)} className="col-span-3" rows={2}/></div>
      </div><DialogFooter><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><Button onClick={handleSaveGoal} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button></DialogFooter></DialogContent></Dialog>
      {selectedGoalForTransaction && (<Dialog open={isTransactionFormOpen} onOpenChange={(open) => { setIsTransactionFormOpen(open); if (!open) setSelectedGoalForTransaction(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Transaksi: {selectedGoalForTransaction.name}</DialogTitle><DialogDescription>Target: Rp {selectedGoalForTransaction.targetAmount.toLocaleString()} | Terkumpul: Rp {selectedGoalForTransaction.currentAmount.toLocaleString()}</DialogDescription></DialogHeader><div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="transactionTypeForm" className="text-right col-span-1">Jenis<span className="text-destructive">*</span></Label><Select value={transactionType} onValueChange={(v) => setTransactionType(v as 'Setoran' | 'Penarikan')}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Setoran">Setoran</SelectItem><SelectItem value="Penarikan">Penarikan</SelectItem></SelectContent></Select></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="transactionAmountForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label><Input id="transactionAmountForm" type="number" value={transactionAmount} onChange={e => setTransactionAmount(e.target.value)} className="col-span-3"/></div>
        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="transactionDateForm" className="text-right col-span-1">Tgl.<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant="outline" className={`col-span-3 justify-start text-left font-normal ${!transactionDate && "text-muted-foreground"}`}><CalendarDateIcon className="mr-2 h-4 w-4" />{transactionDate ? format(transactionDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={transactionDate} onSelect={setTransactionDate} initialFocus /></PopoverContent></Popover></div>
        <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="transactionNotesForm" className="text-right col-span-1 pt-2">Catatan</Label><Textarea id="transactionNotesForm" value={transactionNotes} onChange={e => setTransactionNotes(e.target.value)} className="col-span-3" rows={2}/></div>
      </div><DialogFooter><DialogClose asChild><Button variant="outline">Batal</Button></DialogClose><Button onClick={handleSaveTransaction} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button></DialogFooter></DialogContent></Dialog>)}
      {selectedGoalForHistory && (<Dialog open={isHistoryDialogOpen} onOpenChange={(open) => { setIsHistoryDialogOpen(open); if (!open) setSelectedGoalForHistory(null); }}><DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col"><DialogHeader><DialogTitle>Riwayat: {selectedGoalForHistory.name}</DialogTitle></DialogHeader><div className="flex-grow overflow-y-auto pr-2">{savingsTransactions.filter(t => t.goalId === selectedGoalForHistory.id).length > 0 ? (<Table><TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Jenis</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader><TableBody>{savingsTransactions.filter(t => t.goalId === selectedGoalForHistory.id).sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()).map(trx => (<TableRow key={trx.id}><TableCell>{format(parseISO(trx.transactionDate), "dd MMM yyyy", { locale: localeID })}</TableCell><TableCell><Badge variant={trx.type === 'Penarikan' ? 'destructive' : 'default'}>{trx.type}</Badge></TableCell><TableCell className="text-right">Rp {trx.amount.toLocaleString()}</TableCell><TableCell className="text-xs">{trx.notes || '-'}</TableCell></TableRow>))}</TableBody></Table>) : (<p className="text-muted-foreground text-center py-4">Belum ada riwayat.</p>)}</div><DialogFooter className="mt-4 pt-4 border-t"><DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose></DialogFooter></DialogContent></Dialog>)}
    </div>
  );
}
