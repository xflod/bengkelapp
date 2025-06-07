
"use client";

import React, { useState, useEffect, useCallback, useId } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarPlus, PlayCircle, CheckCircle2, Edit3, Copy, Trash2, AlertCircle, Hourglass, XCircle, ExternalLink, ClipboardCopy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Slider } from "@/components/ui/slider"; 
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/lib/supabase';

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });


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
  estimatedProgress?: number;
}

const generateAccessCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function SchedulePage() {
  const { toast } = useToast();
  const [serviceJobs, setServiceJobs] = useState<ServiceJob[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [serviceRequest, setServiceRequest] = useState('');
  const [workDoneNotes, setWorkDoneNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState<ServiceJob['status']>('Antrian');
  const [currentAccessCode, setCurrentAccessCode] = useState('');
  const [estimatedProgress, setEstimatedProgress] = useState<number[]>([0]);

  const scheduleDialogTitleId = useId();

  const fetchServiceJobs = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('service_jobs')
      .select('*')
      .order('created_at', { ascending: false }); 

    if (error) {
      console.error('Error fetching service jobs:', error);
      toast({ variant: "destructive", title: "Gagal Memuat Jadwal", description: error.message });
      setServiceJobs([]);
    } else {
      setServiceJobs(data.map(j => ({...j, id: String(j.id)})) as ServiceJob[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchServiceJobs();
  }, [fetchServiceJobs]);

  const resetFormFields = useCallback(() => {
    setCustomerName(''); setCustomerPhone(''); setVehiclePlate(''); setVehicleType('');
    setServiceRequest(''); setWorkDoneNotes(''); setCurrentStatus('Antrian');
    setEditingJobId(null); setCurrentAccessCode(generateAccessCode()); setEstimatedProgress([0]);
  }, []);

  const handleOpenFormDialog = useCallback((job?: ServiceJob) => {
    if (job) {
      setEditingJobId(job.id); setCustomerName(job.customerName); setCustomerPhone(job.customerPhone || '');
      setVehiclePlate(job.vehiclePlate); setVehicleType(job.vehicleType); setServiceRequest(job.serviceRequest);
      setWorkDoneNotes(job.workDoneNotes || ''); setCurrentStatus(job.status); setCurrentAccessCode(job.accessCode);
      setEstimatedProgress([job.estimatedProgress || 0]);
    } else {
      resetFormFields();
    }
    setIsFormOpen(true);
  }, [resetFormFields]);

  const handleSaveJob = async () => {
    if (!customerName.trim() || !vehiclePlate.trim() || !vehicleType.trim() || !serviceRequest.trim()) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap" }); return;
    }
    const now = new Date().toISOString();
    const progressValue = estimatedProgress[0];

    const jobData = {
      customer_name: customerName.trim(), customer_phone: customerPhone.trim() || undefined,
      vehicle_plate: vehiclePlate.trim().toUpperCase(), vehicle_type: vehicleType.trim(),
      service_request: serviceRequest.trim(), work_done_notes: workDoneNotes.trim() || undefined,
      status: currentStatus, access_code: currentAccessCode, estimated_progress: progressValue,
      updated_at: now,
    };

    if (editingJobId) {
      const { error } = await supabase.from('service_jobs').update(jobData).match({ id: editingJobId });
      if (error) toast({ variant: "destructive", title: "Gagal Update Jadwal", description: error.message });
      else { toast({ title: "Jadwal Diperbarui" }); fetchServiceJobs(); }
    } else {
      const { error } = await supabase.from('service_jobs').insert([{ ...jobData, created_at: now, status: 'Antrian' }]);
      if (error) toast({ variant: "destructive", title: "Gagal Buat Jadwal", description: error.message });
      else { toast({ title: "Jadwal Dibuat" }); fetchServiceJobs(); }
    }
    setIsFormOpen(false);
  };

  const handleUpdateStatus = useCallback(async (jobId: string, newStatus: ServiceJob['status']) => {
    const now = new Date().toISOString();
    const jobToUpdate = serviceJobs.find(j => j.id === jobId);
    if (!jobToUpdate) return;

    let updateData: Partial<any> = { status: newStatus, updated_at: now };
    let toastMessage = `Status servis ${jobToUpdate.vehiclePlate} menjadi ${newStatus}.`;

    if (newStatus === 'Dikerjakan' && !jobToUpdate.actualStartTime) {
      updateData.actual_start_time = now;
      updateData.estimated_progress = Math.max(jobToUpdate.estimatedProgress || 0, 5);
      toastMessage = `Servis untuk ${jobToUpdate.vehiclePlate} mulai dikerjakan.`;
    } else if (newStatus === 'Selesai') {
      updateData.estimated_progress = 100; 
      toastMessage = `Servis untuk ${jobToUpdate.vehiclePlate} telah selesai.`;
    }
    
    const { error } = await supabase.from('service_jobs').update(updateData).match({ id: jobId });
    if (error) toast({ variant: "destructive", title: "Gagal Update Status", description: error.message });
    else { toast({ title: "Status Diperbarui", description: toastMessage }); fetchServiceJobs(); }
  }, [toast, fetchServiceJobs, serviceJobs]);
  
  const handleDeleteJob = useCallback(async (jobId: string, plate: string) => {
    if (window.confirm(`Yakin ingin menghapus jadwal servis untuk ${plate}?`)) {
        const { error } = await supabase.from('service_jobs').delete().match({ id: jobId });
        if (error) toast({ variant: "destructive", title: "Gagal Hapus Jadwal", description: error.message });
        else { toast({ title: "Jadwal Dihapus" }); fetchServiceJobs(); }
    }
  }, [toast, fetchServiceJobs]);

  const handleCopyAccessCode = useCallback((code: string) => { navigator.clipboard.writeText(code).then(() => toast({ title: "Kode Akses Disalin" })).catch(() => toast({ variant: "destructive", title: "Gagal Menyalin" })); }, [toast]);
  const handleCopyStatusLink = useCallback((accessCode: string) => { const url = `${window.location.origin}/service-status?code=${accessCode}`; navigator.clipboard.writeText(url).then(() => toast({ title: "Link Status Disalin" })).catch(() => toast({ variant: "destructive", title: "Gagal Menyalin Link" })); }, [toast]);
  const handleOpenStatusLink = useCallback((accessCode: string) => { const url = `${window.location.origin}/service-status?code=${accessCode}`; window.open(url, '_blank'); }, []);
  const getStatusBadge = (status: ServiceJob['status']): React.ReactNode => { let variant: "default" | "secondary" | "destructive" | "outline" = "default"; let icon = null; let colorClass = ""; switch (status) { case 'Antrian': variant = 'secondary'; icon = <Hourglass className="mr-1 h-3 w-3" />; colorClass="bg-slate-500 hover:bg-slate-600"; break; case 'Dikerjakan': variant = 'default'; icon = <PlayCircle className="mr-1 h-3 w-3" />; colorClass="bg-blue-500 hover:bg-blue-600"; break; case 'Menunggu Konfirmasi': variant = 'outline'; icon = <AlertCircle className="mr-1 h-3 w-3" />; colorClass="bg-yellow-500 text-yellow-foreground hover:bg-yellow-600 border-yellow-600"; break; case 'Selesai': variant = 'default'; icon = <CheckCircle2 className="mr-1 h-3 w-3" />; colorClass="bg-green-600 hover:bg-green-700"; break; case 'Dibatalkan': variant = 'destructive'; icon = <XCircle className="mr-1 h-3 w-3" />; colorClass="bg-red-600 hover:bg-red-700"; break; } return <Badge variant={variant} className={`whitespace-nowrap text-xs ${colorClass} text-white`}>{icon}{status}</Badge>; };
  const sortedServiceJobs = React.useMemo(() => [...serviceJobs].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [serviceJobs]);

  if (isLoading && serviceJobs.length === 0) { 
    return <div className="flex justify-center items-center h-screen"><Hourglass className="h-12 w-12 text-primary animate-spin" /> <p className="ml-4">Memuat jadwal servis...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Jadwal Servis Kendaraan" description="Kelola antrian dan status pengerjaan servis motor pelanggan." actions={ <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground"><CalendarPlus className="mr-2 h-4 w-4" />Buat Jadwal Baru</Button>}/>
      {isLoading && serviceJobs.length > 0 && <div className="text-center text-muted-foreground p-4">Memperbarui data...</div>}
      {!isLoading && sortedServiceJobs.length === 0 ? (
         <Card className="w-full max-w-md mx-auto text-center shadow-lg border-dashed border-gray-300 py-10"><CardHeader className="items-center"><Hourglass className="w-16 h-16 text-muted-foreground mb-4" /><CardTitle className="text-xl text-foreground">Belum Ada Jadwal Servis</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Saat ini tidak ada jadwal servis. <br/>Klik "Buat Jadwal Baru" untuk memulai.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedServiceJobs.map(job => (
            <Card key={job.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card">
              <CardHeader className="pb-3"><div className="flex justify-between items-start gap-2"><div><CardTitle className="text-lg font-semibold text-primary">{job.vehiclePlate}</CardTitle><CardDescription className="text-xs">{job.vehicleType} <br/> A/N: {job.customerName}</CardDescription></div>{getStatusBadge(job.status)}</div>{job.estimatedProgress !== undefined && job.status !== 'Selesai' && job.status !== 'Dibatalkan' && (<div className="mt-2"><div className="flex justify-between items-center text-xs text-muted-foreground mb-0.5"><span>Progres:</span><span className="font-semibold text-primary">{job.estimatedProgress}%</span></div><Progress value={job.estimatedProgress} className="h-1.5" /></div>)}</CardHeader>
              <CardContent className="space-y-3 text-sm flex-grow pb-4"><div><Label className="text-xs font-medium text-muted-foreground">Keluhan/Permintaan:</Label><p className="whitespace-pre-wrap text-foreground text-xs leading-relaxed max-h-20 overflow-y-auto p-1 bg-muted/30 rounded-sm">{job.serviceRequest || "-"}</p></div>{job.actualStartTime && (<div><Label className="text-xs font-medium text-muted-foreground">Mulai Dikerjakan:</Label><p className="text-xs text-foreground">{format(new Date(job.actualStartTime), "dd MMM yyyy, HH:mm", { locale: localeID })}</p></div>)}{job.workDoneNotes && (<div><Label className="text-xs font-medium text-muted-foreground">Catatan Pengerjaan:</Label><p className="whitespace-pre-wrap text-foreground text-xs leading-relaxed max-h-20 overflow-y-auto p-1 bg-muted/30 rounded-sm">{job.workDoneNotes}</p></div>)}<div><Label className="text-xs font-medium text-muted-foreground">Akses Pelanggan:</Label><div className="flex items-center gap-1 mt-0.5"><p className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-accent-foreground">Kode: {job.accessCode}</p><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyAccessCode(job.accessCode)} title="Salin Kode"><Copy className="h-3 w-3"/></Button></div><div className="mt-1.5 flex flex-col sm:flex-row gap-1.5"><Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleCopyStatusLink(job.accessCode)}><ClipboardCopy className="mr-1 h-3 w-3" /> Salin Link</Button><Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleOpenStatusLink(job.accessCode)}><ExternalLink className="mr-1 h-3 w-3" /> Buka Link</Button></div><p className="text-xs text-muted-foreground/70 mt-1">Bagikan link atau kode ke pelanggan.</p></div><p className="text-xs text-muted-foreground/70 pt-1">Dibuat: {format(new Date(job.createdAt), "dd/MM/yy HH:mm")}</p><p className="text-xs text-muted-foreground/70">Diupdate: {format(new Date(job.updatedAt), "dd/MM/yy HH:mm")}</p></CardContent>
              <CardFooter className="flex flex-col gap-2 border-t pt-3 pb-3"><Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenFormDialog(job)}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit / Detail</Button><div className="grid grid-cols-2 gap-2 w-full">{job.status === 'Antrian' && (<Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Dikerjakan')} className="w-full bg-blue-600 hover:bg-blue-700 text-primary-foreground col-span-2"><PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Mulai Kerjakan</Button>)}{job.status === 'Dikerjakan' && (<><Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Menunggu Konfirmasi')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-foreground border-yellow-600"><Hourglass className="mr-1.5 h-3.5 w-3.5" /> Perlu Konfirmasi</Button><Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Selesai')} className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Selesai</Button></>)}{job.status === 'Menunggu Konfirmasi' && (<Button size="sm" onClick={() => handleUpdateStatus(job.id, 'Selesai')} className="w-full bg-green-600 hover:bg-green-700 text-primary-foreground col-span-2"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Tandai Selesai</Button>)}</div>{(job.status !== 'Selesai' && job.status !== 'Dibatalkan') && (<Button variant="outline" size="sm" onClick={() => handleUpdateStatus(job.id, 'Dibatalkan')} className="w-full text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive mt-1"><XCircle className="mr-1.5 h-3.5 w-3.5" /> Batalkan Servis</Button>)}<Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive/80 hover:bg-destructive/10 mt-1" onClick={() => handleDeleteJob(job.id, job.vehiclePlate)}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Hapus Jadwal</Button></CardFooter>
            </Card>
          ))}
        </div>
      )}
      {isFormOpen && (
        <DynamicDialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetFormFields(); }}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col" >
            <DynamicDialogHeader className="flex-shrink-0">
              <DynamicDialogTitle id={scheduleDialogTitleId}>{editingJobId ? 'Edit Jadwal Servis' : 'Buat Jadwal Servis Baru'}</DynamicDialogTitle>
              <DynamicDialogDescription>{editingJobId ? `Mengedit detail untuk ${vehiclePlate}.` : 'Masukkan detail servis pelanggan.'}</DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="grid gap-4 py-2 flex-grow overflow-y-auto pr-3">
              <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2"><Label htmlFor="customerNameForm" className="text-right col-span-4 sm:col-span-1">Nama<span className="text-destructive">*</span></Label><Input id="customerNameForm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Nama pelanggan" /><Label htmlFor="customerPhoneForm" className="text-right col-span-4 sm:col-span-1">No. Telp</Label><Input id="customerPhoneForm" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="08xx (opsional)" /><Label htmlFor="vehiclePlateForm" className="text-right col-span-4 sm:col-span-1">No. Pol<span className="text-destructive">*</span></Label><Input id="vehiclePlateForm" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())} className="col-span-4 sm:col-span-3" placeholder="B 1234 ABC" /><Label htmlFor="vehicleTypeForm" className="text-right col-span-4 sm:col-span-1">Kendaraan<span className="text-destructive">*</span></Label><Input id="vehicleTypeForm" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Honda Beat, NMAX" /></div>
              <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 mt-2"><Label htmlFor="serviceRequestForm" className="text-right col-span-4 sm:col-span-1 pt-2">Keluhan<span className="text-destructive">*</span></Label><Textarea id="serviceRequestForm" value={serviceRequest} onChange={(e) => setServiceRequest(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Jelaskan keluhan pelanggan." rows={3}/></div>
              <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 mt-2"><Label htmlFor="estimatedProgressForm" className="text-right col-span-4 sm:col-span-1 pt-2">Estimasi Progres (%)</Label><div className="col-span-4 sm:col-span-3 space-y-2"><Slider id="estimatedProgressForm" min={0} max={100} step={5} value={estimatedProgress} onValueChange={setEstimatedProgress} className="w-full"/><Input type="number" value={estimatedProgress[0]} onChange={(e) => setEstimatedProgress([parseInt(e.target.value, 10) || 0])} min="0" max="100" className="w-20 text-center"/></div></div>
              {editingJobId && (
                <>
                  <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2 mt-2"><Label htmlFor="workDoneNotesForm" className="text-right col-span-4 sm:col-span-1 pt-2">Catatan Pengerjaan</Label><Textarea id="workDoneNotesForm" value={workDoneNotes} onChange={(e) => setWorkDoneNotes(e.target.value)} className="col-span-4 sm:col-span-3" placeholder="Catat pekerjaan yg dilakukan." rows={4}/></div>
                  <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2 mt-2"><Label htmlFor="currentStatusForm" className="text-right col-span-4 sm:col-span-1">Status</Label>
                    <Select value={currentStatus} onValueChange={(value: ServiceJob['status']) => setCurrentStatus(value)}>
                      <SelectTrigger className="col-span-4 sm:col-span-3"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Antrian">Antrian</SelectItem>
                        <SelectItem value="Dikerjakan">Dikerjakan</SelectItem>
                        <SelectItem value="Menunggu Konfirmasi">Menunggu Konfirmasi</SelectItem>
                        <SelectItem value="Selesai">Selesai</SelectItem>
                        <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2 mt-2"><Label className="text-right col-span-4 sm:col-span-1">Kode Akses</Label><div className="col-span-4 sm:col-span-3 flex items-center gap-2"><Input id="accessCodeDisplay" value={currentAccessCode} readOnly className="bg-muted/50" /><Button variant="outline" size="icon" onClick={() => handleCopyAccessCode(currentAccessCode)} title="Salin Kode"><Copy className="h-4 w-4"/></Button></div></div>
                </>
              )}
              {!editingJobId && (<div className="grid grid-cols-4 items-center gap-x-4 gap-y-2 mt-2"><Label className="text-right col-span-4 sm:col-span-1">Kode Akses</Label><Input value={currentAccessCode} readOnly className="col-span-4 sm:col-span-3 bg-muted/50" /></div>)}
            </div>
            <DynamicDialogFooter className="flex-shrink-0 pt-4 border-t">
              <DynamicDialogClose asChild><Button type="button" variant="outline">Batal</Button></DynamicDialogClose>
              <Button type="button" onClick={handleSaveJob} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Jadwal</Button>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}

