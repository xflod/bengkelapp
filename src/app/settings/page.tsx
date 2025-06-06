
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Ensuring CardFooter is imported
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ShopSettings } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { Save } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [shopName, setShopName] = useState('');
  const [shopWhatsapp, setShopWhatsapp] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [shopSlogan, setShopSlogan] = useState('');

  const settingsId = 1; // Fixed ID for the single settings row

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('id', settingsId)
      .single();

    if (error && error.code !== 'PGRST116') { 
      toast({ variant: "destructive", title: "Gagal Memuat Pengaturan", description: error.message });
    } else if (data) {
      setShopName(data.shop_name || '');
      setShopWhatsapp(data.shop_whatsapp_number || '');
      setShopAddress(data.shop_address || '');
      setReceiptFooter(data.receipt_footer_text || '');
      setShopSlogan(data.shop_slogan || '');
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const settingsData: Omit<ShopSettings, 'updated_at' | 'id'> & { id: number; updated_at?: string } = {
      id: settingsId,
      shop_name: shopName.trim() || undefined,
      shop_whatsapp_number: shopWhatsapp.trim() || undefined,
      shop_address: shopAddress.trim() || undefined,
      receipt_footer_text: receiptFooter.trim() || undefined,
      shop_slogan: shopSlogan.trim() || undefined,
    };
    
    settingsData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('shop_settings')
      .upsert(settingsData, { onConflict: 'id' });

    if (error) {
      toast({ variant: "destructive", title: "Gagal Menyimpan Pengaturan", description: error.message });
    } else {
      toast({ title: "Pengaturan Disimpan", description: "Pengaturan bengkel berhasil diperbarui." });
      fetchSettings(); 
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat pengaturan bengkel...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Bengkel"
        description="Kelola informasi dasar, kontak, dan tampilan nota bengkel Anda."
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Informasi Bengkel</CardTitle>
          <CardDescription>Detail ini akan digunakan di berbagai bagian aplikasi, termasuk nota.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="shopName">Nama Bengkel</Label>
            <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Contoh: BengkelKu Jaya Abadi" className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="shopWhatsapp">No. WhatsApp Bengkel</Label>
            <Input id="shopWhatsapp" type="tel" value={shopWhatsapp} onChange={(e) => setShopWhatsapp(e.target.value)} placeholder="Contoh: 081234567890" className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="shopAddress">Alamat Bengkel</Label>
            <Textarea id="shopAddress" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="Jalan, nomor, kota, dll." className="mt-1" rows={3}/>
          </div>
          <div>
            <Label htmlFor="receiptFooter">Teks Footer Nota</Label>
            <Textarea id="receiptFooter" value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Contoh: Terima kasih atas kunjungan Anda! Garansi servis 7 hari." className="mt-1" rows={3}/>
          </div>
          <div>
            <Label htmlFor="shopSlogan">Slogan Bengkel</Label>
            <Input id="shopSlogan" value={shopSlogan} onChange={(e) => setShopSlogan(e.target.value)} placeholder="Contoh: Cepat, Tepat, Hemat!" className="mt-1"/>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
