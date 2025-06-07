
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Added Suspense
import { useSearchParams } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Hourglass, PlayCircle, CheckCircle2, AlertCircle, XCircle, Search, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

interface ServiceJob {
  id: number;
  customer_name: string;
  customer_phone?: string;
  vehicle_plate: string;
  vehicle_type: string;
  service_request: string;
  actual_start_time?: string;
  work_done_notes?: string;
  status: 'Antrian' | 'Dikerjakan' | 'Menunggu Konfirmasi' | 'Selesai' | 'Dibatalkan';
  access_code: string;
  created_at: string;
  updated_at: string;
  estimated_progress?: number;
}

// New inner component to handle Suspense
function ServiceStatusContent() {
  const { toast } = useToast();
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [serviceJob, setServiceJob] = useState<ServiceJob | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchParams = useSearchParams();

  const performSearch = useCallback(async (codeToSearch: string) => {
    if (!codeToSearch) {
      toast({ variant: "destructive", title: "Kode Akses Kosong" });
      setIsLoading(false); return;
    }
    setIsLoading(true); setServiceJob(undefined);

    const { data, error } = await supabase
      .from('service_jobs')
      .select('*')
      .eq('access_code', codeToSearch.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching service job by access code:", error);
      setServiceJob(null);
      toast({ variant: "destructive", title: "Terjadi Kesalahan", description: error.message });
    } else if (data) {
      setServiceJob(data as ServiceJob);
    } else {
      setServiceJob(null);
      toast({ variant: "destructive", title: "Kode Tidak Ditemukan" });
    }
    setIsLoading(false);
  }, [toast]);

  const handleManualCheck = () => {
    performSearch(accessCodeInput.trim());
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const codeFromQuery = searchParams.get('code');
      if (codeFromQuery) {
        setAccessCodeInput(codeFromQuery);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (accessCodeInput && serviceJob === undefined && !isLoading) {
      performSearch(accessCodeInput);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessCodeInput, serviceJob, isLoading, performSearch]);


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

  const maskCustomerName = (name?: string) => {
    if (!name || name.length <= 3) return name || 'N/A';
    return `${name.substring(0, 1)}***${name.substring(name.length -1)}`;
  }

  return (
    <>
      <Card className="w-full max-w-lg shadow-xl mb-6">
        <CardHeader><CardTitle>Masukkan Kode Akses Servis</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input type="text" placeholder="Contoh: ABC123XYZ" value={accessCodeInput} onChange={(e) => setAccessCodeInput(e.target.value.toUpperCase())} className="flex-grow text-lg" disabled={isLoading} onKeyDown={(e) => { if (e.key === 'Enter') handleManualCheck(); }}/>
            <Button onClick={handleManualCheck} disabled={isLoading || !accessCodeInput.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Search className="mr-2 h-4 w-4" />{isLoading ? "Mencari..." : "Cek Status"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="text-center py-10">
          <Hourglass className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat status servis...</p>
        </div>
      )}

      {serviceJob === null && !isLoading && (
        <Alert variant="destructive" className="w-full max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kode Tidak Ditemukan</AlertTitle>
          <AlertDescription>Pastikan kode akses benar dan coba lagi.</AlertDescription>
        </Alert>
      )}

      {serviceJob && !isLoading && (
        <Card className="w-full max-w-2xl shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <CardTitle className="text-2xl text-primary">Status Servis: {serviceJob.vehicle_plate}</CardTitle>
                <CardDescription>{serviceJob.vehicle_type} (A/N: {maskCustomerName(serviceJob.customer_name)})</CardDescription>
              </div>
              {getStatusBadge(serviceJob.status)}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Kode Akses: {serviceJob.access_code} | Dibuat: {format(parseISO(serviceJob.created_at), "dd MMM yyyy, HH:mm", { locale: localeID })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {(serviceJob.status === 'Selesai' || serviceJob.status === 'Dibatalkan') ? (
              <Alert variant={serviceJob.status === 'Selesai' ? "default" : "destructive"} className={serviceJob.status === 'Selesai' ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : ""}>
                <Info className="h-4 w-4" />
                <AlertTitle>{serviceJob.status === 'Selesai' ? "Servis Selesai" : "Servis Dibatalkan"}</AlertTitle>
                <AlertDescription>
                  {serviceJob.status === 'Selesai' ? `Kendaraan selesai diservis pada ${format(parseISO(serviceJob.updated_at), "dd MMM yyyy, HH:mm", { locale: localeID })}.` : `Servis dibatalkan pada ${format(parseISO(serviceJob.updated_at), "dd MMM yyyy, HH:mm", { locale: localeID })}.`}
                  {serviceJob.work_done_notes && serviceJob.status === 'Selesai' && (
                    <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
                      <p className="font-medium text-sm text-foreground">Catatan Akhir:</p>
                      <p className="text-sm whitespace-pre-wrap">{serviceJob.work_done_notes}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estimasi Progres:</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Progress value={serviceJob.estimated_progress || 0} className="w-full h-3" />
                    <span className="text-sm font-semibold text-primary">{serviceJob.estimated_progress || 0}%</span>
                  </div>
                  {serviceJob.estimated_progress === 0 && serviceJob.status === 'Antrian' && (
                    <p className="text-xs text-muted-foreground mt-1">Kendaraan Anda sedang dalam antrian pengerjaan.</p>
                  )}
                  {serviceJob.estimated_progress !== undefined && serviceJob.estimated_progress > 0 && serviceJob.estimated_progress < 100 && (
                    <p className="text-xs text-muted-foreground mt-1">Proses pengerjaan sedang berlangsung.</p>
                  )}
                </div>
                
                {serviceJob.actual_start_time && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mulai Dikerjakan:</Label>
                    <p className="text-sm">{format(parseISO(serviceJob.actual_start_time), "dd MMM yyyy, HH:mm", { locale: localeID })}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Keluhan Awal:</Label>
                  <p className="text-sm whitespace-pre-wrap p-2 bg-muted/30 rounded-md mt-1">{serviceJob.service_request || "-"}</p>
                </div>

                {serviceJob.work_done_notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Update dari Mekanik:</Label>
                    <p className="text-sm whitespace-pre-wrap p-2 bg-muted/30 rounded-md mt-1">{serviceJob.work_done_notes}</p>
                  </div>
                )}

                {(serviceJob.status === 'Menunggu Konfirmasi') && (
                  <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertTitle className="text-yellow-700 dark:text-yellow-200">Menunggu Konfirmasi Anda</AlertTitle>
                    <AlertDescription className="text-yellow-600 dark:text-yellow-400">Ada hal yang perlu dikonfirmasi oleh Anda terkait servis ini. Mohon segera hubungi pihak bengkel.</AlertDescription>
                  </Alert>
                )}
              </>
            )}
            <p className="text-xs text-muted-foreground pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 text-center">
              Update terakhir: {format(parseISO(serviceJob.updated_at), "dd MMM yyyy, HH:mm:ss", { locale: localeID })}.
              <br/>Hubungi bengkel untuk informasi yang paling akurat.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function ServiceStatusPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 min-h-screen flex flex-col items-center">
      <PageHeader title="Cek Status Servis Kendaraan Anda" description="Masukkan kode akses yang Anda terima untuk melihat progres pengerjaan."/>
      <Suspense fallback={
        <Card className="w-full max-w-lg shadow-xl text-center py-10">
          <Hourglass className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat detail servis...</p>
        </Card>
      }>
        <ServiceStatusContent />
      </Suspense>
      <footer className="mt-auto pt-8 text-center text-sm text-muted-foreground">
        BengkelKu App &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
