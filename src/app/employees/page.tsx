
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
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Employee, EmployeeStatus, PayrollFrequency, Loan, LoanInstallment, LoanStatus } from "@/lib/types";
import { UserPlus, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, Users, HandCoins, FileText, PlusCircle, Edit, CheckCircle, CircleDollarSign } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Budi Santoso', position: 'Mekanik Senior', joinDate: '2022-01-15', phone: '081234567890', address: 'Jl. Merdeka No. 10', status: 'Aktif', payrollFrequency: 'Bulanan', baseSalary: 5000000, loanNotes: 'Pinjaman Koperasi Rp 500.000', performanceNotes: 'Sangat baik dalam diagnosis masalah kompleks.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'EMP-002', name: 'Siti Aminah', position: 'Admin Kasir', joinDate: '2023-03-01', phone: '087654321098', address: 'Jl. Pahlawan No. 5', status: 'Aktif', payrollFrequency: 'Bulanan', baseSalary: 3500000, performanceNotes: 'Teliti dan ramah pelanggan.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'EMP-003', name: 'Joko Susilo', position: 'Mekanik Junior', joinDate: '2023-08-20', status: 'Tidak Aktif', payrollFrequency: 'Harian', baseSalary: 150000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_LOANS: Loan[] = [
    { id: 'LOAN-001', employeeId: 'EMP-001', loanDate: '2024-01-10', loanAmount: 1000000, reason: 'Biaya Darurat', status: 'Aktif', remainingBalance: 500000, repaymentNotes: 'Potong gaji 500rb/bln', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
];
const MOCK_INSTALLMENTS: LoanInstallment[] = [
    {id: 'INST-001', loanId: 'LOAN-001', paymentDate: '2024-02-01', amountPaid: 250000, notes: 'Cicilan 1', createdAt: new Date().toISOString()},
    {id: 'INST-002', loanId: 'LOAN-001', paymentDate: '2024-03-01', amountPaid: 250000, notes: 'Cicilan 2', createdAt: new Date().toISOString()},
];

