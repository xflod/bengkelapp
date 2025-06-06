
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Supplier } from "@/lib/types";
import { supabase } from '@/lib/supabase';
import { PlusCircle, Edit3, Trash2, Search, ExternalLink, MessageSquare, Truck } from "lucide-react";
import { Label } from '@/components/ui/label';

const DynamicDialog = dynamic(() => import('@/components/ui/dialog').then(mod => mod.Dialog), { ssr: false });
const DynamicDialogContent = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogContent), { ssr: false });
const DynamicDialogHeader = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogHeader), { ssr: false });
const DynamicDialogTitle = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogTitle), { ssr: false });
const DynamicDialogDescription = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogDescription), { ssr: false });
const DynamicDialogFooter = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogFooter), { ssr: false });
const DynamicDialogClose = dynamic(() => import('@/components/ui/dialog').then(mod => mod.DialogClose), { ssr: false });

export default function SuppliersPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('suppliers').select('*').order('name', { ascending: true });
    if (error) {
      console.error("Error fetching suppliers (raw):", JSON.stringify(error, null, 2));
      toast({ variant: "destructive", title: "Gagal Memuat Supplier", description: error.message || "Periksa koneksi atau RLS Supabase." });
      setSuppliers([]);
    } else {
      setSuppliers(data.map(s => ({ ...s, id: String(s.id) })) as Supplier[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const resetFormFields = useCallback(() => {
    setEditingSupplier(null);
    setSupplierName('');
    setContactPerson('');
    setWhatsappNumber('');
    setAddress('');
    setNotes('');
  }, []);

  const handleOpenFormDialog = useCallback((supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierName(supplier.name);
      setContactPerson(supplier.contact_person || '');
      setWhatsappNumber(supplier.whatsapp_number || '');
      setAddress(supplier.address || '');
      setNotes(supplier.notes || '');
    } else {
      resetFormFields();
    }
    setIsFormOpen(true);
  }, [resetFormFields]);

  const handleSaveSupplier = async () => {
    if (!supplierName.trim()) {
      toast({ variant: "destructive", title: "Nama Supplier Wajib Diisi" });
      return;
    }

    const now = new Date().toISOString();
    const supplierData = {
      name: supplierName.trim(),
      contact_person: contactPerson.trim() || undefined,
      whatsapp_number: whatsappNumber.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      updated_at: now,
    };

    if (editingSupplier && editingSupplier.id) {
      const { error } = await supabase.from('suppliers').update(supplierData).match({ id: editingSupplier.id });
      if (error) {
        toast({ variant: "destructive", title: "Gagal Update Supplier", description: error.message });
      } else {
        toast({ title: "Supplier Diperbarui" });
        fetchSuppliers();
      }
    } else {
      const { error } = await supabase.from('suppliers').insert([{ ...supplierData, created_at: now }]);
      if (error) {
        toast({ variant: "destructive", title: "Gagal Tambah Supplier", description: error.message });
      } else {
        toast({ title: "Supplier Ditambahkan" });
        fetchSuppliers();
      }
    }
    setIsFormOpen(false);
  };

  const handleDeleteSupplier = async (supplierId: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus supplier "${name}"?`)) {
      const { error } = await supabase.from('suppliers').delete().match({ id: supplierId });
      if (error) {
        toast({ variant: "destructive", title: "Gagal Hapus Supplier", description: error.message });
      } else {
        toast({ title: "Supplier Dihapus" });
        fetchSuppliers();
      }
    }
  };

  const handleOpenWhatsApp = (number: string) => {
    let cleanNumber = number.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    } else if (!cleanNumber.startsWith('62')) {
      cleanNumber = '62' + cleanNumber;
    }
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  if (isLoading && suppliers.length === 0) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data supplier...</p></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Supplier"
        description="Kelola daftar supplier barang dan jasa untuk bengkel Anda."
        actions={
          <Button onClick={() => handleOpenFormDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Supplier
          </Button>
        }
      />
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Daftar Supplier</CardTitle>
          <div className="mt-2">
            <Input
              type="text"
              placeholder="Cari berdasarkan Nama atau Kontak Person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-1/2 lg:w-1/3"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length > 0 ? (
            <div className="overflow-x-auto max-h-[65vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nama Supplier</TableHead>
                    <TableHead className="min-w-[150px]">Kontak Person</TableHead>
                    <TableHead className="min-w-[150px]">No. WhatsApp</TableHead>
                    <TableHead className="min-w-[200px]">Alamat</TableHead>
                    <TableHead className="text-center w-[180px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person || '-'}</TableCell>
                      <TableCell>
                        {supplier.whatsapp_number ? (
                          <div className="flex items-center gap-2">
                            <span>{supplier.whatsapp_number}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-100" onClick={() => handleOpenWhatsApp(supplier.whatsapp_number!)} title="Chat WhatsApp">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{supplier.address || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center items-center gap-1 flex-wrap">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleOpenFormDialog(supplier)} title="Edit Supplier">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => handleDeleteSupplier(supplier.id, supplier.name)} title="Hapus Supplier">
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
            <Card className="w-full text-center shadow-none border-dashed py-10">
              <CardHeader className="items-center">
                <Truck className="w-16 h-16 text-muted-foreground mb-4" />
                <CardTitle className="text-xl text-foreground">
                  {searchTerm ? "Supplier Tidak Ditemukan" : "Belum Ada Data Supplier"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {searchTerm ? "Tidak ada supplier yang cocok dengan pencarian Anda." : "Klik 'Tambah Supplier' untuk mulai mencatat data supplier Anda."}
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <DynamicDialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetFormFields(); }}>
          <DynamicDialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
            <DynamicDialogHeader className="flex-shrink-0">
              <DynamicDialogTitle>{editingSupplier ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}</DynamicDialogTitle>
              <DynamicDialogDescription>
                {editingSupplier ? `Mengedit detail untuk ${editingSupplier.name}.` : 'Masukkan informasi detail untuk supplier baru.'}
              </DynamicDialogDescription>
            </DynamicDialogHeader>
            <div className="grid gap-y-4 gap-x-4 py-4 flex-grow overflow-y-auto pr-3 text-sm">
              <div>
                <Label htmlFor="supplierNameForm">Nama Supplier <span className="text-destructive">*</span></Label>
                <Input id="supplierNameForm" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="mt-1" placeholder="Nama perusahaan atau perorangan"/>
              </div>
              <div>
                <Label htmlFor="contactPersonForm">Kontak Person</Label>
                <Input id="contactPersonForm" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="mt-1" placeholder="Nama PIC (opsional)"/>
              </div>
              <div>
                <Label htmlFor="whatsappNumberForm">No. WhatsApp</Label>
                <Input id="whatsappNumberForm" type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="mt-1" placeholder="Format: 08xxxxxxxxxx (opsional)"/>
              </div>
              <div>
                <Label htmlFor="addressForm">Alamat</Label>
                <Textarea id="addressForm" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" placeholder="Alamat lengkap supplier (opsional)" rows={3}/>
              </div>
              <div>
                <Label htmlFor="notesForm">Catatan Tambahan</Label>
                <Textarea id="notesForm" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="Informasi lain tentang supplier (opsional)" rows={3}/>
              </div>
            </div>
            <DynamicDialogFooter className="flex-shrink-0 pt-4 border-t">
              <DynamicDialogClose asChild><Button type="button" variant="outline">Batal</Button></DynamicDialogClose>
              <Button type="button" onClick={handleSaveSupplier} className="bg-primary hover:bg-primary/90 text-primary-foreground">Simpan Supplier</Button>
            </DynamicDialogFooter>
          </DynamicDialogContent>
        </DynamicDialog>
      )}
    </div>
  );
}
