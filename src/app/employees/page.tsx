
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
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Employee, EmployeeStatus, PayrollFrequency, Loan, LoanInstallment, LoanStatus } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { UserPlus, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, Users, HandCoins, FileText, PlusCircle, Edit, CheckCircle, CircleDollarSign } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });

type EmployeeFilter = 'all' | 'aktif' | 'tidakAktif' | 'resign';

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [joinDate, setJoinDate] = useState<Date | undefined>(new Date());
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('Aktif');
  const [payrollFrequency, setPayrollFrequency] = useState<PayrollFrequency>('Bulanan');
  const [baseSalary, setBaseSalary] = useState<string | number>('');
  const [loanNotes, setLoanNotes] = useState(''); 
  const [performanceNotes, setPerformanceNotes] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<EmployeeFilter>('aktif');

  const [isLoanMgmtDialogOpen, setIsLoanMgmtDialogOpen] = useState(false);
  const [selectedEmployeeForLoan, setSelectedEmployeeForLoan] = useState<Employee | null>(null);
  
  const [isLoanFormDialogOpen, setIsLoanFormDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanDateState, setLoanDateState] = useState<Date | undefined>(new Date()); 
  const [loanAmount, setLoanAmount] = useState<string | number>('');
  const [loanReason, setLoanReason] = useState('');
  const [loanRepaymentNotes, setLoanRepaymentNotes] = useState('');

  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
  const [selectedLoanForInstallment, setSelectedLoanForInstallment] = useState<Loan | null>(null);
  const [installmentDate, setInstallmentDate] = useState<Date | undefined>(new Date());
  const [installmentAmount, setInstallmentAmount] = useState<string | number>('');
  const [installmentNotes, setInstallmentNotes] = useState('');

  const employeeFormDialogTitleId = useId();
  const loanMgmtDialogTitleId = useId();
  const loanFormDialogTitleId = useId();
  const installmentDialogTitleId = useId();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: empData, error: empError } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
      if (empError) throw empError;
      setEmployees(empData.map(e => ({...e, id: String(e.id)})) as Employee[]);

      const { data: loanData, error: loanError } = await supabase.from('employee_loans').select('*').order('created_at', { ascending: false });
      if (loanError) throw loanError;
      setLoans(loanData.map(l => ({...l, id: String(l.id), employee_id: String(l.employee_id)})) as Loan[]);

      const { data: instData, error: instError } = await supabase.from('loan_installments').select('*').order('created_at', { ascending: false });
      if (instError) throw instError;
      setInstallments(instData.map(i => ({...i, id: String(i.id), loan_id: String(i.loan_id)})) as LoanInstallment[]);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal Memuat Data Karyawan", description: error.message });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetEmployeeFormFields = useCallback(() => { setEditingEmployee(null); setEmployeeName(''); setPosition(''); setJoinDate(new Date()); setPhone(''); setAddress(''); setEmployeeStatus('Aktif'); setPayrollFrequency('Bulanan'); setBaseSalary(''); setLoanNotes(''); setPerformanceNotes(''); }, []);
  const handleOpenEmployeeFormDialog = useCallback((employee?: Employee) => { if (employee) { setEditingEmployee(employee); setEmployeeName(employee.name); setPosition(employee.position); setJoinDate(employee.join_date && isValid(parseISO(employee.join_date)) ? parseISO(employee.join_date) : new Date()); setPhone(employee.phone || ''); setAddress(employee.address || ''); setEmployeeStatus(employee.status); setPayrollFrequency(employee.payroll_frequency); setBaseSalary(employee.base_salary); setLoanNotes(employee.loan_notes || ''); setPerformanceNotes(employee.performance_notes || ''); } else { resetEmployeeFormFields(); } setIsFormDialogOpen(true); }, [resetEmployeeFormFields]);

  const handleSaveEmployee = async () => {
    if (!employeeName.trim() || !position.trim() || !joinDate || !baseSalary) { toast({ variant: "destructive", title: "Data Tidak Lengkap" }); return; }
    const parsedBaseSalary = parseFloat(String(baseSalary));
    if (isNaN(parsedBaseSalary) || parsedBaseSalary < 0) { toast({ variant: "destructive", title: "Gaji Pokok Tidak Valid" }); return; }

    const now = new Date().toISOString();
    const employeeDataToSave = {
      name: employeeName.trim(), position: position.trim(), join_date: format(joinDate, 'yyyy-MM-dd'),
      phone: phone.trim() || undefined, address: address.trim() || undefined, status: employeeStatus,
      payroll_frequency: payrollFrequency, base_salary: parsedBaseSalary, loan_notes: loanNotes.trim() || undefined,
      performance_notes: performanceNotes.trim() || undefined, updated_at: now,
    };

    if (editingEmployee && editingEmployee.id) {
      const { error } = await supabase.from('employees').update(employeeDataToSave).match({ id: editingEmployee.id });
      if (error) toast({ variant: "destructive", title: "Gagal Update Karyawan", description: error.message });
      else { toast({ title: "Data Karyawan Diperbarui" }); fetchData(); }
    } else {
      const { error } = await supabase.from('employees').insert([{ ...employeeDataToSave, created_at: now }]);
      if (error) toast({ variant: "destructive", title: "Gagal Tambah Karyawan", description: error.message });
      else { toast({ title: "Karyawan Ditambahkan" }); fetchData(); }
    }
    setIsFormDialogOpen(false);
  };

  const handleDeleteEmployee = useCallback(async (employeeId: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus karyawan "${name}"? Ini juga akan menghapus data pinjaman terkait.`)) {
      const employeeLoansToDelete = loans.filter(l => l.employee_id === employeeId).map(l => l.id);
      if (employeeLoansToDelete.length > 0) {
        await supabase.from('loan_installments').delete().in('loan_id', employeeLoansToDelete);
        await supabase.from('employee_loans').delete().match({ employee_id: employeeId });
      }
      const { error: empError } = await supabase.from('employees').delete().match({ id: employeeId });

      if (empError) toast({ variant: "destructive", title: "Gagal Hapus Karyawan", description: empError?.message });
      else { toast({ title: "Karyawan Dihapus" }); fetchData(); }
    }
  }, [toast, fetchData, loans]);
  
  const handleToggleEmployeeStatus = useCallback(async (employeeId: string, currentStatus: EmployeeStatus) => {
    const newStatus: EmployeeStatus = currentStatus === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    const { error } = await supabase.from('employees').update({ status: newStatus, updated_at: new Date().toISOString() }).match({ id: employeeId });
    if (error) toast({ variant: "destructive", title: "Gagal Update Status", description: error.message });
    else { toast({ title: "Status Karyawan Diubah" }); fetchData(); }
  }, [toast, fetchData]);

  const openLoanManagementDialog = (employee: Employee) => { setSelectedEmployeeForLoan(employee); setIsLoanMgmtDialogOpen(true); };
  const resetLoanFormFields = useCallback(() => { setEditingLoan(null); setLoanDateState(new Date()); setLoanAmount(''); setLoanReason(''); setLoanRepaymentNotes(''); }, []);
  const openLoanFormDialog = (loan?: Loan) => { if (loan) { setEditingLoan(loan); setLoanDateState(loan.loan_date && isValid(parseISO(loan.loan_date)) ? parseISO(loan.loan_date) : new Date()); setLoanAmount(loan.loan_amount); setLoanReason(loan.reason || ''); setLoanRepaymentNotes(loan.repayment_notes || ''); } else { resetLoanFormFields(); } setIsLoanFormDialogOpen(true); };

  const handleSaveLoan = async () => {
    if (!selectedEmployeeForLoan || !loanDateState || !loanAmount) { toast({ variant: "destructive", title: "Data Pinjaman Tdk Lengkap" }); return; }
    const parsedLoanAmount = parseFloat(String(loanAmount));
    if (isNaN(parsedLoanAmount) || parsedLoanAmount <= 0) { toast({ variant: "destructive", title: "Jumlah Pinjaman Tdk Valid" }); return; }
    const now = new Date().toISOString();

    if (editingLoan && editingLoan.id) {
        const updatedLoanData = {
            loan_date: format(loanDateState, 'yyyy-MM-dd'), loan_amount: parsedLoanAmount,
            reason: loanReason.trim() || undefined, repayment_notes: loanRepaymentNotes.trim() || undefined,
            remaining_balance: parsedLoanAmount - (editingLoan.loan_amount - editingLoan.remaining_balance), 
            updated_at: now,
            status: 'Aktif' as LoanStatus, 
        };
        if (updatedLoanData.remaining_balance < 0) updatedLoanData.remaining_balance = 0;
        updatedLoanData.status = updatedLoanData.remaining_balance === 0 ? 'Lunas' : 'Aktif';
        
        const { error } = await supabase.from('employee_loans').update(updatedLoanData).match({ id: editingLoan.id });
        if (error) toast({ variant: "destructive", title: "Gagal Update Pinjaman", description: error.message });
        else { toast({ title: "Pinjaman Diperbarui" }); fetchData(); }
    } else {
        const newLoanData = {
            employee_id: selectedEmployeeForLoan.id, loan_date: format(loanDateState, 'yyyy-MM-dd'),
            loan_amount: parsedLoanAmount, reason: loanReason.trim() || undefined,
            repayment_notes: loanRepaymentNotes.trim() || undefined, status: 'Aktif' as LoanStatus,
            remaining_balance: parsedLoanAmount, created_at: now, updated_at: now,
        };
        const { error } = await supabase.from('employee_loans').insert([newLoanData]);
        if (error) toast({ variant: "destructive", title: "Gagal Tambah Pinjaman", description: error.message });
        else { toast({ title: "Pinjaman Ditambahkan" }); fetchData(); }
    }
    setIsLoanFormDialogOpen(false);
  };
  
  const handleDeleteLoan = async (loanId: string) => {
    if (window.confirm("Yakin hapus pinjaman ini? Semua cicilan terkait juga akan dihapus.")) {
        await supabase.from('loan_installments').delete().match({ loan_id: loanId });
        const { error } = await supabase.from('employee_loans').delete().match({ id: loanId });
        if (error) toast({ variant: "destructive", title: "Gagal Hapus Pinjaman", description: error.message });
        else { toast({ title: "Pinjaman Dihapus" }); fetchData(); }
    }
  };

  const resetInstallmentFormFields = useCallback(() => { setInstallmentDate(new Date()); setInstallmentAmount(''); setInstallmentNotes(''); }, []);
  const openInstallmentDialog = (loan: Loan) => { setSelectedLoanForInstallment(loan); resetInstallmentFormFields(); setIsInstallmentDialogOpen(true); };

  const handleSaveInstallment = async () => {
    if (!selectedLoanForInstallment || !installmentDate || !installmentAmount) { toast({ variant: "destructive", title: "Data Cicilan Tdk Lengkap"}); return; }
    const parsedInstallmentAmount = parseFloat(String(installmentAmount));
    if (isNaN(parsedInstallmentAmount) || parsedInstallmentAmount <= 0) { toast({ variant: "destructive", title: "Jumlah Cicilan Tdk Valid"}); return; }
    if (parsedInstallmentAmount > selectedLoanForInstallment.remaining_balance) { toast({ variant: "destructive", title: "Cicilan Melebihi Sisa"}); return; }

    const now = new Date().toISOString();
    const newInstallmentData = {
        loan_id: selectedLoanForInstallment.id, payment_date: format(installmentDate, 'yyyy-MM-dd'),
        amount_paid: parsedInstallmentAmount, notes: installmentNotes.trim() || undefined, created_at: now,
    };
    const { error: instError } = await supabase.from('loan_installments').insert([newInstallmentData]);
    if (instError) { toast({ variant: "destructive", title: "Gagal Simpan Cicilan", description: instError.message }); return; }

    const newRemaining = selectedLoanForInstallment.remaining_balance - parsedInstallmentAmount;
    let newStatus: LoanStatus = 'Aktif';
    if (newRemaining <= 0) newStatus = 'Lunas';
    else if (newRemaining < selectedLoanForInstallment.loan_amount) newStatus = 'Sebagian Lunas';
    
    const { error: loanUpdateError } = await supabase.from('employee_loans')
      .update({ remaining_balance: Math.max(0, newRemaining), status: newStatus, updated_at: now })
      .match({ id: selectedLoanForInstallment.id });

    if (loanUpdateError) toast({ variant: "destructive", title: "Gagal Update Sisa Pinjaman", description: loanUpdateError.message });
    else { toast({ title: "Cicilan Ditambahkan"}); fetchData(); }
    
    setIsInstallmentDialogOpen(false);
  };

  const getLoanStatusBadgeColor = (status: LoanStatus) => { switch (status) { case 'Aktif': return 'bg-blue-500'; case 'Sebagian Lunas': return 'bg-yellow-500'; case 'Lunas': return 'bg-green-500'; case 'Dihapuskan': return 'bg-red-500'; default: return 'bg-gray-500'; } };
  const filteredEmployees = useMemo(() => { let tempEmployees = [...employees]; if (searchTerm) { tempEmployees = tempEmployees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase())); } switch (activeFilter) { case 'aktif': return tempEmployees.filter(emp => emp.status === 'Aktif'); case 'tidakAktif': return tempEmployees.filter(emp => emp.status === 'Tidak Aktif'); case 'resign': return tempEmployees.filter(emp => emp.status === 'Resign'); default: return tempEmployees; } }, [employees, searchTerm, activeFilter]);
  const getStatusBadgeColor = (status: EmployeeStatus) => { switch (status) { case 'Aktif': return 'bg-green-500'; case 'Tidak Aktif': return 'bg-yellow-500'; case 'Resign': return 'bg-red-500'; default: return 'bg-gray-500'; } };

  if (isLoading && employees.length === 0) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data karyawan...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Karyawan" description="Kelola data karyawan, penggajian, pinjaman, dan performa." actions={ <Button onClick={() => handleOpenEmployeeFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground"><UserPlus className="mr-2 h-4 w-4" />Tambah Karyawan</Button> }/>
      <Card className="shadow-md">
        <CardHeader><CardTitle>Daftar Karyawan</CardTitle><div className="flex flex-col sm:flex-row gap-2 mt-2"><div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="text" placeholder="Cari Nama Karyawan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full"/></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full sm:w-auto"><Filter className="mr-2 h-4 w-4" /> Filter: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}</Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-[200px]"><DropdownMenuLabel>Filter Status</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setActiveFilter('aktif')}>Aktif</DropdownMenuItem><DropdownMenuItem onClick={() => setActiveFilter('tidakAktif')}>Tidak Aktif</DropdownMenuItem><DropdownMenuItem onClick={() => setActiveFilter('resign')}>Resign</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => setActiveFilter('all')}>Semua</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (<div className="overflow-x-auto max-h-[65vh]"><Table><TableHeader className="sticky top-0 bg-card z-10"><TableRow><TableHead className="w-[100px]">Status</TableHead><TableHead className="min-w-[180px]">Nama</TableHead><TableHead className="min-w-[150px]">Posisi</TableHead><TableHead className="text-center min-w-[120px]">Frek. Gaji</TableHead><TableHead className="text-right min-w-[130px]">Gaji Pokok</TableHead><TableHead className="text-center w-[180px]">Aksi</TableHead></TableRow></TableHeader><TableBody>
            {filteredEmployees.map((emp) => (<TableRow key={emp.id} className={emp.status !== 'Aktif' ? 'bg-muted/40 text-muted-foreground' : ''}><TableCell><Badge className={`${getStatusBadgeColor(emp.status)} text-white hover:${getStatusBadgeColor(emp.status)}`}>{emp.status}</Badge></TableCell><TableCell className="font-medium">{emp.name}</TableCell><TableCell>{emp.position}</TableCell><TableCell className="text-center">{emp.payroll_frequency}</TableCell><TableCell className="text-right whitespace-nowrap">Rp {emp.base_salary.toLocaleString()}</TableCell><TableCell className="text-center"><div className="flex justify-center items-center gap-1 flex-wrap"><Switch checked={emp.status === 'Aktif'} onCheckedChange={() => handleToggleEmployeeStatus(emp.id, emp.status)} aria-label={emp.status === 'Aktif' ? "Nonaktifkan" : "Aktifkan"} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-yellow-500"/><Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => handleOpenEmployeeFormDialog(emp)} title="Edit"><Edit3 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => openLoanManagementDialog(emp)} title="Pinjaman"><HandCoins className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEmployee(emp.id, emp.name)} title="Hapus"><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}
          </TableBody></Table></div>) : (<Card className="w-full text-center shadow-none border-dashed py-10"><CardHeader className="items-center"><Users className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">{searchTerm || activeFilter !== 'aktif' ? "Karyawan Tdk Ditemukan" : "Belum Ada Karyawan Aktif"}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{searchTerm || activeFilter !== 'aktif' ? "Tidak ada karyawan cocok." : "Klik 'Tambah Karyawan'."}</p></CardContent></Card>)}
        </CardContent>
      </Card>
      
      {isFormDialogOpen && (
        <DynamicDialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) resetEmployeeFormFields(); }}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" >
            <DynamicDialogHeader className="flex-shrink-0">
              <DynamicDialogTitle id={employeeFormDialogTitleId}>{editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}</DynamicDialogTitle>
              <DynamicDialogDescription>{editingEmployee ? `Mengedit ${editingEmployee.name}.` : 'Detail karyawan baru.'}</DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
              <div className="grid grid-cols-4 items-center"><Label htmlFor="employeeName" className="text-right col-span-4 sm:col-span-1 pr-3">Nama<span className="text-destructive">*</span></Label><Input id="employeeName" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="col-span-4 sm:col-span-3" /></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="position" className="text-right col-span-4 sm:col-span-1 pr-3">Posisi<span className="text-destructive">*</span></Label><Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="col-span-4 sm:col-span-3" /></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="joinDate" className="text-right col-span-4 sm:col-span-1 pr-3">Tgl. Gabung<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-4 sm:col-span-3 justify-start text-left font-normal ${!joinDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{joinDate ? format(joinDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={joinDate} onSelect={setJoinDate} initialFocus /></PopoverContent></Popover></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="phone" className="text-right col-span-4 sm:col-span-1 pr-3">No. Telp</Label><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-4 sm:col-span-3"/></div>
              <div className="grid grid-cols-4 items-start"><Label htmlFor="address" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Alamat</Label><Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-4 sm:col-span-3" rows={2}/></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="employeeStatus" className="text-right col-span-4 sm:col-span-1 pr-3">Status<span className="text-destructive">*</span></Label><Select value={employeeStatus} onValueChange={(value) => setEmployeeStatus(value as EmployeeStatus)}><SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Aktif">Aktif</SelectItem><SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem><SelectItem value="Resign">Resign</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="payrollFrequency" className="text-right col-span-4 sm:col-span-1 pr-3">Frek. Gaji<span className="text-destructive">*</span></Label><Select value={payrollFrequency} onValueChange={(value) => setPayrollFrequency(value as PayrollFrequency)}><SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Harian">Harian</SelectItem><SelectItem value="Mingguan">Mingguan</SelectItem><SelectItem value="Bulanan">Bulanan</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-4 items-center"><Label htmlFor="baseSalary" className="text-right col-span-4 sm:col-span-1 pr-3">Gaji (Rp)<span className="text-destructive">*</span></Label><Input id="baseSalary" type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="col-span-4 sm:col-span-3" /></div>
              <div className="grid grid-cols-4 items-start"><Label htmlFor="loanNotes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Cat. Pinjaman</Label><Textarea id="loanNotes" value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} className="col-span-4 sm:col-span-3" rows={2}/></div>
              <div className="grid grid-cols-4 items-start"><Label htmlFor="performanceNotes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Cat. Performa</Label><Textarea id="performanceNotes" value={performanceNotes} onChange={(e) => setPerformanceNotes(e.target.value)} className="col-span-4 sm:col-span-3" rows={2}/></div>
            </div>
            <DynamicDialogFooter className="flex-shrink-0 pt-4 border-t">
              <DynamicDialogClose asChild><Button type="button" variant="outline">Batal</Button></DynamicDialogClose>
              <Button type="button" onClick={handleSaveEmployee} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}

      {isLoanMgmtDialogOpen && selectedEmployeeForLoan && (
        <DynamicDialog open={isLoanMgmtDialogOpen} onOpenChange={setIsLoanMgmtDialogOpen}>
          <DynamicDialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" >
            <DynamicDialogHeader><DynamicDialogTitle id={loanMgmtDialogTitleId}>Man. Pinjaman: {selectedEmployeeForLoan?.name}</DynamicDialogTitle><DynamicDialogDescription>Kelola pinjaman & cicilan.</DynamicDialogDescription></DynamicDialogHeader>
            <div className="flex-grow overflow-y-auto p-1">
              <Button onClick={() => openLoanFormDialog()} className="mb-4 bg-accent hover:bg-accent/90 text-accent-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Tambah Pinjaman</Button>
              {loans.filter(l => l.employee_id === selectedEmployeeForLoan?.id).length > 0 ? (
                <Table><TableHeader><TableRow><TableHead>Tgl Pinjam</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead className="text-right">Sisa</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-center">Aksi</TableHead></TableRow></TableHeader><TableBody>
                  {loans.filter(l => l.employee_id === selectedEmployeeForLoan?.id).sort((a,b) => new Date(b.loan_date).getTime() - new Date(a.loan_date).getTime()).map(loan => (<TableRow key={loan.id}><TableCell>{format(parseISO(loan.loan_date), "dd MMM yyyy", { locale: localeID })}</TableCell><TableCell className="text-right">Rp {loan.loan_amount.toLocaleString()}</TableCell><TableCell className="text-right">Rp {loan.remaining_balance.toLocaleString()}</TableCell><TableCell className="text-center"><Badge className={`${getLoanStatusBadgeColor(loan.status)} text-white`}>{loan.status}</Badge></TableCell><TableCell className="text-center space-x-1"><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openLoanFormDialog(loan)} title="Edit"><Edit className="h-4 w-4"/></Button><Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openInstallmentDialog(loan)} title="Cicilan"><CircleDollarSign className="h-4 w-4"/></Button><Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteLoan(loan.id)} title="Hapus"><Trash2 className="h-4 w-4"/></Button></TableCell></TableRow>))}
                </TableBody></Table>
              ) : (<p className="text-muted-foreground text-center py-4">Belum ada data pinjaman.</p>)}
            </div>
            <DynamicDialogFooter><DynamicDialogClose asChild><Button variant="outline">Tutup</Button></DynamicDialogClose></DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}

      {isLoanFormDialogOpen && selectedEmployeeForLoan && (
        <DynamicDialog open={isLoanFormDialogOpen} onOpenChange={setIsLoanFormDialogOpen}>
          <DynamicDialogContent className="sm:max-w-md" >
            <DynamicDialogHeader><DynamicDialogTitle id={loanFormDialogTitleId}>{editingLoan ? 'Edit' : 'Tambah'} Pinjaman u/ {selectedEmployeeForLoan?.name}</DynamicDialogTitle></DynamicDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="loanDateForm" className="text-right col-span-1">Tgl Pinjam<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!loanDateState && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{loanDateState ? format(loanDateState, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={loanDateState} onSelect={setLoanDateState} initialFocus /></PopoverContent></Popover></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="loanAmountForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label><Input id="loanAmountForm" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="col-span-3"/></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="loanReasonForm" className="text-right col-span-1 pt-2">Alasan</Label><Textarea id="loanReasonForm" value={loanReason} onChange={e => setLoanReason(e.target.value)} className="col-span-3" rows={2}/></div>
              <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="loanRepaymentNotesForm" className="text-right col-span-1 pt-2">Cat. Pembayaran</Label><Textarea id="loanRepaymentNotesForm" value={loanRepaymentNotes} onChange={e => setLoanRepaymentNotes(e.target.value)} className="col-span-3" rows={2}/></div>
            </div>
            <DynamicDialogFooter><DynamicDialogClose asChild><Button variant="outline">Batal</Button></DynamicDialogClose><Button onClick={handleSaveLoan} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan</Button></DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}

      {isInstallmentDialogOpen && selectedLoanForInstallment && selectedEmployeeForLoan && (
        <DynamicDialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" >
            <DynamicDialogHeader>
              <DynamicDialogTitle id={installmentDialogTitleId}>Cicilan Pinjaman - {selectedEmployeeForLoan?.name}</DynamicDialogTitle>
              <DynamicDialogDescription>Pinjaman: Rp {selectedLoanForInstallment.loan_amount.toLocaleString()} | Sisa: Rp {selectedLoanForInstallment.remaining_balance.toLocaleString()}<br/>Tgl Pinjam: {format(parseISO(selectedLoanForInstallment.loan_date), "dd MMM yyyy", { locale: localeID })}</DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto p-1">
              <div className="space-y-4 border-r-0 md:border-r md:pr-6">
                <h3 className="text-md font-semibold">Tambah Cicilan</h3>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="installmentDateForm" className="text-right col-span-1">Tgl Bayar<span className="text-destructive">*</span></Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!installmentDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{installmentDate ? format(installmentDate, "PPP", { locale: localeID }) : <span>Pilih</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={installmentDate} onSelect={setInstallmentDate} initialFocus /></PopoverContent></Popover></div>
                <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="installmentAmountForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label><Input id="installmentAmountForm" type="number" value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)} className="col-span-3"/></div>
                <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="installmentNotesForm" className="text-right col-span-1 pt-2">Catatan</Label><Textarea id="installmentNotesForm" value={installmentNotes} onChange={e => setInstallmentNotes(e.target.value)} className="col-span-3" rows={2}/></div>
                <Button onClick={handleSaveInstallment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4"/> Simpan Cicilan</Button>
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-semibold">Riwayat Cicilan</h3>
                {installments.filter(inst => inst.loan_id === selectedLoanForInstallment.id).length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    <Table><TableHeader><TableRow><TableHead>Tgl Bayar</TableHead><TableHead className="text-right">Jumlah</TableHead><TableHead>Catatan</TableHead></TableRow></TableHeader><TableBody>
                      {installments.filter(inst => inst.loan_id === selectedLoanForInstallment.id).sort((a,b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()).map(inst => (<TableRow key={inst.id}><TableCell>{format(parseISO(inst.payment_date), "dd MMM yy", { locale: localeID })}</TableCell><TableCell className="text-right">Rp {inst.amount_paid.toLocaleString()}</TableCell><TableCell className="text-xs">{inst.notes || '-'}</TableCell></TableRow>))}
                    </TableBody></Table>
                  </div>
                ) : (<p className="text-muted-foreground text-center text-sm py-4">Belum ada cicilan.</p>)}
              </div>
            </div>
            <DynamicDialogFooter className="mt-4"><DynamicDialogClose asChild><Button variant="outline">Tutup</Button></DynamicDialogClose></DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}