type EmployeeFilter = 'all' | 'aktif' | 'tidakAktif' | 'resign';

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<LoanInstallment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Employee Form states
  const [employeeName, setEmployeeName] = useState('');
  const [position, setPosition] = useState('');
  const [joinDate, setJoinDate] = useState<Date | undefined>(new Date());
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<EmployeeStatus>('Aktif');
  const [payrollFrequency, setPayrollFrequency] = useState<PayrollFrequency>('Bulanan');
  const [baseSalary, setBaseSalary] = useState<string | number>('');
  const [loanNotes, setLoanNotes] = useState(''); // Legacy loan notes
  const [performanceNotes, setPerformanceNotes] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<EmployeeFilter>('aktif');

  // Loan Management Dialog States
  const [isLoanMgmtDialogOpen, setIsLoanMgmtDialogOpen] = useState(false);
  const [selectedEmployeeForLoan, setSelectedEmployeeForLoan] = useState<Employee | null>(null);
  
  // Add/Edit Loan Form Dialog States
  const [isLoanFormDialogOpen, setIsLoanFormDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanDate, setLoanDate] = useState<Date | undefined>(new Date());
  const [loanAmount, setLoanAmount] = useState<string | number>('');
  const [loanReason, setLoanReason] = useState('');
  const [loanRepaymentNotes, setLoanRepaymentNotes] = useState('');

  // Installment Dialog States
  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
  const [selectedLoanForInstallment, setSelectedLoanForInstallment] = useState<Loan | null>(null);
  const [installmentDate, setInstallmentDate] = useState<Date | undefined>(new Date());
  const [installmentAmount, setInstallmentAmount] = useState<string | number>('');
  const [installmentNotes, setInstallmentNotes] = useState('');

  // Load data from localStorage
  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem('employeesDataBengkelKu');
      setEmployees(storedEmployees ? JSON.parse(storedEmployees) : MOCK_EMPLOYEES);

      const storedLoans = localStorage.getItem('employeeLoansDataBengkelKu');
      setLoans(storedLoans ? JSON.parse(storedLoans) : MOCK_LOANS);

      const storedInstallments = localStorage.getItem('loanInstallmentsDataBengkelKu');
      setInstallments(storedInstallments ? JSON.parse(storedInstallments) : MOCK_INSTALLMENTS);

    } catch (error) {
      console.error("Failed to parse data from localStorage:", error);
      setEmployees(MOCK_EMPLOYEES);
      setLoans(MOCK_LOANS);
      setInstallments(MOCK_INSTALLMENTS);
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Memuat data contoh." });
    }
    setIsLoading(false);
  }, [toast]);

  // Save data to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('employeesDataBengkelKu', JSON.stringify(employees));
    }
  }, [employees, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('employeeLoansDataBengkelKu', JSON.stringify(loans));
    }
  }, [loans, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('loanInstallmentsDataBengkelKu', JSON.stringify(installments));
    }
  }, [installments, isLoading]);


  const resetEmployeeFormFields = useCallback(() => {
    setEditingEmployee(null);
    setEmployeeName('');
    setPosition('');
    setJoinDate(new Date());
    setPhone('');
    setAddress('');
    setEmployeeStatus('Aktif');
    setPayrollFrequency('Bulanan');
    setBaseSalary('');
    setLoanNotes('');
    setPerformanceNotes('');
  }, []);

  const handleOpenEmployeeFormDialog = useCallback((employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeName(employee.name);
      setPosition(employee.position);
      setJoinDate(employee.joinDate && isValid(parseISO(employee.joinDate)) ? parseISO(employee.joinDate) : new Date());
      setPhone(employee.phone || '');
      setAddress(employee.address || '');
      setEmployeeStatus(employee.status);
      setPayrollFrequency(employee.payrollFrequency);
      setBaseSalary(employee.baseSalary);
      setLoanNotes(employee.loanNotes || '');
      setPerformanceNotes(employee.performanceNotes || '');
    } else {
      resetEmployeeFormFields();
    }
    setIsFormDialogOpen(true);
  }, [resetEmployeeFormFields]);

  const handleSaveEmployee = () => {
    if (!employeeName.trim() || !position.trim() || !joinDate || !baseSalary) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Nama, Posisi, Tgl Bergabung, Frek. Gaji, dan Gaji Pokok wajib diisi." });
      return;
    }
    const parsedBaseSalary = parseFloat(String(baseSalary));
    if (isNaN(parsedBaseSalary) || parsedBaseSalary < 0) {
      toast({ variant: "destructive", title: "Gaji Pokok Tidak Valid", description: "Gaji Pokok harus berupa angka positif." });
      return;
    }

    const now = new Date().toISOString();
    const employeeId = editingEmployee ? editingEmployee.id : `EMP-${Date.now()}`;
    
    const employeeData: Employee = {
      id: employeeId,
      name: employeeName.trim(),
      position: position.trim(),
      joinDate: format(joinDate, 'yyyy-MM-dd'),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      status: employeeStatus,
      payrollFrequency: payrollFrequency,
      baseSalary: parsedBaseSalary,
      loanNotes: loanNotes.trim() || undefined,
      performanceNotes: performanceNotes.trim() || undefined,
      createdAt: editingEmployee ? editingEmployee.createdAt : now,
      updatedAt: now,
    };

    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? employeeData : emp));
      toast({ title: "Data Karyawan Diperbarui", description: `${employeeData.name} telah diperbarui.` });
    } else {
      setEmployees(prev => [employeeData, ...prev]);
      toast({ title: "Karyawan Ditambahkan", description: `${employeeData.name} telah ditambahkan.` });
    }
    setIsFormDialogOpen(false);
  };

  const handleDeleteEmployee = useCallback((employeeId: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus karyawan "${name}"? Ini juga akan menghapus data pinjaman terkait.`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      setLoans(prev => prev.filter(loan => loan.employeeId !== employeeId));
      // Consider cascading delete for installments if needed, or handle orphans
      toast({ title: "Karyawan Dihapus", description: `${name} dan data pinjamannya telah dihapus.` });
    }
  }, [toast]);
  
  const handleToggleEmployeeStatus = useCallback((employeeId: string, currentStatus: EmployeeStatus) => {
    const newStatus: EmployeeStatus = currentStatus === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: newStatus, updatedAt: new Date().toISOString() } : emp));
    toast({ title: "Status Karyawan Diubah", description: `Status telah diubah menjadi ${newStatus}.` });
  }, [toast]);

  // Loan Management Functions
  const openLoanManagementDialog = (employee: Employee) => {
    setSelectedEmployeeForLoan(employee);
    setIsLoanMgmtDialogOpen(true);
  };

  const resetLoanFormFields = useCallback(() => {
    setEditingLoan(null);
    setLoanDate(new Date());
    setLoanAmount('');
    setLoanReason('');
    setLoanRepaymentNotes('');
  }, []);

  const openLoanFormDialog = (loan?: Loan) => {
    if (loan) {
        setEditingLoan(loan);
        setLoanDate(loan.loanDate && isValid(parseISO(loan.loanDate)) ? parseISO(loan.loanDate) : new Date());
        setLoanAmount(loan.loanAmount);
        setLoanReason(loan.reason || '');
        setLoanRepaymentNotes(loan.repaymentNotes || '');
    } else {
        resetLoanFormFields();
    }
    setIsLoanFormDialogOpen(true);
  };

  const handleSaveLoan = () => {
    if (!selectedEmployeeForLoan || !loanDate || !loanAmount) {
      toast({ variant: "destructive", title: "Data Pinjaman Tidak Lengkap", description: "Tanggal dan Jumlah Pinjaman wajib diisi." });
      return;
    }
    const parsedLoanAmount = parseFloat(String(loanAmount));
    if (isNaN(parsedLoanAmount) || parsedLoanAmount <= 0) {
      toast({ variant: "destructive", title: "Jumlah Pinjaman Tidak Valid", description: "Jumlah Pinjaman harus berupa angka positif." });
      return;
    }
    const now = new Date().toISOString();

    if (editingLoan) {
        // Update existing loan
        const updatedLoan: Loan = {
            ...editingLoan,
            loanDate: format(loanDate, 'yyyy-MM-dd'),
            loanAmount: parsedLoanAmount,
            reason: loanReason.trim() || undefined,
            repaymentNotes: loanRepaymentNotes.trim() || undefined,
            // Recalculate remaining balance if loanAmount changes
            remainingBalance: parsedLoanAmount - (editingLoan.loanAmount - editingLoan.remainingBalance), 
            updatedAt: now,
        };
        // Ensure remainingBalance is not negative
        if (updatedLoan.remainingBalance < 0) updatedLoan.remainingBalance = 0;
        updatedLoan.status = updatedLoan.remainingBalance === 0 ? 'Lunas' : 'Aktif';


        setLoans(prevLoans => prevLoans.map(l => l.id === editingLoan.id ? updatedLoan : l));
        toast({ title: "Pinjaman Diperbarui" });
    } else {
        // Add new loan
        const newLoan: Loan = {
            id: `LOAN-${Date.now()}`,
            employeeId: selectedEmployeeForLoan.id,
            loanDate: format(loanDate, 'yyyy-MM-dd'),
            loanAmount: parsedLoanAmount,
            reason: loanReason.trim() || undefined,
            repaymentNotes: loanRepaymentNotes.trim() || undefined,
            status: 'Aktif',
            remainingBalance: parsedLoanAmount,
            createdAt: now,
            updatedAt: now,
        };
        setLoans(prevLoans => [newLoan, ...prevLoans]);
        toast({ title: "Pinjaman Ditambahkan" });
    }
    setIsLoanFormDialogOpen(false);
  };
  
  const handleDeleteLoan = (loanId: string) => {
    if (window.confirm("Yakin ingin menghapus pinjaman ini? Semua data cicilan terkait juga akan dihapus.")) {
        setLoans(prev => prev.filter(l => l.id !== loanId));
        setInstallments(prev => prev.filter(inst => inst.loanId !== loanId));
        toast({ title: "Pinjaman Dihapus" });
    }
  };

  // Installment Functions
  const resetInstallmentFormFields = useCallback(() => {
    setInstallmentDate(new Date());
    setInstallmentAmount('');
    setInstallmentNotes('');
  }, []);

  const openInstallmentDialog = (loan: Loan) => {
    setSelectedLoanForInstallment(loan);
    resetInstallmentFormFields();
    setIsInstallmentDialogOpen(true);
  };

  const handleSaveInstallment = () => {
    if (!selectedLoanForInstallment || !installmentDate || !installmentAmount) {
        toast({ variant: "destructive", title: "Data Cicilan Tidak Lengkap", description: "Tanggal dan Jumlah Cicilan wajib diisi."});
        return;
    }
    const parsedInstallmentAmount = parseFloat(String(installmentAmount));
    if (isNaN(parsedInstallmentAmount) || parsedInstallmentAmount <= 0) {
        toast({ variant: "destructive", title: "Jumlah Cicilan Tidak Valid", description: "Jumlah Cicilan harus positif."});
        return;
    }
    if (parsedInstallmentAmount > selectedLoanForInstallment.remainingBalance) {
        toast({ variant: "destructive", title: "Jumlah Cicilan Melebihi Sisa", description: `Maksimal cicilan Rp ${selectedLoanForInstallment.remainingBalance.toLocaleString()}.`});
        return;
    }

    const now = new Date().toISOString();
    const newInstallment: LoanInstallment = {
        id: `INST-${Date.now()}`,
        loanId: selectedLoanForInstallment.id,
        paymentDate: format(installmentDate, 'yyyy-MM-dd'),
        amountPaid: parsedInstallmentAmount,
        notes: installmentNotes.trim() || undefined,
        createdAt: now,
    };
    setInstallments(prev => [newInstallment, ...prev]);

    // Update loan's remaining balance and status
    setLoans(prevLoans => prevLoans.map(l => {
        if (l.id === selectedLoanForInstallment.id) {
            const newRemaining = l.remainingBalance - parsedInstallmentAmount;
            let newStatus: LoanStatus = 'Aktif';
            if (newRemaining <= 0) {
                newStatus = 'Lunas';
            } else if (newRemaining < l.loanAmount) {
                newStatus = 'Sebagian Lunas';
            }
            return { ...l, remainingBalance: Math.max(0, newRemaining), status: newStatus, updatedAt: now };
        }
        return l;
    }));
    toast({ title: "Cicilan Ditambahkan"});
    setIsInstallmentDialogOpen(false); // Close current dialog
    // Potentially re-open loan management dialog or update its view if it was open
    if (selectedEmployeeForLoan) {
        // Refresh selected loan for installment dialog if it's for the same loan.
        const updatedLoan = loans.find(l => l.id === selectedLoanForInstallment.id);
        if (updatedLoan) {
            const newRemaining = updatedLoan.remainingBalance - parsedInstallmentAmount;
            let newStatus: LoanStatus = 'Aktif';
            if (newRemaining <= 0) newStatus = 'Lunas';
            else if (newRemaining < updatedLoan.loanAmount) newStatus = 'Sebagian Lunas';
            setSelectedLoanForInstallment({...updatedLoan, remainingBalance: Math.max(0, newRemaining), status: newStatus });
        }
    }
  };

  const getLoanStatusBadgeColor = (status: LoanStatus) => {
    switch (status) {
      case 'Aktif': return 'bg-blue-500';
      case 'Sebagian Lunas': return 'bg-yellow-500';
      case 'Lunas': return 'bg-green-500';
      case 'Dihapuskan': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredEmployees = useMemo(() => {
    let tempEmployees = [...employees];
    if (searchTerm) {
      tempEmployees = tempEmployees.filter(emp => emp.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    switch (activeFilter) {
      case 'aktif': return tempEmployees.filter(emp => emp.status === 'Aktif');
      case 'tidakAktif': return tempEmployees.filter(emp => emp.status === 'Tidak Aktif');
      case 'resign': return tempEmployees.filter(emp => emp.status === 'Resign');
      default: return tempEmployees;
    }
  }, [employees, searchTerm, activeFilter]);
  
  const getStatusBadgeColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'Aktif': return 'bg-green-500';
      case 'Tidak Aktif': return 'bg-yellow-500';
      case 'Resign': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data karyawan...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manajemen Karyawan"
        description="Kelola data karyawan, penggajian, pinjaman, dan performa."
        actions={
          <Button onClick={() => handleOpenEmployeeFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Karyawan
          </Button>
        }
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Daftar Karyawan</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari berdasarkan Nama Karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="mr-2 h-4 w-4" /> Filter: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filter Berdasarkan Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveFilter('aktif')}>Aktif</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter('tidakAktif')}>Tidak Aktif</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveFilter('resign')}>Resign</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveFilter('all')}>Tampilkan Semua</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <div className="overflow-x-auto max-h-[65vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[180px]">Nama Karyawan</TableHead>
                    <TableHead className="min-w-[150px]">Posisi</TableHead>
                    <TableHead className="text-center min-w-[120px]">Frek. Gaji</TableHead>
                    <TableHead className="text-right min-w-[130px]">Gaji Pokok</TableHead>
                    <TableHead className="text-center w-[180px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} className={emp.status !== 'Aktif' ? 'bg-muted/40 text-muted-foreground' : ''}>
                      <TableCell>
                        <Badge className={`${getStatusBadgeColor(emp.status)} text-white hover:${getStatusBadgeColor(emp.status)}`}>{emp.status}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell className="text-center">{emp.payrollFrequency}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">Rp {emp.baseSalary.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1 flex-wrap">
                           <Switch
                            checked={emp.status === 'Aktif'}
                            onCheckedChange={() => handleToggleEmployeeStatus(emp.id, emp.status)}
                            aria-label={emp.status === 'Aktif' ? "Nonaktifkan" : "Aktifkan"}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-yellow-500"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => handleOpenEmployeeFormDialog(emp)} title="Edit Karyawan">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                           <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => openLoanManagementDialog(emp)} title="Kelola Pinjaman">
                            <HandCoins className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEmployee(emp.id, emp.name)} title="Hapus Karyawan">
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
                  <Users className="w-16 h-16 text-muted-foreground mb-4" />
                  <CardTitle className="text-xl text-foreground">
                    {searchTerm || activeFilter !== 'aktif' ? "Karyawan Tidak Ditemukan" : "Belum Ada Karyawan Aktif"}
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">
                    {searchTerm || activeFilter !== 'aktif' ? 
                      "Tidak ada karyawan yang cocok dengan kriteria pencarian atau filter Anda." :
                      "Saat ini tidak ada karyawan yang terdaftar atau aktif. Klik 'Tambah Karyawan' untuk memulai."
                    }
                  </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Employee Add/Edit Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) resetEmployeeFormFields(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? `Mengedit detail untuk ${editingEmployee.name}.` : 'Masukkan detail karyawan baru.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-y-3 gap-x-4 py-2 flex-grow overflow-y-auto pr-3 text-sm">
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="employeeName" className="text-right col-span-4 sm:col-span-1 pr-3">Nama<span className="text-destructive">*</span></Label>
              <Input id="employeeName" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Nama lengkap karyawan" />
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="position" className="text-right col-span-4 sm:col-span-1 pr-3">Posisi<span className="text-destructive">*</span></Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: Mekanik, Admin" />
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="joinDate" className="text-right col-span-4 sm:col-span-1 pr-3">Tgl. Bergabung<span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`col-span-4 sm:col-span-3 justify-start text-left font-normal ${!joinDate && "text-muted-foreground"}`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {joinDate ? format(joinDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={joinDate} onSelect={setJoinDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="phone" className="text-right col-span-4 sm:col-span-1 pr-3">No. Telepon</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Opsional" />
            </div>
            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="address" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Alamat</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Alamat lengkap (opsional)" rows={2}/>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="employeeStatus" className="text-right col-span-4 sm:col-span-1 pr-3">Status<span className="text-destructive">*</span></Label>
              <Select value={employeeStatus} onValueChange={(value) => setEmployeeStatus(value as EmployeeStatus)}>
                <SelectTrigger className="col-span-4 sm:col-span-3">
                  <SelectValue placeholder="Pilih status karyawan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                  <SelectItem value="Resign">Resign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="payrollFrequency" className="text-right col-span-4 sm:col-span-1 pr-3">Frekuensi Gaji<span className="text-destructive">*</span></Label>
              <Select value={payrollFrequency} onValueChange={(value) => setPayrollFrequency(value as PayrollFrequency)}>
                <SelectTrigger className="col-span-4 sm:col-span-3">
                  <SelectValue placeholder="Pilih frekuensi penggajian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Harian">Harian</SelectItem>
                  <SelectItem value="Mingguan">Mingguan</SelectItem>
                  <SelectItem value="Bulanan">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center">
              <Label htmlFor="baseSalary" className="text-right col-span-4 sm:col-span-1 pr-3">Gaji Pokok (Rp)<span className="text-destructive">*</span></Label>
              <Input id="baseSalary" type="number" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: 3000000" />
            </div>
            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="loanNotes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Catatan Pinjaman (Legacy)</Label>
              <Textarea id="loanNotes" value={loanNotes} onChange={(e) => setLoanNotes(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Catatan terkait pinjaman karyawan (opsional)" rows={2}/>
            </div>
            <div className="grid grid-cols-4 items-start">
              <Label htmlFor="performanceNotes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Catatan Performa</Label>
              <Textarea id="performanceNotes" value={performanceNotes} onChange={(e) => setPerformanceNotes(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Catatan terkait performa karyawan (opsional)" rows={2}/>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveEmployee} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loan Management Dialog */}
      <Dialog open={isLoanMgmtDialogOpen} onOpenChange={setIsLoanMgmtDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Manajemen Pinjaman untuk: {selectedEmployeeForLoan?.name}</DialogTitle>
                <DialogDescription>Kelola semua pinjaman dan cicilan untuk karyawan ini.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-1">
                <Button onClick={() => openLoanFormDialog()} className="mb-4 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <PlusCircle className="mr-2 h-4 w-4" /> Tambah Pinjaman Baru
                </Button>
                {loans.filter(l => l.employeeId === selectedEmployeeForLoan?.id).length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tgl Pinjam</TableHead>
                                <TableHead className="text-right">Jumlah</TableHead>
                                <TableHead className="text-right">Sisa</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loans.filter(l => l.employeeId === selectedEmployeeForLoan?.id)
                             .sort((a,b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime())
                             .map(loan => (
                                <TableRow key={loan.id}>
                                    <TableCell>{format(parseISO(loan.loanDate), "dd MMM yyyy", { locale: localeID })}</TableCell>
                                    <TableCell className="text-right">Rp {loan.loanAmount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">Rp {loan.remainingBalance.toLocaleString()}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge className={`${getLoanStatusBadgeColor(loan.status)} text-white`}>{loan.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center space-x-1">
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openLoanFormDialog(loan)} title="Edit Pinjaman"><Edit className="h-4 w-4"/></Button>
                                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => openInstallmentDialog(loan)} title="Bayar Cicilan / Detail"><CircleDollarSign className="h-4 w-4"/></Button>
                                        <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteLoan(loan.id)} title="Hapus Pinjaman"><Trash2 className="h-4 w-4"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground text-center py-4">Belum ada data pinjaman untuk karyawan ini.</p>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Loan Form Dialog */}
        <Dialog open={isLoanFormDialogOpen} onOpenChange={setIsLoanFormDialogOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingLoan ? 'Edit Pinjaman' : 'Tambah Pinjaman Baru'} untuk {selectedEmployeeForLoan?.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="loanDateForm" className="text-right col-span-1">Tgl Pinjam<span className="text-destructive">*</span></Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!loanDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {loanDate ? format(loanDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={loanDate} onSelect={setLoanDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="loanAmountForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label>
                        <Input id="loanAmountForm" type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className="col-span-3" placeholder="e.g. 500000" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="loanReasonForm" className="text-right col-span-1 pt-2">Alasan</Label>
                        <Textarea id="loanReasonForm" value={loanReason} onChange={e => setLoanReason(e.target.value)} className="col-span-3" placeholder="Alasan pinjaman (opsional)" rows={2} />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="loanRepaymentNotesForm" className="text-right col-span-1 pt-2">Catatan Pembayaran</Label>
                        <Textarea id="loanRepaymentNotesForm" value={loanRepaymentNotes} onChange={e => setLoanRepaymentNotes(e.target.value)} className="col-span-3" placeholder="Detail kesepakatan pembayaran (opsional)" rows={2} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                    <Button onClick={handleSaveLoan} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Pinjaman</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      {/* Installment Management Dialog */}
      {selectedLoanForInstallment && (
        <Dialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detail & Cicilan Pinjaman - {selectedEmployeeForLoan?.name}</DialogTitle>
                    <DialogDescription>
                        Pinjaman: Rp {selectedLoanForInstallment.loanAmount.toLocaleString()} | Sisa: Rp {selectedLoanForInstallment.remainingBalance.toLocaleString()}
                         <br/>Tgl Pinjam: {format(parseISO(selectedLoanForInstallment.loanDate), "dd MMM yyyy", { locale: localeID })}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto p-1">
                    {/* Section to add new installment */}
                    <div className="space-y-4 border-r-0 md:border-r md:pr-6">
                        <h3 className="text-md font-semibold">Tambah Cicilan Baru</h3>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="installmentDateForm" className="text-right col-span-1">Tgl Bayar<span className="text-destructive">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={`col-span-3 justify-start text-left font-normal ${!installmentDate && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {installmentDate ? format(installmentDate, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={installmentDate} onSelect={setInstallmentDate} initialFocus /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="installmentAmountForm" className="text-right col-span-1">Jumlah (Rp)<span className="text-destructive">*</span></Label>
                            <Input id="installmentAmountForm" type="number" value={installmentAmount} onChange={e => setInstallmentAmount(e.target.value)} className="col-span-3" placeholder="e.g. 100000" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="installmentNotesForm" className="text-right col-span-1 pt-2">Catatan</Label>
                            <Textarea id="installmentNotesForm" value={installmentNotes} onChange={e => setInstallmentNotes(e.target.value)} className="col-span-3" placeholder="Catatan cicilan (opsional)" rows={2}/>
                        </div>
                        <Button onClick={handleSaveInstallment} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                            <PlusCircle className="mr-2 h-4 w-4"/> Simpan Cicilan
                        </Button>
                    </div>

                    {/* Section to list existing installments */}
                    <div className="space-y-2">
                        <h3 className="text-md font-semibold">Riwayat Cicilan</h3>
                        {installments.filter(inst => inst.loanId === selectedLoanForInstallment.id).length > 0 ? (
                             <div className="max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tgl Bayar</TableHead>
                                            <TableHead className="text-right">Jumlah</TableHead>
                                            <TableHead>Catatan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {installments.filter(inst => inst.loanId === selectedLoanForInstallment.id)
                                        .sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                        .map(inst => (
                                            <TableRow key={inst.id}>
                                                <TableCell>{format(parseISO(inst.paymentDate), "dd MMM yy", { locale: localeID })}</TableCell>
                                                <TableCell className="text-right">Rp {inst.amountPaid.toLocaleString()}</TableCell>
                                                <TableCell className="text-xs">{inst.notes || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center text-sm py-4">Belum ada cicilan untuk pinjaman ini.</p>
                        )}
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

