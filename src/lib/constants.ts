
import type { NavItem } from '@/lib/types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CalendarDays, 
  Package, 
  BarChartBig, 
  Users, 
  Truck, 
  Briefcase, 
  ClipboardList, 
  ClipboardCheck, 
  ShoppingBag,
  ArchiveRestore,
  BookOpenText,
  PiggyBank,
  ReceiptText
} from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Penjualan',
    href: '/sales',
    icon: ShoppingCart,
  },
  {
    title: 'Penjualan Partner',
    href: '/partner-sales',
    icon: Briefcase,
  },
  {
    title: 'Jasa & Servis',
    href: '/service-sales',
    icon: ClipboardList,
  },
  {
    title: 'Jadwal Servis',
    href: '/schedule',
    icon: CalendarDays,
  },
  {
    title: 'Cek Status Servis',
    href: '/service-status',
    icon: ClipboardCheck,
  },
  {
    title: 'Inventaris',
    href: '/inventory',
    icon: Package,
  },
  {
    title: 'Supplier', // New Supplier Menu Item
    href: '/suppliers',
    icon: Truck, 
  },
  {
    title: 'Order Supplier',
    href: '/supplier-orders',
    icon: ShoppingBag,
  },
  {
    title: 'Penerimaan Barang',
    href: '/goods-receipt',
    icon: ArchiveRestore,
  },
  {
    title: 'Karyawan',
    href: '/employees',
    icon: Users,
  },
  {
    title: 'Buku Keuangan',
    href: '/finance/accounts-ledger',
    icon: BookOpenText,
  },
  {
    title: 'Pengeluaran',
    href: '/finance/expenses',
    icon: ReceiptText,
  },
  {
    title: 'Buku Tabungan',
    href: '/finance/savings',
    icon: PiggyBank,
  },
  {
    title: 'Laporan',
    href: '/reports/profit',
    icon: BarChartBig,
  },
];

