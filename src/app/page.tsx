import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, ShoppingCart, CalendarClock, PackageCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const summaryCards = [
    {
      title: "Total Penjualan Hari Ini",
      value: "Rp 1.250.000",
      icon: DollarSign,
      bgColor: "bg-green-100",
      textColor: "text-green-700",
      description: "+15% dari kemarin",
      dataAiHint: "money graph"
    },
    {
      title: "Pelanggan Dilayani",
      value: "12 Pelanggan",
      icon: Users,
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
      description: "2 servis baru dijadwalkan",
      dataAiHint: "customer interaction"
    },
    {
      title: "Servis Akan Datang",
      value: "5 Servis",
      icon: CalendarClock,
      bgColor: "bg-purple-100",
      textColor: "text-purple-700",
      description: "Lihat Jadwal",
      link: "/schedule",
      dataAiHint: "calendar schedule"
    },
    {
      title: "Stok Menipis",
      value: "3 Item",
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      textColor: "text-red-700",
      description: "Segera pesan ulang",
      link: "/inventory?filter=low_stock",
      dataAiHint: "warning alert"
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard BengkelKu"
        description="Ringkasan aktivitas bengkel Anda."
        actions={
          <Link href="/sales">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buat Transaksi Baru
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.textColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
              {card.link && (
                 <Link href={card.link} className="text-sm text-primary hover:underline mt-2 block">
                   Lihat Detail
                 </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Produk Terlaris</CardTitle>
            <CardDescription>Item yang paling banyak terjual bulan ini.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for best-selling products */}
            <ul className="space-y-3">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="https://placehold.co/40x40.png" alt="Oli Mesin Super" width={40} height={40} className="rounded" data-ai-hint="oil bottle" />
                  <span>Oli Mesin SuperX</span>
                </div>
                <span className="font-semibold text-foreground">120 Terjual</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="https://placehold.co/40x40.png" alt="Kampas Rem" width={40} height={40} className="rounded" data-ai-hint="brake pad" />
                  <span>Kampas Rem Depan YMH</span>
                </div>
                <span className="font-semibold text-foreground">85 Terjual</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="https://placehold.co/40x40.png" alt="Busi Champion" width={40} height={40} className="rounded" data-ai-hint="spark plug" />
                  <span>Busi Champion Z9</span>
                </div>
                <span className="font-semibold text-foreground">70 Terjual</span>
              </li>
            </ul>
            <Link href="/inventory" className="mt-4 inline-block">
              <Button variant="outline">Lihat Semua Inventaris</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-primary">Aktivitas Terkini</CardTitle>
            <CardDescription>Log transaksi dan jadwal servis terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activities */}
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-500" />
                <span>Penjualan <span className="font-semibold">#INV1203</span> - Rp 250.000</span>
                <span className="ml-auto text-xs text-muted-foreground">5 menit lalu</span>
              </li>
              <li className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-500" />
                <span>Jadwal servis baru untuk <span className="font-semibold">Budi S.</span></span>
                <span className="ml-auto text-xs text-muted-foreground">1 jam lalu</span>
              </li>
              <li className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-purple-500" />
                <span>Stok <span className="font-semibold">Oli Mesin SuperX</span> diperbarui</span>
                <span className="ml-auto text-xs text-muted-foreground">3 jam lalu</span>
              </li>
            </ul>
             <Link href="/sales" className="mt-4 inline-block">
              <Button variant="outline">Lihat Semua Aktivitas</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
