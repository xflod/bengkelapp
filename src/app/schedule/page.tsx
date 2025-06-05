
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, PlayCircle, CheckCircle2, Edit3, Copy, Trash2, AlertCircle, Hourglass, XCircle, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Slider } from "@/components/ui/slider"; 
import { Progress } from "@/components/ui/progress"; // Added Progress import

interface ServiceJob {
  id: string;
  customerName: string;
  customerPhone?: string;
  vehiclePlate: string;
  vehicleType: string;
  serviceRequest: string; 
  actualStartTime?: string; 
  workDoneNotes?: string;
  status: 'Antrian' | 'Dikerjakan' | 'Menunggu Konfirmasi' | 'Selesai' | 'Dibatalkan';
  accessCode: string;
  createdAt: string; 
  updatedAt: string;
  estimatedProgress?: number; // New field
}

const generateId = () => `SJ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function SchedulePage() {
  const { toast } = useToast();
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [serviceRequest, setServiceRequest] = useState('');
  const [workDoneNotes, setWorkDoneNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState<ServiceJob['status']>('Antrian');
  const [currentAccessCode, setCurrentAccessCode] = useState('');
  const [estimatedProgress, setEstimatedProgress] = useState<number[]>([0]); // For Slider component


  useEffect(() => {
    try {
      const storedJobs = localStorage.getItem('serviceJobsBengkelKu');
      if (storedJobs) {
        setServiceJobs(JSON.parse(storedJobs));
      }
    } catch (error) {
      console.error("Failed to parse service jobs from localStorage:", error);
      setServiceJobs([]); 
    }
  }, []);

  useEffect(() => {
     try {
        if (serviceJobs.length > 0 || localStorage.getItem('serviceJobsBengkelKu') !== null) {
            localStorage.setItem('serviceJobsBengkelKu', JSON.stringify(serviceJobs));
        }
     } catch (error) {
        console.error("Failed to save service jobs to localStorage:", error);
        toast({ variant: "destructive", title: "Gagal Menyimpan Data", description: "Tidak dapat menyimpan perubahan ke penyimpanan lokal."})
     }
  }, [serviceJobs, toast]);

  const resetFormFields = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setVehiclePlate('');
    setVehicleType('');
    setServiceRequest('');
    setWorkDoneNotes('');
    setCurrentStatus('Antrian');
    setEditingJobId(null);
    setCurrentAccessCode(generateAccessCode());
    setEstimatedProgress([0]);
  }, []);

  const handleOpenFormDialog = useCallback((job?: ServiceJob) => {
    if (job) {
      setEditingJobId(job.id);
      setCustomerName(job.customerName);
      setCustomerPhone(job.customerPhone || '');
      setVehiclePlate(job.vehiclePlate);
      setVehicleType(job.vehicleType);
      setServiceRequest(job.serviceRequest);
      setWorkDoneNotes(job.workDoneNotes || '');
      setCurrentStatus(job.status);
      setCurrentAccessCode(job.accessCode);
      setEstimatedProgress([job.estimatedProgress || 0]);
    } else {
      resetFormFields();
    }
    setIsFormOpen(true);
  }, [resetFormFields]);

  const handleSaveJob = () => {
    if (!customerName.trim() || !vehiclePlate.trim() || !vehicleType.trim() || !serviceRequest.trim()) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Nama, No. Polisi, Jenis Kendaraan, dan Keluhan wajib diisi." });
      return;
    }

    const now = new Date().toISOString();
    const progressValue = estimatedProgress[0];
    
    if (editingJobId) {
      setServiceJobs(prevJobs =>
        prevJobs.map(j =>
          j.id === editingJobId
            ? { ...j, customerName, customerPhone, vehiclePlate, vehicleType, serviceRequest, workDoneNotes, status: currentStatus, estimatedProgress: progressValue, updatedAt: now }
            : j
        )
      );
      toast({ title: "Jadwal Diperbarui", description: `Servis untuk ${vehiclePlate} telah diperbarui.` });
    } else {
      const newJob: ServiceJob = {
        id: generateId(),
        customerName,
        customerPhone,
        vehiclePlate,
        vehicleType,
        serviceRequest,
        workDoneNotes,
        status: 'Antrian',
        accessCode: currentAccessCode,
        createdAt: now,
        updatedAt: now,
        estimatedProgress: progressValue,
      };
      setServiceJobs(prevJobs => [newJob, ...prevJobs]);
      toast({ title: "Jadwal Dibuat", description: `Servis baru untuk ${vehiclePlate} ditambahkan.` });
    }
    setIsFormOpen(false);
    resetFormFields();
  };

  const handleUpdateStatus = useCallback((jobId: string, newStatus: ServiceJob['status']) => {
    const now = new Date().toISOString();
    setServiceJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.id === jobId) {
          const updatedJob = { ...job, status: newStatus, updatedAt: now };
          let toastMessage = `Status servis ${job.vehiclePlate} menjadi ${newStatus}.`;

          if (newStatus === 'Dikerjakan' && !job.actualStartTime) {
            updatedJob.actualStartTime = now;
            updatedJob.estimatedProgress = Math.max(updatedJob.estimatedProgress || 0, 5); // Auto set to 5% if starting
            toastMessage = `Servis untuk ${job.vehiclePlate} mulai dikerjakan.`;
          } else if (newStatus === 'Selesai') {
            updatedJob.estimatedProgress = 100; // Auto set to 100% if completed
            toastMessage = `Servis untuk ${job.vehiclePlate} telah selesai.`;
          }
          toast({ title: "Status Diperbarui", description: toastMessage });
          return updatedJob;
        }
        return job;
      })
    );
  }, [toast]);
  
  const handleDeleteJob = useCallback((jobId: string, plate: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus jadwal servis untuk ${plate}?`)) {
        setServiceJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        toast({ title: "Jadwal Dihapus", description: `Jadwal servis untuk ${plate} telah dihapus.` });
    }
  }, [toast]);

  const handleCopyAccessCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: "Kode Akses Disalin", description: "Kode akses pelanggan telah disalin." });
    }).catch(() => {
      toast({ variant: "destructive", title: "Gagal Menyalin", description: "Tidak dapat menyalin kode akses." });
    });
  }, [toast]);
  
  const getStatusBadge = (status: ServiceJob['status']): React.ReactNode => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let icon = null;
    let colorClass = "";

    switch (status) {
      case 'Antrian': variant = 'secondary'; icon = <Hourglass className="mr-1 h-3 w-3" />; colorClass="bg-slate-500 hover:bg-slate-600"; break;
      case 'Dikerjakan': variant = 'default'; icon = <PlayCircle className="mr-1 h-3 w-3" />; colorClass="bg-blue-500 hover:bg-blue-600"; break;
      case 'Menunggu Konfirmasi': variant = 'outline'; icon = <AlertCircle className="mr-1 h-3 w-3" />; colorClass="bg-yellow-500 text-yellow-foreground hover:bg-yellow-600 border-yellow-600"; break;
      case 'Selesai': variant = 'default'; icon = <CheckCircle2 className="mr-1 h-3 w-3" />; colorClass="bg-green-600 hover:bg-green-700"; break;
      case 'Dibatalkan': variant = 'destructive'; icon = <XCircle className="mr-1 h-3 w-3" />; colorClass="bg-red-600 hover:bg-red-700"; break;
    }
    return <Badge variant={variant} className={`whitespace-nowrap text-xs ${colorClass} text-white`}>{icon}{status}</Badge>;
  };

  const sortedServiceJobs = React.useMemo(() => {
    return [...serviceJobs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [serviceJobs]);


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Jadwal Servis Kendaraan"
        description="Kelola antrian dan status pengerjaan servis motor pelanggan."
        actions={
          <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Buat Jadwal Baru
          </Button>
        }
      />

      {sortedServiceJobs.length === 0 ? (
         <Card className="w-full max-w-md mx-auto text-center shadow-lg border-dashed border-gray-300 py-10">
          <CardHeader className="items-center">
             <Hourglass className="w-16 h-16 text-muted-foreground mb-4" />
            <CardTitle className="text-xl text-foreground">
              Belum Ada Jadwal Servis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Saat ini tidak ada jadwal servis yang aktif. <br/>Klik "Buat Jadwal Baru" untuk memulai.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedServiceJobs.map(job => (
            <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg font-semibold text-primary">{job.vehiclePlate}</CardTitle>
                    <CardDescription className="text-xs">{job.vehicleType} <br/> A/N: {job.customerName}</CardDescription>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
                {job.estimatedProgress !== undefined && job.status !== 'Selesai' && job.status !== 'Dibatalkan' && (
                  <div className="mt-2">
                     <div className="flex justify-between items-center text-xs text-muted-foreground mb-0.5">
                        <span>Progres:</span>
                        <span className="font-semibold text-primary">{job.estimatedProgress}%</span>
                    </div>
                    <Progress value={job.estimatedProgress} className="h-1.5" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm flex-grow pb-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Keluhan/Permintaan:</Label>
                  <p className="whitespace-pre-wrap text-foreground text-xs leading-relaxed max-h-20 overflow-y-auto p-1 bg-muted/30 rounded-sm">{job.serviceRequest || "-"}</p>
                </div>
                {job.actualStartTime && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Mulai Dikerjakan:</Label>
                    <p className="text-xs text-foreground">{format(new Date(job.actualStartTime), "dd MMM yyyy, HH:mm", { locale: localeID })}</p>
                  </div>
                )}
                {job.workDoneNotes && (
                   <div>
                    <Label className="text-xs font-medium text-muted-foreground">Catatan Pengerjaan:</Label>
                    <p className="whitespace-pre-wrap text-foreground text-xs leading-relaxed max-h-20 overflow-y-auto p-1 bg-muted/30 rounded-sm">{job.workDoneNotes}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Kode Akses Pelanggan:</Label>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-accent-foreground">{job.accessCode}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyAccessCode(job.accessCode)} title="Salin Kode Akses">
                      <Copy className="h-3 w-3"/>
                    </Button>
                  </div>
                   <p className="text-xs text-muted-foreground/70 mt-0.5">
                      (Untuk pelanggan cek status di halaman cek servis)
                   </p>
                </div>
                 <p className="text-xs text-muted-foreground/70 pt-1">Dibuat: {format(new Date(job.createdAt), "dd/MM/yy HH:mm")}</p>
                 <p className="text-xs text-muted-foreground/70">Diupdate: {format(new Date(job.updatedAt), "dd/MM/yy HH:mm")}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 border-t pt-3 pb-3">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenFormDialog(job)}>
                  <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit / Detail
                </Button>
                
                <div className="grid grid-cols-2 gap-2 w-full">
                  {job.status === 'Antrian' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Dikerjakan')} className="w-full bg-blue-600 hover:bg-blue-700 text-primary-foreground col-span-2">
                      <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Mulai Kerjakan
                    </Button>
                  )}
                  {job.status === 'Dikerjakan' && (
                    <>
                      <Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Menunggu Konfirmasi')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-foreground border-yellow-600">
                        <Hourglass className="mr-1.5 h-3.5 w-3.5" /> Perlu Konfirmasi
                      </Button>
                       <Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Selesai')} className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Selesai
                      </Button>
                    </>
                  )}
                  {job.status === 'Menunggu Konfirmasi' && (
                     <Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Selesai')} className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground col-span-2">
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Tandai Selesai
                      </Button>
                  )}
                </div>
                 {(job.status !== 'Selesai' && job.status !== 'Dibatalkan') && (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(job.id, 'Dibatalkan')} className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive mt-1">
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> Batalkan Servis
                    </Button>
                 )}
                  <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10 mt-1" onClick={() => handleDeleteJob(job.id, job.vehiclePlate)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Hapus Jadwal
                  </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetFormFields(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingJobId ? 'Edit Jadwal Servis' : 'Buat Jadwal Servis Baru'}</DialogTitle>
            <DialogDescription>
              {editingJobId ? `Mengedit detail untuk ${vehiclePlate}.` : 'Masukkan detail servis pelanggan dan kendaraan.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 flex-grow overflow-y-auto pr-3">
            <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
              <Label htmlFor="customerNameForm" className="text-right col-span-4 sm:col-span-1">Nama Pelanggan<span className="text-destructive">*</span></Label>
              <Input id="customerNameForm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Nama lengkap pelanggan" />
            
              <Label htmlFor="customerPhoneForm" className="text-right col-span-4 sm:col-span-1">No. Telepon</Label>
              <Input id="customerPhoneForm" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="08xxxxxxxxxx (opsional)" />
            
              <Label htmlFor="vehiclePlateForm" className="text-right col-span-4 sm:col-span-1">No. Polisi<span className="text-destructive">*</span></Label>
              <Input id="vehiclePlateForm" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className="col-span-4 sm:col-span-3" placeholder="Contoh: B 1234 ABC" />
            
              <Label htmlFor="vehicleTypeForm" className="text-right col-span-4 sm:col-span-1">Jenis Kendaraan<span className="text-destructive">*</span></Label>
              <Input id="vehicleTypeForm" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Contoh: Honda Beat, Yamaha NMAX" />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 mt-2">
              <Label htmlFor="serviceRequestForm" className="text-right col-span-4 sm:col-span-1 pt-2">Keluhan/Permintaan<span className="text-destructive">*</span></Label>
              <Textarea id="serviceRequestForm" value={serviceRequest} onChange={(e) => setServiceRequest(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Jelaskan keluhan pelanggan atau permintaan servis." rows={3}/>
            </div>

            <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 mt-2">
                <Label htmlFor="estimatedProgressForm" className="text-right col-span-4 sm:col-span-1 pt-2">Estimasi Progres (%)</Label>
                <div className="col-span-4 sm:col-span-3 space-y-2">
                    <Slider
                        id="estimatedProgressForm"
                        min={0}
                        max={100}
                        step={5}
                        value={estimatedProgress}
                        onValueChange={setEstimatedProgress}
                        className="w-full"
                    />
                    <Input 
                        type="number" 
                        value={estimatedProgress[0]} 
                        onChange={(e) => setEstimatedProgress([parseInt(e.target.value, 10) || 0])}
                        min="0" max="100"
                        className="w-20 text-center"
                    />
                </div>
            </div>

            {editingJobId && (
              <>
                <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 mt-2">
                  <Label htmlFor="workDoneNotesForm" className="text-right col-span-4 sm:col-span-1 pt-2">Catatan Pengerjaan</Label>
                  <Textarea id="workDoneNotesForm" value={workDoneNotes} onChange={(e) => setWorkDoneNotes(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Catat pekerjaan yang telah dilakukan (mis: ganti oli, bersihkan karbu)." rows={4}/>
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2 mt-2">
                    <Label htmlFor="currentStatusForm" className="text-right col-span-4 sm:col-span-1">Status Servis</Label>
                    <Select value={currentStatus} onValueChange={(value: ServiceJob['status']) => setCurrentStatus(value)}>
                        <SelectTrigger className="col-span-4 sm:col-span-3">
                            <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Antrian">Antrian</SelectItem>
                            <SelectItem value="Dikerjakan">Dikerjakan</SelectItem>
                            <SelectItem value="Menunggu Konfirmasi">Menunggu Konfirmasi</SelectItem>
                            <SelectItem value="Selesai">Selesai</SelectItem>
                            <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2 mt-2">
                    <Label className="text-right col-span-4 sm:col-span-1">Kode Akses</Label>
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-2">
                        <Input id="accessCodeDisplay" value={currentAccessCode} readOnly className="bg-muted/50" />
                        <Button variant="outline" size="icon" onClick={() => handleCopyAccessCode(currentAccessCode)} title="Salin Kode Akses">
                            <Copy className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
              </>
            )}
             {!editingJobId && (
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2 mt-2">
                     <Label className="text-right col-span-4 sm:col-span-1">Kode Akses</Label>
                     <Input value={currentAccessCode} readOnly className="col-span-4 sm:col-span-3 bg-muted/50" />
                 </div>
             )}
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Batal</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveJob} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Jadwal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
