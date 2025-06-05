
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Hourglass, PlayCircle, CheckCircle2, AlertCircle, XCircle, Search, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

// Mirrored from schedule/page.tsx for consistency
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

export default function ServiceStatusPage() {
  const { toast } = useToast();
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [serviceJob, setServiceJob] = useState<ServiceJob | null | undefined>(undefined); // undefined for initial, null for not found
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckStatus = () => {
    if (!accessCodeInput.trim()) {
      toast({ variant: "destructive", title: "Kode Akses Kosong", description: "Mohon masukkan kode akses servis Anda." });
      return;
    }
    setIsLoading(true);
    setServiceJob(undefined); // Reset previous result

    try {
      const storedJobsString = localStorage.getItem('serviceJobsBengkelKu');
      if (storedJobsString) {
        const storedJobs: ServiceJob[] = JSON.parse(storedJobsString);
        const foundJob = storedJobs.find(job => job.accessCode.toUpperCase() === accessCodeInput.trim().toUpperCase());
        
        setTimeout(() => { // Simulate network delay
            if (foundJob) {
                setServiceJob(foundJob);
            } else {
                setServiceJob(null); // Explicitly set to null if not found
                toast({ variant: "destructive", title: "Kode Tidak Ditemukan", description: "Kode akses servis tidak valid atau tidak ditemukan." });
            }
            setIsLoading(false);
        }, 500);

      } else {
        setServiceJob(null);
        toast({ variant: "destructive", title: "Data Servis Kosong", description: "Belum ada data servis yang tersimpan." });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching service job:", error);
      setServiceJob(null);
      toast({ variant: "destructive", title: "Terjadi Kesalahan", description: "Gagal mengambil data status servis." });
      setIsLoading(false);
    }
  };

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
    return <Badge variant={variant} className={`whitespace-nowrap text-sm py-1 px-3 ${colorClass} text-white`}>{icon}{status}</Badge>;
  };
  
  const maskCustomerName = (name: string) => {
    if (name.length <= 3) return name;
    return `${name.substring(0, 1)}***${name.substring(name.length -1)}`;
  }


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen flex flex-col items-center">
      <PageHeader
        title="Cek Status Servis Kendaraan Anda"
        description="Masukkan kode akses yang Anda terima untuk melihat progres pengerjaan."
      />

      <Card className="w-full max-w-lg shadow-xl mb-6">
        <CardHeader>
          <CardTitle>Masukkan Kode Akses Servis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Contoh: ABC123XYZ"
              value={accessCodeInput}
              onChange={(e) => setAccessCodeInput(e.target.value)}
              className="flex-grow text-lg"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCheckStatus(); }}
            />
            <Button onClick={handleCheckStatus} disabled={isLoading || !accessCodeInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Mencari..." : "Cek Status"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-10">
          <Hourglass className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Sedang memuat status servis Anda...</p>
        </div>
      )}

      {serviceJob === null && !isLoading && (
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kode Tidak Ditemukan</AlertTitle>
          <AlertDescription>
            Pastikan kode akses yang Anda masukkan benar dan coba lagi. Jika masalah berlanjut, hubungi pihak bengkel.
          </AlertDescription>
        </Alert>
      )}

      {serviceJob && !isLoading && (
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <CardTitle className="text-2xl text-primary">Status Servis: {serviceJob.vehiclePlate}</CardTitle>
                    <CardDescription>{serviceJob.vehicleType} (A/N: {maskCustomerName(serviceJob.customerName)})</CardDescription>
                </div>
                {getStatusBadge(serviceJob.status)}
            </div>
             <p className="text-xs text-muted-foreground pt-1">Kode Akses: {serviceJob.accessCode} | Dibuat: {format(new Date(serviceJob.createdAt), "dd MMM yyyy, HH:mm", { locale: localeID })}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {(serviceJob.status === 'Selesai' || serviceJob.status === 'Dibatalkan') ? (
                <Alert variant={serviceJob.status === 'Selesai' ? "default" : "destructive"} className={serviceJob.status === 'Selesai' ? "bg-green-50 border-green-300" : ""}>
                    <Info className="h-4 w-4" />
                    <AlertTitle>
                        {serviceJob.status === 'Selesai' ? "Servis Telah Selesai" : "Servis Dibatalkan"}
                    </AlertTitle>
                    <AlertDescription>
                        {serviceJob.status === 'Selesai' 
                            ? `Kendaraan Anda telah selesai diservis pada ${format(new Date(serviceJob.updatedAt), "dd MMMM yyyy, HH:mm", { locale: localeID })}. Silakan hubungi bengkel untuk pengambilan.`
                            : `Servis untuk kendaraan ini telah dibatalkan pada ${format(new Date(serviceJob.updatedAt), "dd MMMM yyyy, HH:mm", { locale: localeID })}. Silakan hubungi bengkel untuk informasi lebih lanjut.`
                        }
                        {serviceJob.workDoneNotes && serviceJob.status === 'Selesai' && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                                <p className="font-medium text-sm text-foreground">Catatan Akhir Pengerjaan:</p>
                                <p className="text-sm whitespace-pre-wrap">{serviceJob.workDoneNotes}</p>
                            </div>
                        )}
                    </AlertDescription>
                </Alert>
            ) : (
                <>
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground">Estimasi Progres Pengerjaan:</Label>
                        <div className="flex items-center gap-3 mt-1">
                            <Progress value={serviceJob.estimatedProgress || 0} className="w-full h-3" />
                            <span className="text-sm font-semibold text-primary">{serviceJob.estimatedProgress || 0}%</span>
                        </div>
                        {serviceJob.estimatedProgress === 0 && serviceJob.status === 'Antrian' && (
                            <p className="text-xs text-muted-foreground mt-1">Kendaraan Anda dalam antrian dan akan segera dikerjakan.</p>
                        )}
                        {serviceJob.estimatedProgress !== undefined && serviceJob.estimatedProgress > 0 && serviceJob.estimatedProgress < 100 && (
                             <p className="text-xs text-muted-foreground mt-1">Pengerjaan sedang berlangsung.</p>
                        )}
                    </div>

                    {serviceJob.actualStartTime && (
                         <div>
                            <Label className="text-sm font-medium text-muted-foreground">Mulai Dikerjakan Pada:</Label>
                            <p className="text-sm">{format(new Date(serviceJob.actualStartTime), "dd MMMM yyyy, HH:mm", { locale: localeID })}</p>
                        </div>
                    )}
                    
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground">Keluhan Awal Pelanggan:</Label>
                        <p className="text-sm whitespace-pre-wrap p-2 bg-muted/30 rounded-md mt-1">{serviceJob.serviceRequest || "-"}</p>
                    </div>

                    {serviceJob.workDoneNotes && (
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Update & Catatan Pengerjaan dari Mekanik:</Label>
                            <p className="text-sm whitespace-pre-wrap p-2 bg-muted/30 rounded-md mt-1">{serviceJob.workDoneNotes}</p>
                        </div>
                    )}

                    {(serviceJob.status === 'Menunggu Konfirmasi') && (
                        <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-700">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-700">Menunggu Konfirmasi Anda</AlertTitle>
                            <AlertDescription className="text-yellow-600">
                                Ada beberapa hal yang memerlukan konfirmasi Anda sebelum pengerjaan dapat dilanjutkan. Mohon hubungi pihak bengkel.
                            </AlertDescription>
                        </Alert>
                    )}
                 </>
            )}
             <p className="text-xs text-muted-foreground pt-4 border-t mt-4 text-center">
                Update terakhir pada: {format(new Date(serviceJob.updatedAt), "dd MMM yyyy, HH:mm:ss", { locale: localeID })}.
                <br/>Selalu hubungi bengkel untuk informasi paling akurat jika ada keraguan.
            </p>
          </CardContent>
        </Card>
      )}
       <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        BengkelKu App &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

