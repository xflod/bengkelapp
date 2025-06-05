
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
import type { Employee, EmployeeStatus, PayrollFrequency } from "@/lib/types";
import { UserPlus, Edit3, Trash2, Search, Filter, Calendar as CalendarIcon, Users } from "lucide-react";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Budi Santoso', position: 'Mekanik Senior', joinDate: '2022-01-15', phone: '081234567890', address: 'Jl. Merdeka No. 10', status: 'Aktif', payrollFrequency: 'Bulanan', baseSalary: 5000000, loanNotes: 'Pinjaman Koperasi Rp 500.000', performanceNotes: 'Sangat baik dalam diagnosis masalah kompleks.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'EMP-002', name: 'Siti Aminah', position: 'Admin Kasir', joinDate: '2023-03-01', phone: '087654321098', address: 'Jl. Pahlawan No. 5', status: 'Aktif', payrollFrequency: 'Bulanan', baseSalary: 3500000, performanceNotes: 'Teliti dan ramah pelanggan.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'EMP-003', name: 'Joko Susilo', position: 'Mekanik Junior', joinDate: '2023-08-20', status: 'Tidak Aktif', payrollFrequency: 'Harian', baseSalary: 150000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

type EmployeeFilter = 'all' | 'aktif' | 'tidakAktif' | 'resign';

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
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

  useEffect(() => {
    try {
      const storedData = localStorage.getItem('employeesDataBengkelKu');
      if (storedData) {
        setEmployees(JSON.parse(storedData));
      } else {
        setEmployees(MOCK_EMPLOYEES); // Use mock data if nothing in local storage
      }
    } catch (error) {
      console.error("Failed to parse employees from localStorage:", error);
      setEmployees(MOCK_EMPLOYEES);
      toast({ variant: "destructive", title: "Gagal Memuat Data Lokal", description: "Memuat data contoh." });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('employeesDataBengkelKu', JSON.stringify(employees));
    }
  }, [employees, isLoading]);

  const resetFormFields = useCallback(() => {
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

  const handleOpenFormDialog = useCallback((employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeName(employee.name);
      setPosition(employee.position);
      setJoinDate(employee.joinDate ? parseISO(employee.joinDate) : new Date());
      setPhone(employee.phone || '');
      setAddress(employee.address || '');
      setEmployeeStatus(employee.status);
      setPayrollFrequency(employee.payrollFrequency);
      setBaseSalary(employee.baseSalary);
      setLoanNotes(employee.loanNotes || '');
      setPerformanceNotes(employee.performanceNotes || '');
    } else {
      resetFormFields();
    }
    setIsFormDialogOpen(true);
  }, [resetFormFields]);

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
    if (window.confirm(`Apakah Anda yakin ingin menghapus karyawan "${name}"?`)) {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
      toast({ title: "Karyawan Dihapus", description: `${name} telah dihapus.` });
    }
  }, [toast]);
  
  const handleToggleEmployeeStatus = useCallback((employeeId: string, currentStatus: EmployeeStatus) => {
    const newStatus: EmployeeStatus = currentStatus === 'Aktif' ? 'Tidak Aktif' : 'Aktif';
    setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, status: newStatus, updatedAt: new Date().toISOString() } : emp));
    toast({ title: "Status Karyawan Diubah", description: `Status telah diubah menjadi ${newStatus}.` });
  }, [toast]);


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
        description="Kelola data karyawan, penggajian, dan performa."
        actions={
          <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
                    <TableHead className="text-center w-[120px]">Aksi</TableHead>
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
                        <div className="flex justify-center items-center gap-1">
                           <Switch
                            checked={emp.status === 'Aktif'}
                            onCheckedChange={() => handleToggleEmployeeStatus(emp.id, emp.status)}
                            aria-label={emp.status === 'Aktif' ? "Nonaktifkan" : "Aktifkan"}
                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-yellow-500"
                          />
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent" onClick={() => handleOpenFormDialog(emp)} title="Edit Karyawan">
                            <Edit3 className="h-4 w-4" />
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

      <Dialog open={isFormDialogOpen} onOpenChange={(open) => { setIsFormDialogOpen(open); if (!open) resetFormFields(); }}>
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
                  <Calendar
                    mode="single"
                    selected={joinDate}
                    onSelect={setJoinDate}
                    initialFocus
                  />
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
              <Label htmlFor="loanNotes" className="text-right col-span-4 sm:col-span-1 pt-2 pr-3">Catatan Pinjaman</Label>
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
    </div>
  );
}
